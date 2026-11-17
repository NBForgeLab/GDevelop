const path = require('path');

// Only native command-line arguments may call this function. Renderer paths
// must go through the native access dialog instead.
const grantCliFileAccess = (args, grantSelectedPath, cwd = process.cwd()) => {
  if (!args || !grantSelectedPath) return;
  const resolve = value => path.resolve(cwd, value);
  for (const input of Array.isArray(args._) ? args._ : []) {
    if (typeof input !== 'string' || !input.trim()) continue;
    const target = resolve(input);
    const project = /\.json(?:\.autosave)?$/i.test(target);
    grantSelectedPath(
      project ? path.dirname(target) : target,
      'write',
      project
    );
  }
  if (typeof args['results-path'] === 'string' && args['results-path']) {
    grantSelectedPath(resolve(args['results-path']), 'write');
  }
  const inputs = Array.isArray(args['cmd-args'])
    ? args['cmd-args']
    : [args['cmd-args']];
  // Other commands interpret arguments as names or filters, not paths.
  if (
    ![
      'RUN_EDITOR_FUNCTIONS',
      'RUN_EDITOR_SCRIPT',
      'RUN_AI_REQUEST',
      'IMPORT_EXTENSION_AND_SAVE',
    ].includes(args['run-command'])
  )
    return;
  for (const input of inputs) {
    if (typeof input !== 'string') continue;
    const trimmed = input.trim();
    if (!trimmed || trimmed === '-' || /^[\[{]/.test(trimmed)) continue;
    grantSelectedPath(resolve(trimmed), 'read');
  }
};

module.exports = { grantCliFileAccess };
