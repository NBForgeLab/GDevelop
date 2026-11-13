const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const {
  POSSIBLE_VARIANTS,
  WINDOWS_MINGW_MAKE_EXE,
  getBuildPaths,
  parseBuildArgs,
  resolveToolchainConfiguration,
  buildCmakeCommand,
  buildMakeCommand,
  shouldUpdateBindings,
  createBuildPlan,
  runBuild,
} = require('../scripts/build');

const {
  parseCleanArgs,
  getCleanTargets,
  cleanBuildArtifacts,
} = require('../scripts/clean');

const GDEVELOP_JS_ROOT = path.resolve(__dirname, '..');

describe('GDevelop.js build scripts', () => {
  const tempDirs = [];

  function makeTempWorkspace() {
    const baseDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gdevelopjs-build-test-')
    );
    tempDirs.push(baseDir);

    const gdevelopJsRoot = path.join(baseDir, 'GDevelop.js');
    fs.mkdirSync(path.join(gdevelopJsRoot, 'Bindings'), { recursive: true });
    fs.mkdirSync(path.join(gdevelopJsRoot, 'ninja'), { recursive: true });

    return { baseDir, gdevelopJsRoot };
  }

  afterEach(() => {
    while (tempDirs.length > 0) {
      const dir = tempDirs.pop();
      fs.rmSync(dir, { recursive: true, force: true });
    }
  });

  describe('parseBuildArgs', () => {
    it('uses release defaults when no flags are provided', () => {
      expect(parseBuildArgs([])).toEqual({
        variant: 'release',
        useMinGW: false,
        raw: false,
        dryRun: false,
        help: false,
      });
    });

    it('supports --dev and all --variant values', () => {
      expect(parseBuildArgs(['--dev']).variant).toBe('dev');

      for (const variant of POSSIBLE_VARIANTS) {
        expect(parseBuildArgs([`--variant=${variant}`]).variant).toBe(variant);
        expect(parseBuildArgs(['--variant', variant]).variant).toBe(variant);
      }

      expect(parseBuildArgs(['--dev', '--variant=debug']).variant).toBe(
        'debug'
      );
      expect(parseBuildArgs(['--variant=release', '--dev']).variant).toBe(
        'release'
      );
    });

    it('parses --use-MinGW, --raw, --dry-run, and --help', () => {
      expect(
        parseBuildArgs(['--use-MinGW', '--raw', '--dry-run', '--help'])
      ).toEqual({
        variant: 'release',
        useMinGW: true,
        raw: true,
        dryRun: true,
        help: true,
      });
      expect(parseBuildArgs(['-h']).help).toBe(true);
    });

    it('rejects invalid variants, missing --variant values, and unknown flags', () => {
      expect(() => parseBuildArgs(['--variant=invalid'])).toThrow(
        'Invalid build variant: invalid. Possible values are: release, dev, debug, debug-assertions, debug-sanitizers.'
      );
      expect(() => parseBuildArgs(['--variant='])).toThrow(
        'Invalid build variant: . Possible values are: release, dev, debug, debug-assertions, debug-sanitizers.'
      );
      expect(() => parseBuildArgs(['--variant'])).toThrow(
        'Missing value for --variant.'
      );
      expect(() => parseBuildArgs(['--variant', '--raw'])).toThrow(
        'Missing value for --variant.'
      );
      expect(() => parseBuildArgs(['--unknown-flag'])).toThrow(
        'Unknown argument: --unknown-flag'
      );
    });
  });

  describe('resolveToolchainConfiguration & command construction', () => {
    it('configures Unix/macOS builds with emcmake cmake and emmake make -j 8', () => {
      for (const platform of ['linux', 'darwin']) {
        const toolchain = resolveToolchainConfiguration({
          platform,
          useMinGW: true,
          gdevelopJsRoot: GDEVELOP_JS_ROOT,
        });

        expect(toolchain).toEqual({
          isWin: false,
          cmakeBinary: 'emcmake cmake',
          cmakeGeneratorArgs: [],
          makeBinary: 'emmake make',
          makeArgs: ['-j 8'],
        });

        expect(
          buildCmakeCommand({
            cmakeBinary: toolchain.cmakeBinary,
            cmakeGeneratorArgs: toolchain.cmakeGeneratorArgs,
            variant: 'dev',
          })
        ).toBe('emcmake cmake ../.. -DGDEVELOPJS_BUILD_VARIANT=dev');

        expect(
          buildMakeCommand({
            makeBinary: toolchain.makeBinary,
            makeArgs: toolchain.makeArgs,
          })
        ).toBe('emmake make -j 8');
      }
    });

    it('configures Windows builds with Ninja by default and detects CMake in Program Files', () => {
      const warnings = [];
      const toolchain = resolveToolchainConfiguration({
        platform: 'win32',
        useMinGW: false,
        gdevelopJsRoot: GDEVELOP_JS_ROOT,
        fileExists: (p) => p === 'C:\\Program Files\\CMake\\bin\\cmake.exe',
        warn: (msg) => warnings.push(msg),
      });

      const expectedNinja = path.join(GDEVELOP_JS_ROOT, 'ninja', 'ninja.exe');
      expect(warnings).toEqual([]);
      expect(toolchain).toEqual({
        isWin: true,
        cmakeBinary: 'emcmake "C:\\Program Files\\CMake\\bin\\cmake"',
        cmakeGeneratorArgs: [
          '-G "Ninja"',
          `-DCMAKE_MAKE_PROGRAM="${expectedNinja}"`,
        ],
        makeBinary: `emmake "${expectedNinja}"`,
        makeArgs: [],
      });

      expect(
        buildCmakeCommand({
          cmakeBinary: toolchain.cmakeBinary,
          cmakeGeneratorArgs: toolchain.cmakeGeneratorArgs,
          variant: 'debug-sanitizers',
        })
      ).toBe(
        `emcmake "C:\\Program Files\\CMake\\bin\\cmake" -G "Ninja" -DCMAKE_MAKE_PROGRAM="${expectedNinja}" ../.. -DGDEVELOPJS_BUILD_VARIANT=debug-sanitizers`
      );

      expect(
        buildMakeCommand({
          makeBinary: toolchain.makeBinary,
          makeArgs: toolchain.makeArgs,
        })
      ).toBe(`emmake "${expectedNinja}"`);
    });

    it('detects CMake in Program Files (x86) and falls back to PATH with warning', () => {
      const x86Warnings = [];
      const x86Toolchain = resolveToolchainConfiguration({
        platform: 'win32',
        useMinGW: false,
        gdevelopJsRoot: GDEVELOP_JS_ROOT,
        fileExists: (p) =>
          p === 'C:\\Program Files (x86)\\CMake\\bin\\cmake.exe',
        warn: (msg) => x86Warnings.push(msg),
      });
      expect(x86Warnings).toEqual([]);
      expect(x86Toolchain.cmakeBinary).toBe(
        'emcmake "C:\\Program Files (x86)\\CMake\\bin\\cmake"'
      );

      const fallbackWarnings = [];
      const fallbackToolchain = resolveToolchainConfiguration({
        platform: 'win32',
        useMinGW: false,
        gdevelopJsRoot: GDEVELOP_JS_ROOT,
        fileExists: () => false,
        warn: (msg) => fallbackWarnings.push(msg),
      });
      expect(fallbackToolchain.cmakeBinary).toBe('emcmake cmake');
      expect(fallbackWarnings).toEqual([
        "⚠️ Can't find CMake in its usual Program Files folder. Make sure you have cmake in your PATH instead.",
      ]);
    });

    it('configures MinGW on Windows when present and errors when missing', () => {
      expect(() =>
        resolveToolchainConfiguration({
          platform: 'win32',
          useMinGW: true,
          gdevelopJsRoot: GDEVELOP_JS_ROOT,
          fileExists: () => false,
        })
      ).toThrow(
        "🔴 Can't find mingw32-make in C:\\MinGW. Make sure MinGW is installed."
      );

      const toolchain = resolveToolchainConfiguration({
        platform: 'win32',
        useMinGW: true,
        gdevelopJsRoot: GDEVELOP_JS_ROOT,
        fileExists: (p) =>
          p === WINDOWS_MINGW_MAKE_EXE ||
          p === 'C:\\Program Files\\CMake\\bin\\cmake.exe',
      });

      expect(toolchain).toEqual({
        isWin: true,
        cmakeBinary: 'emcmake "C:\\Program Files\\CMake\\bin\\cmake"',
        cmakeGeneratorArgs: ['-G "MinGW Makefiles"'],
        makeBinary: 'emmake "C:\\MinGW\\bin\\mingw32-make"',
        makeArgs: [],
      });
    });
  });

  describe('shouldUpdateBindings (incremental Bindings.idl timestamp check)', () => {
    it('requires update when glue.cpp or glue.js is missing', () => {
      const { gdevelopJsRoot } = makeTempWorkspace();
      const { bindingsIdlPath, glueCppPath, glueJsPath } =
        getBuildPaths(gdevelopJsRoot);

      fs.writeFileSync(bindingsIdlPath, '// idl');
      expect(shouldUpdateBindings({ gdevelopJsRoot }).shouldUpdate).toBe(true);

      fs.writeFileSync(glueCppPath, '// glue cpp');
      expect(shouldUpdateBindings({ gdevelopJsRoot }).shouldUpdate).toBe(true);

      fs.rmSync(glueCppPath);
      fs.writeFileSync(glueJsPath, '// glue js');
      expect(shouldUpdateBindings({ gdevelopJsRoot }).shouldUpdate).toBe(true);
    });

    it('requires update only when Bindings.idl is newer than glue.cpp or glue.js', () => {
      const { gdevelopJsRoot } = makeTempWorkspace();
      const { bindingsIdlPath, glueCppPath, glueJsPath } =
        getBuildPaths(gdevelopJsRoot);

      fs.writeFileSync(bindingsIdlPath, '// idl');
      fs.writeFileSync(glueCppPath, '// glue cpp');
      fs.writeFileSync(glueJsPath, '// glue js');

      const t100 = new Date(100000);
      const t200 = new Date(200000);
      const t300 = new Date(300000);

      // Equal mtimes -> up to date
      fs.utimesSync(bindingsIdlPath, t200, t200);
      fs.utimesSync(glueCppPath, t200, t200);
      fs.utimesSync(glueJsPath, t200, t200);
      expect(shouldUpdateBindings({ gdevelopJsRoot }).shouldUpdate).toBe(false);

      // Both outputs newer -> up to date
      fs.utimesSync(bindingsIdlPath, t100, t100);
      fs.utimesSync(glueCppPath, t200, t200);
      fs.utimesSync(glueJsPath, t300, t300);
      expect(shouldUpdateBindings({ gdevelopJsRoot }).shouldUpdate).toBe(false);

      // Bindings.idl newer than glue.cpp -> update
      fs.utimesSync(bindingsIdlPath, t200, t200);
      fs.utimesSync(glueCppPath, t100, t100);
      fs.utimesSync(glueJsPath, t300, t300);
      expect(shouldUpdateBindings({ gdevelopJsRoot }).shouldUpdate).toBe(true);

      // Bindings.idl newer than glue.js -> update
      fs.utimesSync(bindingsIdlPath, t200, t200);
      fs.utimesSync(glueCppPath, t300, t300);
      fs.utimesSync(glueJsPath, t100, t100);
      expect(shouldUpdateBindings({ gdevelopJsRoot }).shouldUpdate).toBe(true);
    });

    it('throws if Bindings.idl does not exist', () => {
      const { gdevelopJsRoot } = makeTempWorkspace();
      expect(() => shouldUpdateBindings({ gdevelopJsRoot })).toThrow(
        'Bindings IDL file not found'
      );
    });
  });

  describe('createBuildPlan & runBuild execution sequence', () => {
    it('executes exact full build step sequence when bindings need updating', () => {
      const { gdevelopJsRoot } = makeTempWorkspace();
      const { bindingsIdlPath, buildPath } = getBuildPaths(gdevelopJsRoot);
      fs.writeFileSync(bindingsIdlPath, '// idl');

      const events = [];
      const result = runBuild({
        variant: 'dev',
        raw: false,
        platform: 'linux',
        gdevelopJsRoot,
        mkdirSync: (dir, opts) => {
          events.push({ type: 'mkdir', dir, opts });
        },
        runShellCommand: (command, { cwd }) => {
          events.push({ type: 'shell', command, cwd });
        },
        runNodeScript: (scriptPath, { cwd }) => {
          events.push({
            type: 'node',
            script: path.relative(gdevelopJsRoot, scriptPath),
            cwd,
          });
        },
        log: () => {},
      });

      expect(result.executedStepIds).toEqual([
        'syncVersions',
        'mkdir',
        'cmake',
        'updateGDBindings',
        'make',
        'copyToNewIDE',
        'generateFlowTypes',
        'generateTSTypes',
      ]);
      expect(result.skippedStepIds).toEqual([]);

      expect(events).toEqual([
        {
          type: 'node',
          script: path.join('scripts', 'sync-versions.js'),
          cwd: gdevelopJsRoot,
        },
        {
          type: 'mkdir',
          dir: buildPath,
          opts: { recursive: true },
        },
        {
          type: 'shell',
          command: 'emcmake cmake ../.. -DGDEVELOPJS_BUILD_VARIANT=dev',
          cwd: buildPath,
        },
        {
          type: 'node',
          script: 'update-bindings.js',
          cwd: gdevelopJsRoot,
        },
        {
          type: 'shell',
          command: 'emmake make -j 8',
          cwd: buildPath,
        },
        {
          type: 'node',
          script: path.join('scripts', 'copy-to-newIDE.js'),
          cwd: gdevelopJsRoot,
        },
        {
          type: 'node',
          script: path.join('scripts', 'generate-types.js'),
          cwd: gdevelopJsRoot,
        },
        {
          type: 'node',
          script: path.join('scripts', 'generate-dts.mjs'),
          cwd: gdevelopJsRoot,
        },
      ]);
    });

    it('skips update-bindings.js when glue.cpp and glue.js are up to date', () => {
      const { gdevelopJsRoot } = makeTempWorkspace();
      const { bindingsIdlPath, glueCppPath, glueJsPath } =
        getBuildPaths(gdevelopJsRoot);
      fs.writeFileSync(bindingsIdlPath, '// idl');
      fs.writeFileSync(glueCppPath, '// cpp');
      fs.writeFileSync(glueJsPath, '// js');

      const t100 = new Date(100000);
      const t200 = new Date(200000);
      fs.utimesSync(bindingsIdlPath, t100, t100);
      fs.utimesSync(glueCppPath, t200, t200);
      fs.utimesSync(glueJsPath, t200, t200);

      const executedNodes = [];
      const result = runBuild({
        platform: 'linux',
        gdevelopJsRoot,
        mkdirSync: () => {},
        runShellCommand: () => {},
        runNodeScript: (scriptPath) => {
          executedNodes.push(path.relative(gdevelopJsRoot, scriptPath));
        },
        log: () => {},
      });

      expect(result.skippedStepIds).toEqual(['updateGDBindings']);
      expect(executedNodes).toEqual([
        path.join('scripts', 'sync-versions.js'),
        path.join('scripts', 'copy-to-newIDE.js'),
        path.join('scripts', 'generate-types.js'),
        path.join('scripts', 'generate-dts.mjs'),
      ]);
    });

    it('runs only raw steps when --raw is specified', () => {
      const { gdevelopJsRoot } = makeTempWorkspace();
      const { bindingsIdlPath } = getBuildPaths(gdevelopJsRoot);
      fs.writeFileSync(bindingsIdlPath, '// idl');

      const plan = createBuildPlan({
        raw: true,
        platform: 'linux',
        gdevelopJsRoot,
      });

      expect(plan.steps.map((step) => step.id)).toEqual([
        'mkdir',
        'cmake',
        'updateGDBindings',
        'make',
      ]);
    });

    it('does not execute commands in --dry-run mode', () => {
      const { gdevelopJsRoot } = makeTempWorkspace();
      const { bindingsIdlPath } = getBuildPaths(gdevelopJsRoot);
      fs.writeFileSync(bindingsIdlPath, '// idl');

      const logs = [];
      let sideEffects = 0;

      runBuild({
        dryRun: true,
        platform: 'linux',
        gdevelopJsRoot,
        mkdirSync: () => {
          sideEffects++;
        },
        runShellCommand: () => {
          sideEffects++;
        },
        runNodeScript: () => {
          sideEffects++;
        },
        log: (msg) => logs.push(msg),
      });

      expect(sideEffects).toBe(0);
      expect(logs.some((line) => line.includes('[dry-run]'))).toBe(true);
    });
  });

  describe('clean script', () => {
    it('parses clean CLI flags and rejects unknown arguments', () => {
      expect(parseCleanArgs([])).toEqual({ dryRun: false, help: false });
      expect(parseCleanArgs(['--dry-run', '-h'])).toEqual({
        dryRun: true,
        help: true,
      });
      expect(() => parseCleanArgs(['--invalid'])).toThrow(
        'Unknown argument: --invalid'
      );
    });

    it('returns the exact clean target paths and deletes them cleanly', () => {
      const { baseDir, gdevelopJsRoot } = makeTempWorkspace();
      const {
        bindingsIdlPath,
        buildPath,
        buildOutputPath,
        glueCppPath,
        glueJsPath,
      } = getBuildPaths(gdevelopJsRoot);

      expect(getCleanTargets(gdevelopJsRoot)).toEqual([
        buildPath,
        glueCppPath,
        glueJsPath,
        path.join(buildOutputPath, 'libGD.js'),
        path.join(buildOutputPath, 'libGD.wasm'),
      ]);

      fs.writeFileSync(bindingsIdlPath, '// keep me');
      fs.mkdirSync(buildOutputPath, { recursive: true });
      fs.writeFileSync(path.join(buildOutputPath, 'libGD.js'), '// js');
      fs.writeFileSync(path.join(buildOutputPath, 'libGD.wasm'), '// wasm');
      fs.writeFileSync(glueCppPath, '// cpp');
      fs.writeFileSync(glueJsPath, '// js');

      const dryResult = cleanBuildArtifacts({
        gdevelopJsRoot,
        dryRun: true,
        log: () => {},
      });
      expect(dryResult.removedTargets).toHaveLength(5);
      expect(fs.existsSync(buildPath)).toBe(true);
      expect(fs.existsSync(glueCppPath)).toBe(true);

      const cleanResult = cleanBuildArtifacts({
        gdevelopJsRoot,
        dryRun: false,
        log: () => {},
      });
      expect(cleanResult.removedTargets).toEqual([
        buildPath,
        glueCppPath,
        glueJsPath,
      ]);
      expect(fs.existsSync(buildPath)).toBe(false);
      expect(fs.existsSync(glueCppPath)).toBe(false);
      expect(fs.existsSync(glueJsPath)).toBe(false);
      expect(fs.existsSync(bindingsIdlPath)).toBe(true);
      expect(fs.existsSync(baseDir)).toBe(true);

      // Idempotent when run a second time
      const secondRun = cleanBuildArtifacts({
        gdevelopJsRoot,
        dryRun: false,
        log: () => {},
      });
      expect(secondRun.removedTargets).toEqual([]);
    });
  });

  describe('CLI integration', () => {
    const buildScript = path.join(GDEVELOP_JS_ROOT, 'scripts', 'build.js');
    const cleanScript = path.join(GDEVELOP_JS_ROOT, 'scripts', 'clean.js');

    it('exits with code 1 on --variant=invalid', () => {
      const result = spawnSync(
        process.execPath,
        [buildScript, '--variant=invalid'],
        {
          cwd: GDEVELOP_JS_ROOT,
          encoding: 'utf8',
        }
      );

      expect(result.status).toBe(1);
      expect(result.stderr).toContain(
        'Invalid build variant: invalid. Possible values are: release, dev, debug, debug-assertions, debug-sanitizers.'
      );
    });

    it('supports --dry-run on build.js and clean.js', () => {
      const buildDryRun = spawnSync(
        process.execPath,
        [buildScript, '--raw', '--dev', '--dry-run'],
        {
          cwd: GDEVELOP_JS_ROOT,
          encoding: 'utf8',
        }
      );
      expect(buildDryRun.status).toBe(0);
      expect(buildDryRun.stdout).toContain('variant=dev');
      expect(buildDryRun.stdout).toContain('raw=true');
      expect(buildDryRun.stdout).toContain('-DGDEVELOPJS_BUILD_VARIANT=dev');
      expect(buildDryRun.stdout).not.toContain('sync-versions.js');

      const cleanDryRun = spawnSync(
        process.execPath,
        [cleanScript, '--dry-run'],
        {
          cwd: GDEVELOP_JS_ROOT,
          encoding: 'utf8',
        }
      );
      expect(cleanDryRun.status).toBe(0);
      expect(cleanDryRun.stdout).toContain('[dry-run] Would remove');
    });
  });
});
