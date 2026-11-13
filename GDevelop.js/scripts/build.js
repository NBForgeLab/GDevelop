#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');

const DEFAULT_GDEVELOP_JS_ROOT = path.resolve(__dirname, '..');

const POSSIBLE_VARIANTS = [
  'release',
  'dev',
  'debug',
  'debug-assertions',
  'debug-sanitizers',
];

const WINDOWS_MINGW_MAKE_EXE = 'C:\\MinGW\\bin\\mingw32-make.exe';
const WINDOWS_MINGW_MAKE_BINARY = 'C:\\MinGW\\bin\\mingw32-make';
const WINDOWS_CMAKE_PATHS = [
  'C:\\Program Files\\CMake\\bin\\cmake.exe',
  'C:\\Program Files (x86)\\CMake\\bin\\cmake.exe',
];

/**
 * Resolve all paths used for the GDevelop.js build and bindings generation.
 * @param {string} [gdevelopJsRoot]
 */
function getBuildPaths(gdevelopJsRoot = DEFAULT_GDEVELOP_JS_ROOT) {
  const resolvedRoot = path.resolve(gdevelopJsRoot);
  const buildPath = path.resolve(resolvedRoot, '../Binaries/embuild');
  const buildOutputPath = path.resolve(
    resolvedRoot,
    '../Binaries/embuild/GDevelop.js'
  );

  return {
    gdevelopJsRoot: resolvedRoot,
    buildPath,
    buildOutputPath,
    bindingsIdlPath: path.join(resolvedRoot, 'Bindings', 'Bindings.idl'),
    glueCppPath: path.join(resolvedRoot, 'Bindings', 'glue.cpp'),
    glueJsPath: path.join(resolvedRoot, 'Bindings', 'glue.js'),
    ninjaBinary: path.join(resolvedRoot, 'ninja', 'ninja.exe'),
  };
}

/**
 * Parse and validate CLI arguments for the build script.
 * @param {string[]} [argv]
 */
function parseBuildArgs(argv = process.argv.slice(2)) {
  let explicitVariant = null;
  let hasDevFlag = false;
  let useMinGW = false;
  let raw = false;
  let dryRun = false;
  let help = false;

  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--dev') {
      hasDevFlag = true;
    } else if (arg === '--use-MinGW') {
      useMinGW = true;
    } else if (arg === '--raw') {
      raw = true;
    } else if (arg === '--dry-run') {
      dryRun = true;
    } else if (arg === '--variant') {
      const nextArg = argv[i + 1];
      if (nextArg === undefined || nextArg.startsWith('-')) {
        throw new Error(
          `Missing value for --variant. Possible values are: ${POSSIBLE_VARIANTS.join(
            ', '
          )}.`
        );
      }
      explicitVariant = nextArg;
      i++;
    } else if (arg.startsWith('--variant=')) {
      explicitVariant = arg.slice('--variant='.length);
    } else {
      throw new Error(`Unknown argument: ${arg}`);
    }
  }

  const variant =
    explicitVariant !== null ? explicitVariant : hasDevFlag ? 'dev' : 'release';

  if (!POSSIBLE_VARIANTS.includes(variant)) {
    throw new Error(
      `Invalid build variant: ${variant}. Possible values are: ${POSSIBLE_VARIANTS.join(
        ', '
      )}.`
    );
  }

  return {
    variant,
    useMinGW,
    raw,
    dryRun,
    help,
  };
}

/**
 * Resolve CMake and make binaries/arguments for the target platform.
 * @param {object} [options]
 */
