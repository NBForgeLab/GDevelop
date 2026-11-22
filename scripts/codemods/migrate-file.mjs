#!/usr/bin/env node
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';
import { convertFlowAstToTsAst, generateFlowStub } from './flow-to-ts-ast.mjs';
import { postprocessTypeScriptSource } from './gdevelop-flow-to-ts-postprocess.mjs';

const require = createRequire(
  new URL('../../newIDE/app/package.json', import.meta.url)
);

const prettier = require('prettier');
const ts = require('typescript');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '../..');
const APP_DIR = path.join(REPO_ROOT, 'newIDE', 'app');
const SRC_DIR = path.join(APP_DIR, 'src');
const PRETTIER_CONFIG_PATH = path.join(APP_DIR, '.prettierrc');

function loadPrettierOptions() {
  try {
    return JSON.parse(fs.readFileSync(PRETTIER_CONFIG_PATH, 'utf8'));
  } catch {
    return { singleQuote: true, trailingComma: 'es5', endOfLine: 'auto' };
  }
}

export function resolveTargetInputPath(inputPath, cwd = process.cwd()) {
  const candidates = [
    path.resolve(cwd, inputPath),
    path.resolve(APP_DIR, inputPath),
    path.resolve(REPO_ROOT, inputPath),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  return path.resolve(cwd, inputPath);
}

function collectInputFiles(rawTargets, cwd = process.cwd()) {
  const files = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'locales' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        walk(full);
      } else if (
        (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) &&
        !entry.name.endsWith('.js.flow')
      ) {
        files.push(full);
      }
    }
  };

  for (const raw of rawTargets) {
    const resolved = resolveTargetInputPath(raw, cwd);
    if (!fs.existsSync(resolved)) {
      throw new Error(`Input path not found: ${raw}`);
    }
    const stat = fs.statSync(resolved);
    if (stat.isDirectory()) {
      walk(resolved);
    } else {
      files.push(resolved);
    }
  }
  return files;
}

function isTestOrStoryPath(filePath) {
  const norm = filePath.replace(/\\/g, '/');
  return (
    /\.(spec|test)\.(js|jsx|ts|tsx)$/.test(norm) ||
    /\.stories\.(js|jsx|ts|tsx)$/.test(norm) ||
    norm.includes('/__tests__/') ||
    norm.includes('/__mocks__/')
  );
}

