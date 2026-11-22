// @ts-check
/**
 * Transitional Prettier runner for Flow-to-TypeScript coexistence.
 *
 * Legacy Flow `.js`/`.jsx` files are formatted with Prettier 1.15.3
 * (`prettier-legacy`) to avoid mass-reformatting untouched Flow files (and
 * failing on un-pragma'd Flow `.js` files) during migration, while TypeScript
 * `.ts`/`.tsx` files are formatted with Prettier 3.4.2 (`prettier`) which
 * supports TypeScript 5.4+ syntax (`import type`, `import { type }`, `??`,
 * `?.`, `using`).
 */
const path = require('path');
const { spawnSync } = require('child_process');

const appDir = path.resolve(__dirname, '..');
const configPath = path.join(appDir, '.prettierrc');
const ignorePath = path.join(appDir, '.prettierignore');

const legacyPrettierBin = require.resolve('prettier-legacy/bin-prettier.js');
const tsPrettierBin = require.resolve('prettier/bin/prettier.cjs');

const TS_EXT_RE = /\.(?:ts|tsx|mts|cts)$/i;
// Keep each spawned command well below Windows' 32,767-char CreateProcessW limit.
const MAX_TARGETS_PER_BATCH = 100;

const FLAGS_WITH_VALUE = new Set([
  '--arrow-parens',
  '--cache-location',
  '--cache-strategy',
  '--config',
  '--cursor-offset',
  '--embedded-language-formatting',
  '--end-of-line',
  '--html-whitespace-sensitivity',
  '--ignore-path',
  '--log-level',
  '--loglevel',
  '--parser',
  '--plugin',
  '--plugin-search-dir',
  '--print-width',
  '--prose-wrap',
  '--quote-props',
  '--range-end',
  '--range-start',
  '--stdin-filepath',
  '--tab-width',
  '--trailing-comma',
  '--vue-indent-script-and-style',
]);

/**
 * @param {string} binPath
 * @param {string[]} flags
 * @param {string[]} targets
 * @returns {number}
 */
function runPrettier(binPath, flags, targets) {
  if (targets.length === 0) return 0;

  let exitCode = 0;
  for (let offset = 0; offset < targets.length; offset += MAX_TARGETS_PER_BATCH) {
    const batch = targets.slice(offset, offset + MAX_TARGETS_PER_BATCH);
    const result = spawnSync(
      process.execPath,
      [
        binPath,
        '--config',
        configPath,
        '--ignore-path',
        ignorePath,
        ...flags,
        ...batch,
      ],
      {
        cwd: appDir,
        stdio: 'inherit',
      }
    );
    if (result.error) {
      console.error(result.error);
      return 1;
    }
    const status = typeof result.status === 'number' ? result.status : 1;
    if (status !== 0 && exitCode === 0) {
      exitCode = status;
    }
  }

  return exitCode;
}

const rawArgs = process.argv.slice(2);
/** @type {string[]} */
const flags = [];
/** @type {string[]} */
const files = [];

for (let i = 0; i < rawArgs.length; i++) {
  const arg = rawArgs[i];
  if (arg === '--') {
    for (let j = i + 1; j < rawArgs.length; j++) {
      files.push(rawArgs[j]);
    }
    break;
  }
  if (arg.indexOf('-') === 0) {
    flags.push(arg);
    if (
      arg.indexOf('=') === -1 &&
      FLAGS_WITH_VALUE.has(arg) &&
      i + 1 < rawArgs.length
    ) {
      flags.push(rawArgs[++i]);
    }
  } else {
    files.push(arg);
  }
}

let jsStatus = 0;
let tsStatus = 0;

if (files.length === 0) {
  jsStatus = runPrettier(legacyPrettierBin, flags, [
    'src/!(locales)/**/*.{js,jsx}',
  ]);
  tsStatus = runPrettier(
    tsPrettierBin,
    ['--no-error-on-unmatched-pattern', ...flags],
    ['src/!(locales)/**/*.{ts,tsx}', 'src/*.{ts,tsx}']
  );
} else {
  /** @type {string[]} */
  const jsFiles = [];
  /** @type {string[]} */
  const tsFiles = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    if (TS_EXT_RE.test(file)) {
      tsFiles.push(file);
    } else {
      jsFiles.push(file);
    }
  }

  jsStatus = runPrettier(legacyPrettierBin, flags, jsFiles);
  tsStatus = runPrettier(tsPrettierBin, flags, tsFiles);
}

process.exit(jsStatus !== 0 ? jsStatus : tsStatus);
