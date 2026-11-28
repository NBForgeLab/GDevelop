const path = require('path');
const parseArgs = require('minimist');
const {
  normalizeFileIdentifier,
  readOpenProjectFileIdentifiers,
  getWindowFileIdentifier,
} = require('./OpenProjectsRegistry');

const argsParserOptions = {
  boolean: [
    'dev-tools',
    'disable-update-check',
    'keep-open',
    'block-on-diagnostic-errors',
    'json',
    'dry-run',
    'read-only',
    'mcp',
    'show',
  ],
  string: [
    '_',
    'run-command',
    'cmd-args',
    'results-path',
    'generation-api-url',
  ],
  // minimist would otherwise default this boolean to `false` when the flag is
  // absent, which would hide `gdevelop-settings.yaml`.
  default: { 'block-on-diagnostic-errors': null },
};

// The flags of a command forwarded with it to an already opened editor.
const forwardedCommandOptionNames = [
  'json',
  'dry-run',
  'read-only',
  'results-path',
];

// Drop switches Chromium may inject into argv (e.g. --allow-file-access-from-files)
// so they can't steal the value of our own -- flags during parsing.
const knownCliFlagNames = new Set(
  [...argsParserOptions.boolean, ...argsParserOptions.string].filter(
    (name) => name !== '_'
  )
);
const booleanFlagNames = new Set(argsParserOptions.boolean);
/**
 * @param {string[]} argv
 * @returns {import('minimist').ParsedArgs}
 */
const parseGDevelopArgs = (argv) =>
  parseArgs(
    argv.filter((arg) => {
      if (!arg.startsWith('--')) return true;
      const argName = arg.slice(2).split('=')[0];
      if (knownCliFlagNames.has(argName)) return true;
      // Allow --no-<known-bool-flag> (minimist negation syntax).
      return (
        argName.startsWith('no-') && booleanFlagNames.has(argName.slice(3))
      );
    }),
    argsParserOptions
  );

// Electron reorders commandLine (switches first, values last) before forwarding
// to 'second-instance', breaking flag-to-value pairing on reparse. Prefer
// additionalData.args (parsed by the second instance itself) instead.
/**
 * @param {{
 *   commandLine: string[],
 *   additionalData: unknown,
 *   isDev: boolean,
 * }} options
 * @returns {import('minimist').ParsedArgs}
 */
const parseSecondInstanceArgs = ({ commandLine, additionalData, isDev }) => {
  const additionalArgs =
    additionalData &&
    typeof additionalData === 'object' &&
    'args' in additionalData
      ? additionalData.args
      : null;
  if (additionalArgs && typeof additionalArgs === 'object') {
    return /** @type {import('minimist').ParsedArgs} */ (additionalArgs);
  }
  // In dev, electron is launched with an extra argument, so skip one more.
  return parseGDevelopArgs(commandLine.slice(isDev ? 2 : 1));
};

// Inline JSON and "-" (stdin) are kept as is, anything else is a path.
/**
 * @param {string | string[] | undefined} commandArgs
 * @returns {string[] | undefined}
 */
const resolveCommandArgsPaths = (commandArgs) => {
  if (!commandArgs) return undefined;
  const values = Array.isArray(commandArgs) ? commandArgs : [commandArgs];
  return values.map((value) => {
    const trimmedValue = value.trim();
    if (!trimmedValue || trimmedValue === '-' || /^[[{]/.test(trimmedValue))
      return value;
    return path.resolve(trimmedValue);
  });
};

/**
 * @param {import('minimist').ParsedArgs} parsedArgs
 * @returns {boolean}
 */
const isCliProjectAlreadyOpenElsewhere = (parsedArgs) => {
  const fileIdentifier = normalizeFileIdentifier(parsedArgs._[0]);
  return (
    !!fileIdentifier &&
    readOpenProjectFileIdentifiers().includes(fileIdentifier)
  );
};

// Redirects the command to an already open editor instead of spawning a new window.
/**
 * @param {{
 *   parsedArgs: import('minimist').ParsedArgs,
 *   mainWindows: Set<import('electron').BrowserWindow>,
 * }} options
 * @returns {boolean}
 */
const routeCliCommandToLiveEditor = ({ parsedArgs, mainWindows }) => {
  const commandName = parsedArgs['run-command'];
  if (!commandName) return false;

  const fileIdentifier = normalizeFileIdentifier(parsedArgs._[0]);
  const targetWindow = Array.from(mainWindows).find(
    (window) => getWindowFileIdentifier(window.id) === fileIdentifier
  );
  if (!targetWindow) return false;

  /** @type {Record<string, any>} */
  const commandOptions = {};
  forwardedCommandOptionNames.forEach((name) => {
    if (parsedArgs[name] !== undefined) commandOptions[name] = parsedArgs[name];
  });
  // Paths are resolved by the editor, which can run in another directory.
  if (commandOptions['results-path'])
    commandOptions['results-path'] = path.resolve(
      commandOptions['results-path']
    );

  targetWindow.webContents.send('run-cli-command', {
    commandName,
    commandArgs: resolveCommandArgsPaths(parsedArgs['cmd-args']),
    fileIdentifier,
    commandOptions,
  });
  targetWindow.focus();
  return true;
};

module.exports = {
  argsParserOptions,
  parseGDevelopArgs,
  parseSecondInstanceArgs,
  isCliProjectAlreadyOpenElsewhere,
  routeCliCommandToLiveEditor,
};