function resolveToolchainConfiguration({
  platform = process.platform,
  useMinGW = false,
  gdevelopJsRoot = DEFAULT_GDEVELOP_JS_ROOT,
  fileExists = fs.existsSync,
  warn = console.log,
} = {}) {
  const isWin = /^win/.test(platform);

  let cmakeBinary = 'emcmake cmake';
  let cmakeGeneratorArgs = [];
  let makeBinary = 'emmake make';
  let makeArgs = ['-j 8'];

  // Use more specific paths on Windows
  if (isWin) {
    let makeProgram = '';
    if (useMinGW) {
      // Use make from MinGW
      if (!fileExists(WINDOWS_MINGW_MAKE_EXE)) {
        throw new Error(
          "🔴 Can't find mingw32-make in C:\\MinGW. Make sure MinGW is installed."
        );
      }
      cmakeGeneratorArgs = ['-G "MinGW Makefiles"'];
      makeProgram = WINDOWS_MINGW_MAKE_BINARY;
    } else {
      // Use Ninja (by default)
      const ninjaBinary = path.join(gdevelopJsRoot, 'ninja', 'ninja.exe');
      cmakeGeneratorArgs = [
        '-G "Ninja"',
        `-DCMAKE_MAKE_PROGRAM="${ninjaBinary}"`,
      ];
      makeProgram = ninjaBinary;
    }

    makeBinary = `emmake "${makeProgram}"`;
    makeArgs = [];

    // Find CMake in usual folders or fallback to PATH.
    const foundCmakePath = WINDOWS_CMAKE_PATHS.find((candidate) =>
      fileExists(candidate)
    );
    if (foundCmakePath) {
      cmakeBinary = `emcmake "${foundCmakePath.replace(/\.exe$/i, '')}"`;
    } else {
      warn(
        "⚠️ Can't find CMake in its usual Program Files folder. Make sure you have cmake in your PATH instead."
      );
    }
  }

  return {
    isWin,
    cmakeBinary,
    cmakeGeneratorArgs,
    makeBinary,
    makeArgs,
  };
}

/**
 * Construct the CMake configure command string.
 * @param {object} options
 */
function buildCmakeCommand({ cmakeBinary, cmakeGeneratorArgs, variant }) {
  return [
    cmakeBinary,
    ...cmakeGeneratorArgs,
    '../..',
    // Disable link time optimizations for slightly faster build time.
    variant ? `-DGDEVELOPJS_BUILD_VARIANT=${variant}` : '',
  ]
    .filter(Boolean)
    .join(' ');
}

/**
 * Construct the build tool (`make` / `ninja` / `mingw32-make`) command string.
 * @param {object} options
 */
function buildMakeCommand({ makeBinary, makeArgs }) {
  return [makeBinary, ...makeArgs].filter(Boolean).join(' ');
}

function getMtimeMs(stat) {
  if (stat && typeof stat.mtimeMs === 'number') {
    return stat.mtimeMs;
  }
  if (stat && stat.mtime instanceof Date) {
    return stat.mtime.getTime();
  }
  throw new TypeError('Invalid stat object: missing mtimeMs or mtime.');
}

/**
 * Check whether `Bindings/Bindings.idl` is newer than `Bindings/glue.cpp` or `Bindings/glue.js`,
 * or if either generated file is missing.
 * @param {object} [options]
 */
function shouldUpdateBindings({
  gdevelopJsRoot = DEFAULT_GDEVELOP_JS_ROOT,
  statSync = fs.statSync,
} = {}) {
  const { bindingsIdlPath, glueCppPath, glueJsPath } =
    getBuildPaths(gdevelopJsRoot);

  let idlStat;
  try {
    idlStat = statSync(bindingsIdlPath);
  } catch (error) {
    if (error && error.code === 'ENOENT') {
      throw new Error(`Bindings IDL file not found at: ${bindingsIdlPath}`);
    }
    throw error;
  }
  const idlMtimeMs = getMtimeMs(idlStat);

  for (const outputPath of [glueCppPath, glueJsPath]) {
    let outputStat;
    try {
      outputStat = statSync(outputPath);
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        return {
          shouldUpdate: true,
          reason: `Missing ${path.relative(gdevelopJsRoot, outputPath)}`,
        };
      }
      throw error;
    }

    if (idlMtimeMs > getMtimeMs(outputStat)) {
      return {
        shouldUpdate: true,
        reason: `${path.relative(
          gdevelopJsRoot,
          bindingsIdlPath
        )} is newer than ${path.relative(gdevelopJsRoot, outputPath)}`,
      };
    }
  }

  return {
    shouldUpdate: false,
    reason: 'Bindings/glue.cpp and Bindings/glue.js are up to date.',
  };
}