function buildFlowConsumerSet(excludedFiles = new Set()) {
  const importedModules = new Set();
  if (!fs.existsSync(SRC_DIR)) return importedModules;

  const normPath = (p) => path.resolve(p).replace(/\\/g, '/').toLowerCase();
  const excludedNorm = new Set([...excludedFiles].map(normPath));

  const jsFiles = [];
  const walk = (dir) => {
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      if (entry.name === 'locales' || entry.name === 'node_modules') continue;
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (
        (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) &&
        !entry.name.endsWith('.js.flow')
      ) {
        if (!excludedNorm.has(normPath(full))) {
          jsFiles.push(full);
        }
      }
    }
  };
  walk(SRC_DIR);

  const importRe =
    /(?:import\s+(?:[^'"]*?\s+from\s+)?|export\s+[^'"]*?\s+from\s+|(?:require|import|jest\.(?:mock|unmock|requireActual|doMock))\s*\(\s*)['"](\.[^'"]+)['"]/g;

  for (const file of jsFiles) {
    const text = fs.readFileSync(file, 'utf8');
    const dir = path.dirname(file);
    let match;
    while ((match = importRe.exec(text)) !== null) {
      const spec = match[1];
      const base = path.resolve(dir, spec);
      importedModules.add(base);
      importedModules.add(base.replace(/\.(js|jsx|ts|tsx)$/, ''));
    }
    importRe.lastIndex = 0;
  }
  return importedModules;
}

function hasRemainingFlowConsumers(sourcePath, consumerSet) {
  const normSource = path.resolve(sourcePath);
  const withoutExt = normSource.replace(/\.(js|jsx|ts|tsx)$/, '');
  if (consumerSet.has(normSource) || consumerSet.has(withoutExt)) {
    return true;
  }
  if (path.basename(withoutExt) === 'index') {
    const parentDir = path.dirname(withoutExt);
    if (consumerSet.has(parentDir)) return true;
  }
  return false;
}

function createTsCheckerContext() {
  const configPath = path.join(APP_DIR, 'tsconfig.json');
  const configResult = ts.readConfigFile(configPath, ts.sys.readFile);
  if (configResult.error) {
    throw new Error(
      ts.flattenDiagnosticMessageText(configResult.error.messageText, '\n')
    );
  }
  const parsed = ts.parseJsonConfigFileContent(
    configResult.config,
    ts.sys,
    APP_DIR
  );

  const virtualFiles = new Map();
  const hiddenFiles = new Set();
  const versions = new Map();
  const extraFiles = new Set();

  const normKey = (p) => path.resolve(p).replace(/\\/g, '/').toLowerCase();

  const servicesHost = {
    getScriptFileNames: () => {
      const base = parsed.fileNames.filter((f) => !hiddenFiles.has(normKey(f)));
      const seen = new Set(base.map(normKey));
      for (const f of extraFiles) {
        if (!seen.has(normKey(f))) {
          base.push(f);
          seen.add(normKey(f));
        }
      }
      return base;
    },
    getScriptVersion: (fileName) => String(versions.get(normKey(fileName)) || '0'),
    getScriptSnapshot: (fileName) => {
      const k = normKey(fileName);
      if (hiddenFiles.has(k)) return undefined;
      const content = virtualFiles.has(k)
        ? virtualFiles.get(k)
        : ts.sys.readFile(fileName);
      return content !== undefined
        ? ts.ScriptSnapshot.fromString(content)
        : undefined;
    },
    getCurrentDirectory: () => APP_DIR,
    getCompilationSettings: () => parsed.options,
    getDefaultLibFileName: (opts) => ts.getDefaultLibFilePath(opts),
    fileExists: (fileName) => {
      const k = normKey(fileName);
      if (hiddenFiles.has(k)) return false;
      return virtualFiles.has(k) || ts.sys.fileExists(fileName);
    },
    readFile: (fileName) => {
      const k = normKey(fileName);
      if (hiddenFiles.has(k)) return undefined;
      return virtualFiles.has(k) ? virtualFiles.get(k) : ts.sys.readFile(fileName);
    },
    readDirectory: ts.sys.readDirectory,
    directoryExists: ts.sys.directoryExists,
    getDirectories: ts.sys.getDirectories,
  };

  const service = ts.createLanguageService(
    servicesHost,
    ts.createDocumentRegistry()
  );

  return {
    checkVirtualFile(targetPath, sourceText, replacedSourcePath) {
      const targetKey = normKey(targetPath);
      const oldKey = replacedSourcePath ? normKey(replacedSourcePath) : null;
      if (oldKey && oldKey !== targetKey) hiddenFiles.add(oldKey);

      const dtsCandidate =
        replacedSourcePath &&
        replacedSourcePath.replace(/\.(js|jsx)$/, '.d.ts');
      if (dtsCandidate && fs.existsSync(dtsCandidate)) {
        hiddenFiles.add(normKey(dtsCandidate));
      }

      virtualFiles.set(targetKey, sourceText);
      extraFiles.add(targetPath);
      versions.set(targetKey, (versions.get(targetKey) || 0) + 1);

      const rawDiags = [
        ...service.getSyntacticDiagnostics(targetPath),
        ...service.getSemanticDiagnostics(targetPath),
      ];

      return rawDiags.map((d) => {
        const lineChar =
          d.file && d.start !== undefined
            ? d.file.getLineAndCharacterOfPosition(d.start)
            : { line: 0, character: 0 };
        return {
          code: d.code,
          line: lineChar.line + 1,
          column: lineChar.character + 1,
          message: ts.flattenDiagnosticMessageText(d.messageText, '\n'),
        };
      });
    },
    releaseVirtualFile(targetPath, replacedSourcePath) {
      const targetKey = normKey(targetPath);
      virtualFiles.delete(targetKey);
      extraFiles.delete(targetPath);
      if (replacedSourcePath) {
        hiddenFiles.delete(normKey(replacedSourcePath));
        const dtsCandidate = replacedSourcePath.replace(/\.(js|jsx)$/, '.d.ts');
        if (dtsCandidate !== replacedSourcePath) {
          hiddenFiles.delete(normKey(dtsCandidate));
        }
      }
    },
  };
}

function pruneUnusedFlowMigratedExpectErrors(code, diagnostics) {
  const unusedLines = new Set(
    diagnostics.filter((d) => d.code === 2578).map((d) => d.line)
  );
  if (unusedLines.size === 0) return { code, prunedCount: 0 };

  const eol = code.includes('\r\n') ? '\r\n' : '\n';
  const lines = code.split(/\r?\n/);
  const kept = [];
  let prunedCount = 0;

  for (let i = 0; i < lines.length; i++) {
    const lineNum = i + 1;
    const line = lines[i];
    if (
      unusedLines.has(lineNum) &&
      /@ts-expect-error\s+\[flow-migrated/.test(line)
    ) {
      // Preserve any human explanation attached to a standalone line comment
      const standaloneLineMatch = line.match(
        /^(\s*)\/\/\s*@ts-expect-error\s+\[flow-migrated(?::[^\]]+)?\]\s*(?:[-:]\s*)?(.*?)\s*$/
      );
      if (standaloneLineMatch) {
        prunedCount++;
        const [, indent, reason] = standaloneLineMatch;
        if (reason) {
          kept.push(`${indent}// ${reason}`);
        }
        continue;
      }
      // Standalone JSX comment `{/* @ts-expect-error ... */}`
      const standaloneJsxMatch = line.match(
        /^(\s*)\{\s*\/\*\s*@ts-expect-error\s+\[flow-migrated(?::[^\]]+)?\]\s*(?:[-:]\s*)?(.*?)\s*\*\/\s*\}\s*$/
      );
      if (standaloneJsxMatch) {
        prunedCount++;
        const [, indent, reason] = standaloneJsxMatch;
        if (reason) {
          kept.push(`${indent}{/* ${reason} */}`);
        }
        continue;
      }
      // Inline trailing comment
      const stripped = line.replace(
        /\s*(?:\/\/\s*@ts-expect-error\s+\[flow-migrated[^\n]*|\/\*\s*@ts-expect-error\s+\[flow-migrated[^*]*\*\/)\s*$/,
        ''
      );
      if (stripped !== line) {
        prunedCount++;
        kept.push(stripped);
        continue;
      }
    }
    kept.push(line);
  }

  return { code: kept.join(eol), prunedCount };
}

function runStage1Khan(sourcePath, originalSource) {
  let cliPath;
  try {
    cliPath = require.resolve('@khanacademy/flow-to-ts/bin/flow-to-ts.js');
  } catch {
    throw new Error(
      '@khanacademy/flow-to-ts is not installed in newIDE/app/node_modules. Use default --stage1=ast or install @khanacademy/flow-to-ts.'
    );
  }
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-khan-'));
  try {
    const tmpInput = path.join(tmpDir, path.basename(sourcePath));
    fs.writeFileSync(tmpInput, originalSource, 'utf8');
    const tmpOutput = execFileSync(
      process.execPath,
      [cliPath, '--write', '--inline', tmpInput],
      { encoding: 'utf8' }
    );
    const writtenCandidate = [
      tmpInput.replace(/\.(js|jsx)$/, '.tsx'),
      tmpInput.replace(/\.(js|jsx)$/, '.ts'),
      tmpInput,
    ].find((p) => fs.existsSync(p));
    const resultCode = writtenCandidate
      ? fs.readFileSync(writtenCandidate, 'utf8')
      : tmpOutput || originalSource;
    return {
      code: resultCode,
      hasJsx: /<[A-Za-z>]/.test(originalSource),
    };
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}

function computeTargetPath(sourcePath, hasJsx) {
  if (sourcePath.endsWith('.tsx') || sourcePath.endsWith('.ts')) {
    return sourcePath;
  }
  const ext = hasJsx || sourcePath.endsWith('.jsx') ? '.tsx' : '.ts';
  return sourcePath.replace(/\.(js|jsx)$/, ext);
}

function findMatchingSnapshot(sourcePath) {
  const dir = path.dirname(sourcePath);
  const base = path.basename(sourcePath);
  const candidates = [
    path.join(dir, `${base}.snap`),
    path.join(dir, '__snapshots__', `${base}.snap`),
  ];
  return candidates.filter((c) => fs.existsSync(c));
}

function findCompanionDts(sourcePath) {
  const norm = sourcePath.replace(/\\/g, '/');
  if (norm.includes('/EditorFunctions/PublicApi/')) return null;
  const candidate = sourcePath.replace(/\.(js|jsx)$/, '.d.ts');
  return candidate !== sourcePath && fs.existsSync(candidate)
    ? candidate
    : null;
}

export async function migrateSingleFile(sourcePath, options = {}) {
  const {
    dryRun = false,
    stdout = false,
    usePrettier = true,
    useTsc = true,
    keepUnusedExpectError = false,
    swapForwardRef = true,
    flowStubMode = 'auto',
    overwriteFlowStub = false,
    phase = null,
    keepSource = false,
    cleanupDts = true,
    stage1 = 'ast',
    tsChecker = null,
    flowConsumers = null,
    prettierOptions = loadPrettierOptions(),
  } = options;

  const originalSource = fs.readFileSync(sourcePath, 'utf8');

  // Stage 1: Flow AST -> TS AST
  const stage1Result =
    stage1 === 'khan'
      ? runStage1Khan(sourcePath, originalSource)
      : convertFlowAstToTsAst(originalSource);

  const hasJsx =
    stage1Result.hasJsx || sourcePath.endsWith('.jsx') || sourcePath.endsWith('.tsx');
  const targetPath = computeTargetPath(sourcePath, hasJsx);

  // Stage 2: GDevelop custom AST & comment post-processing
  const stage2Result = postprocessTypeScriptSource(stage1Result.code, {
    swapForwardRef,
    useJsx: hasJsx,
  });

  let finalCode = stage2Result.code;

  // Stage 3a: Prettier 3.4.2 formatting
  if (usePrettier) {
    finalCode = await prettier.format(finalCode, {
      ...prettierOptions,
      filepath: targetPath,
    });
  }

  // Stage 3b: TypeScript diagnostics + automatic unused suppression pruning
  let diagnostics = [];
  let prunedExpectErrors = 0;

  if (useTsc && tsChecker) {
    diagnostics = tsChecker.checkVirtualFile(targetPath, finalCode, sourcePath);
    if (!keepUnusedExpectError) {
      for (let pass = 0; pass < 4; pass++) {
        const pruned = pruneUnusedFlowMigratedExpectErrors(
          finalCode,
          diagnostics
        );
        if (pruned.prunedCount === 0) break;
        prunedExpectErrors += pruned.prunedCount;
        finalCode = pruned.code;
        if (usePrettier) {
          finalCode = await prettier.format(finalCode, {
            ...prettierOptions,
            filepath: targetPath,
          });
        }
        diagnostics = tsChecker.checkVirtualFile(
          targetPath,
          finalCode,
          sourcePath
        );
      }
    }
    tsChecker.releaseVirtualFile(targetPath, sourcePath);
  }

  // Determine stub / snapshot / companion cleanup actions
  const snapshotsToRename = findMatchingSnapshot(sourcePath).map((snapPath) => ({
    from: snapPath,
    to: snapPath.replace(
      `${path.basename(sourcePath)}.snap`,
      `${path.basename(targetPath)}.snap`
    ),
  }));
  const companionDtsToDelete = cleanupDts ? findCompanionDts(sourcePath) : null;

  let flowStubPath = null;
  let flowStubCode = null;
  const shouldCheckFlowStub =
    flowStubMode === 'always' ||
    (flowStubMode === 'auto' &&
      !isTestOrStoryPath(sourcePath) &&
      flowConsumers &&
      hasRemainingFlowConsumers(sourcePath, flowConsumers));

  if (shouldCheckFlowStub) {
    const candidateStub = sourcePath.replace(/\.(js|jsx|ts|tsx)$/, '.js.flow');
    if (overwriteFlowStub || !fs.existsSync(candidateStub)) {
      flowStubPath = candidateStub;
      flowStubCode = generateFlowStub(originalSource, { phase }).code;
    }
  }

  if (!dryRun && !stdout) {
    fs.writeFileSync(targetPath, finalCode, 'utf8');
    if (!keepSource && targetPath !== sourcePath && fs.existsSync(sourcePath)) {
      fs.unlinkSync(sourcePath);
    }
    for (const snap of snapshotsToRename) {
      if (snap.from !== snap.to && fs.existsSync(snap.from)) {
        fs.renameSync(snap.from, snap.to);
      }
    }
    if (companionDtsToDelete && fs.existsSync(companionDtsToDelete)) {
      fs.unlinkSync(companionDtsToDelete);
    }
    if (flowStubPath && flowStubCode !== null) {
      fs.writeFileSync(flowStubPath, flowStubCode, 'utf8');
    }
  }

  return {
    sourcePath,
    targetPath,
    hasJsx,
    code: finalCode,
    diagnostics,
    prunedExpectErrors,
    stats: stage2Result.stats,
    snapshotsToRename,
    companionDtsToDelete,
    flowStubPath,
  };
}

function parseCliArgs(argv) {
  const opts = {
    targets: [],
    dryRun: false,
    stdout: false,
    usePrettier: true,
    useTsc: true,
    strictTsc: false,
    keepUnusedExpectError: false,
    swapForwardRef: true,
    flowStubMode: 'auto',
    overwriteFlowStub: false,
    phase: null,
    keepSource: false,
    cleanupDts: true,
    stage1: 'ast',
    quiet: false,
    help: false,
  };

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') opts.help = true;
    else if (arg === '--dry-run') opts.dryRun = true;
    else if (arg === '--stdout') {
      opts.stdout = true;
      opts.dryRun = true;
    } else if (arg === '--no-prettier') opts.usePrettier = false;
    else if (arg === '--no-tsc') opts.useTsc = false;
    else if (arg === '--strict-tsc') opts.strictTsc = true;
    else if (arg === '--keep-unused-expect-error') {
      opts.keepUnusedExpectError = true;
    } else if (arg === '--no-swap-forward-ref') opts.swapForwardRef = false;
    else if (arg === '--emit-flow-stub') opts.flowStubMode = 'always';
    else if (arg === '--no-flow-stub') opts.flowStubMode = 'never';
    else if (arg === '--overwrite-flow-stub') opts.overwriteFlowStub = true;
    else if (arg === '--keep-source') opts.keepSource = true;
    else if (arg === '--no-cleanup-dts') opts.cleanupDts = false;
    else if (arg === '--quiet') opts.quiet = true;
    else if (arg.startsWith('--phase=')) opts.phase = arg.slice('--phase='.length);
    else if (arg === '--phase' && i + 1 < argv.length) opts.phase = argv[++i];
    else if (arg.startsWith('--stage1=')) {
      opts.stage1 = arg.slice('--stage1='.length);
    } else if (arg === '--stage1' && i + 1 < argv.length) {
      opts.stage1 = argv[++i];
    } else if (arg.startsWith('--flow-stub=')) {
      opts.flowStubMode = arg.slice('--flow-stub='.length);
    } else if (arg.startsWith('-')) {
      throw new Error(`Unknown option: ${arg}`);
    } else {
      opts.targets.push(arg);
    }
  }
  return opts;
}

function printHelp() {
  console.log(`Usage: node scripts/codemods/migrate-file.mjs [options] <file-or-dir...>

Executes the 3-stage GDevelop Flow-to-TypeScript migration pipeline:
  Stage 1: Flow AST -> TypeScript AST conversion (flow-to-ts-ast.mjs)
  Stage 2: GDevelop custom AST post-processing (gdevelop-flow-to-ts-postprocess.mjs)
  Stage 3: Prettier 3.4.2 formatting, companion stub handling, and tsc validation

Options:
  --dry-run                  Run conversion & tsc validation without writing files
  --stdout                   Print converted TypeScript to stdout (implies --dry-run)
  --no-prettier              Skip Prettier 3.4.2 formatting
  --no-tsc                   Skip TypeScript validation & TS2578 suppression pruning
  --strict-tsc               Exit with code 1 if any tsc diagnostics remain
  --keep-unused-expect-error Keep @ts-expect-error directives flagged as unused (TS2578)
  --emit-flow-stub           Always emit a transitional <name>.js.flow stub
  --no-flow-stub             Never emit a transitional <name>.js.flow stub
  --overwrite-flow-stub      Overwrite existing <name>.js.flow stub if present
  --phase=<N>                Tag generated .js.flow stub with [Phase N]
  --keep-source              Keep original .js/.jsx file after writing .ts/.tsx
  --no-cleanup-dts           Do not remove companion <name>.d.ts stub
  --stage1=ast|khan          Stage 1 engine (default: ast)
  --quiet                    Minimal output
`);
}

async function main() {
  const opts = parseCliArgs(process.argv.slice(2));
  if (opts.help || opts.targets.length === 0) {
    printHelp();
    process.exit(opts.help ? 0 : 1);
  }

  const inputFiles = collectInputFiles(opts.targets, process.cwd());
  if (inputFiles.length === 0) {
    console.error('No eligible .js/.jsx files found.');
    process.exit(1);
  }

  const tsChecker = opts.useTsc ? createTsCheckerContext() : null;
  const flowConsumers =
    opts.flowStubMode === 'auto'
      ? buildFlowConsumerSet(new Set(inputFiles))
      : null;
  const prettierOptions = loadPrettierOptions();

  let totalDiagnostics = 0;

  for (const filePath of inputFiles) {
    const result = await migrateSingleFile(filePath, {
      ...opts,
      tsChecker,
      flowConsumers,
      prettierOptions,
    });

    if (opts.stdout) {
      process.stdout.write(result.code);
      continue;
    }

    const relFrom = path.relative(REPO_ROOT, result.sourcePath);
    const relTo = path.relative(REPO_ROOT, result.targetPath);
    if (!opts.quiet) {
      const prefix = opts.dryRun ? '[dry-run] ' : '';
      console.log(
        `${prefix}${relFrom} -> ${relTo} (forwardRefSwapped=${result.stats.forwardRefsSwapped}, unnamedParams=${result.stats.unnamedParamsFixed}, suppressions=${result.stats.suppressionsMapped}, prunedUnused=${result.prunedExpectErrors})`
      );
      if (result.flowStubPath) {
        console.log(
          `  ${prefix}Flow stub: ${path.relative(REPO_ROOT, result.flowStubPath)}`
        );
      }
      if (result.companionDtsToDelete) {
        console.log(
          `  ${prefix}Removed companion .d.ts: ${path.relative(
            REPO_ROOT,
            result.companionDtsToDelete
          )}`
        );
      }
      for (const snap of result.snapshotsToRename) {
        console.log(
          `  ${prefix}Renamed snapshot: ${path.relative(
            REPO_ROOT,
            snap.from
          )} -> ${path.relative(REPO_ROOT, snap.to)}`
        );
      }
    }

    if (result.diagnostics.length > 0) {
      totalDiagnostics += result.diagnostics.length;
      console.warn(
        `  TypeScript diagnostics (${result.diagnostics.length}) in ${relTo}:`
      );
      for (const d of result.diagnostics) {
        console.warn(`    ${relTo}:${d.line}:${d.column} - TS${d.code}: ${d.message}`);
      }
    }
  }

  if (opts.strictTsc && totalDiagnostics > 0) {
    process.exit(1);
  }
}

const isExecutedDirectly =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url));

if (isExecutedDirectly) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
