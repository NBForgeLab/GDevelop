const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { createFileAccessPolicy } = require('../app/Utils/FileAccessPolicy');
const { grantCliFileAccess } = require('../app/Utils/CliFileAccess');

const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-file-policy-'));
try {
  const readRoot = path.join(root, 'runtime');
  const writeRoot = path.join(root, 'project');
  fs.mkdirSync(readRoot);
  fs.mkdirSync(writeRoot);
  const policy = createFileAccessPolicy({
    readRoots: [readRoot],
    writeRoots: [writeRoot],
  });
  assert.doesNotThrow(() =>
    policy.assertAccess(path.join(readRoot, 'runtime.js'), 'read')
  );
  assert.throws(
    () => policy.assertAccess(path.join(readRoot, 'runtime.js'), 'write'),
    /not authorized/
  );
  assert.doesNotThrow(() =>
    policy.assertAccess(path.join(writeRoot, 'assets', 'new.png'), 'write')
  );
  assert.throws(
    () =>
      policy.assertAccess(path.join(root, 'Startup', 'payload.cmd'), 'write'),
    /not authorized/
  );
  assert.throws(
    () => policy.assertAccess(path.join(root, 'secrets'), 'read'),
    /not authorized/
  );
  assert.throws(
    () => policy.assertAccess(path.join(writeRoot, '..', 'secrets'), 'read'),
    /not authorized/
  );
  // A grant for a single file must not silently grant its siblings.
  policy.grantFile(path.join(root, 'picked.png'), 'read');
  assert.doesNotThrow(() =>
    policy.assertAccess(path.join(root, 'picked.png'), 'read')
  );
  assert.throws(
    () => policy.assertAccess(path.join(root, 'sibling.png'), 'read'),
    /not authorized/
  );
  assert.throws(
    () => policy.assertAccess(path.join(root, 'picked.png'), 'write'),
    /not authorized/
  );
  // Directory junctions must not expand the capability outside its canonical root.
  const outside = path.join(root, 'outside');
  fs.mkdirSync(outside);
  fs.symlinkSync(
    outside,
    path.join(writeRoot, 'escape'),
    process.platform === 'win32' ? 'junction' : 'dir'
  );
  assert.throws(
    () =>
      policy.assertAccess(path.join(writeRoot, 'escape', 'secret'), 'write'),
    /not authorized/
  );
  const cliPolicy = createFileAccessPolicy();
  const grantSelection = (target, mode, directory) =>
    directory
      ? cliPolicy.grantRoot(target, mode)
      : cliPolicy.grantFile(target, mode);
  grantCliFileAccess(
    {
      _: ['project/game.json'],
      'run-command': 'RUN_EDITOR_FUNCTIONS',
      'cmd-args': ['commands.json', '-', '[{"function":"test"}]'],
      'results-path': 'results.json',
    },
    grantSelection,
    root
  );
  assert.strictEqual(
    cliPolicy.hasAccess(path.join(writeRoot, 'asset.png'), 'write'),
    true
  );
  assert.strictEqual(
    cliPolicy.hasAccess(path.join(root, 'commands.json'), 'read'),
    true
  );
  assert.strictEqual(
    cliPolicy.hasAccess(path.join(root, 'commands.json'), 'write'),
    false
  );
  assert.strictEqual(
    cliPolicy.hasAccess(path.join(root, 'results.json'), 'write'),
    true
  );
  assert.strictEqual(
    cliPolicy.hasAccess(path.join(root, 'unrelated.json')),
    false
  );
  grantCliFileAccess(
    { 'run-command': 'RUN_TESTS', 'cmd-args': 'unrelated.json' },
    grantSelection,
    root
  );
  assert.strictEqual(
    cliPolicy.hasAccess(path.join(root, 'unrelated.json')),
    false
  );
  console.log('File access policy assertions passed.');
} finally {
  fs.rmSync(root, { recursive: true, force: true });
}