/**
 * Build the ordered list of build steps without executing side effects.
 * @param {object} [options]
 */
function createBuildPlan({
  variant = 'release',
  useMinGW = false,
  raw = false,
  platform = process.platform,
  gdevelopJsRoot = DEFAULT_GDEVELOP_JS_ROOT,
  fileExists = fs.existsSync,
  statSync = fs.statSync,
  warn = console.log,
} = {}) {
  if (!POSSIBLE_VARIANTS.includes(variant)) {
    throw new Error(
      `Invalid build variant: ${variant}. Possible values are: ${POSSIBLE_VARIANTS.join(
        ', '
      )}.`
    );
  }

  const paths = getBuildPaths(gdevelopJsRoot);
  const toolchain = resolveToolchainConfiguration({
    platform,
    useMinGW,
    gdevelopJsRoot: paths.gdevelopJsRoot,
    fileExists,
    warn,
  });

  const cmakeCommand = buildCmakeCommand({
    cmakeBinary: toolchain.cmakeBinary,
    cmakeGeneratorArgs: toolchain.cmakeGeneratorArgs,
    variant,
  });
  const makeCommand = buildMakeCommand({
    makeBinary: toolchain.makeBinary,
    makeArgs: toolchain.makeArgs,
  });

  const rawSteps = [
    {
      id: 'mkdir',
      type: 'mkdir',
      path: paths.buildPath,
    },
    {
      id: 'cmake',
      type: 'shell',
      command: cmakeCommand,
      cwd: paths.buildPath,
    },
    {
      id: 'updateGDBindings',
      type: 'node',
      script: 'update-bindings.js',
      cwd: paths.gdevelopJsRoot,
      shouldRun: () =>
        shouldUpdateBindings({
          gdevelopJsRoot: paths.gdevelopJsRoot,
          statSync,
        }),
    },
    {
      id: 'make',
      type: 'shell',
      command: makeCommand,
      cwd: paths.buildPath,
    },
  ];

  const steps = raw
    ? rawSteps
    : [
        {
          id: 'syncVersions',
          type: 'node',
          script: 'scripts/sync-versions.js',
          cwd: paths.gdevelopJsRoot,
        },
        ...rawSteps,
        {
          id: 'copyToNewIDE',
          type: 'node',
          script: 'scripts/copy-to-newIDE.js',
          cwd: paths.gdevelopJsRoot,
        },
        {
          id: 'generateFlowTypes',
          type: 'node',
          script: 'scripts/generate-types.js',
          cwd: paths.gdevelopJsRoot,
        },
        {
          id: 'generateTSTypes',
          type: 'node',
          script: 'scripts/generate-dts.mjs',
          cwd: paths.gdevelopJsRoot,
        },
      ];

  return {
    variant,
    useMinGW,
    raw,
    paths,
    toolchain,
    steps,
  };
}

function throwIfFailed(result, label) {
  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    const error = new Error(
      `Command "${label}" failed with exit code ${
        result.status !== null ? result.status : result.signal
      }.`
    );
    error.exitCode = typeof result.status === 'number' ? result.status : 1;
    throw error;
  }
}

function defaultRunShellCommand(command, { cwd, env }) {
  const result = spawnSync(command, {
    cwd,
    env,
    stdio: 'inherit',
    shell: true,
  });
  throwIfFailed(result, command);
}

function defaultRunNodeScript(scriptPath, { cwd, env }) {
  const result = spawnSync(process.execPath, [scriptPath], {
    cwd,
    env,
    stdio: 'inherit',
    shell: false,
  });
  throwIfFailed(result, `node ${scriptPath}`);
}

/**
 * Execute (or dry-run) the GDevelop.js build pipeline.
 * @param {object} [options]
 */
function runBuild({
  variant = 'release',
  useMinGW = false,
  raw = false,
  dryRun = false,
  platform = process.platform,
  gdevelopJsRoot = DEFAULT_GDEVELOP_JS_ROOT,
  env = process.env,
  fileExists = fs.existsSync,
  statSync = fs.statSync,
  mkdirSync = fs.mkdirSync,
  runShellCommand = defaultRunShellCommand,
  runNodeScript = defaultRunNodeScript,
  log = console.log,
} = {}) {
  const plan = createBuildPlan({
    variant,
    useMinGW,
    raw,
    platform,
    gdevelopJsRoot,
    fileExists,
    statSync,
    warn: log,
  });

  if (dryRun) {
    log(
      `[dry-run] GDevelop.js build plan (variant=${plan.variant}, raw=${plan.raw}, useMinGW=${plan.useMinGW}, platform=${platform})`
    );
  }

  const executedStepIds = [];
  const skippedStepIds = [];

  for (const step of plan.steps) {
    if (step.type === 'mkdir') {
      if (dryRun) {
        log(`[dry-run] mkdir -p "${step.path}"`);
      } else {
        mkdirSync(step.path, { recursive: true });
      }
      executedStepIds.push(step.id);
    } else if (step.type === 'shell') {
      if (dryRun) {
        log(`[dry-run] (cwd: ${step.cwd}) ${step.command}`);
      } else {
        log(`▶ [${step.id}] ${step.command}`);
        runShellCommand(step.command, { cwd: step.cwd, env });
      }
      executedStepIds.push(step.id);
    } else if (step.type === 'node') {
      if (step.shouldRun) {
        const decision = step.shouldRun();
        if (!decision.shouldUpdate) {
          log(
            `${dryRun ? '[dry-run] ' : ''}ℹ️ Skipping ${step.id} (node ${
              step.script
            }): ${decision.reason}`
          );
          skippedStepIds.push(step.id);
          continue;
        }
        if (dryRun) {
          log(
            `[dry-run] (cwd: ${step.cwd}) node ${step.script} (${decision.reason})`
          );
          executedStepIds.push(step.id);
          continue;
        }
      }

      if (dryRun) {
        log(`[dry-run] (cwd: ${step.cwd}) node ${step.script}`);
      } else {
        log(`▶ [${step.id}] node ${step.script}`);
        runNodeScript(path.join(plan.paths.gdevelopJsRoot, step.script), {
          cwd: step.cwd,
          env,
        });
      }
      executedStepIds.push(step.id);
    }
  }

  return {
    plan,
    executedStepIds,
    skippedStepIds,
  };
}

function printHelp() {
  console.log(`Usage: node scripts/build.js [options]

Options:
  --variant=<name>   Build variant: ${POSSIBLE_VARIANTS.join(', ')} (default: release)
  --dev              Shortcut for --variant=dev (if --variant is not set)
  --use-MinGW        Use MinGW Makefiles on Windows instead of Ninja
  --raw              Run only CMake, bindings update, and compilation (skip version sync, copy, and type generation)
  --dry-run          Print the build steps without executing them
  -h, --help         Show this help message`);
}

function main(argv = process.argv.slice(2)) {
  try {
    const options = parseBuildArgs(argv);
    if (options.help) {
      printHelp();
      return;
    }

    runBuild(options);
  } catch (error) {
    console.error(error && error.message ? error.message : error);
    process.exit(
      error && typeof error.exitCode === 'number' ? error.exitCode : 1
    );
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  DEFAULT_GDEVELOP_JS_ROOT,
  POSSIBLE_VARIANTS,
  WINDOWS_MINGW_MAKE_EXE,
  WINDOWS_MINGW_MAKE_BINARY,
  WINDOWS_CMAKE_PATHS,
  getBuildPaths,
  parseBuildArgs,
  resolveToolchainConfiguration,
  buildCmakeCommand,
  buildMakeCommand,
  shouldUpdateBindings,
  createBuildPlan,
  runBuild,
  main,
};
