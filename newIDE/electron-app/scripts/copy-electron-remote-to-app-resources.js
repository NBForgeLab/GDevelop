/**
 * This script will copy `@electron/remote` module to the app Resources folder,
 * so that it can be used in previews of games run in the editor.
 *
 * This can be removed on dependency on `@electron/remote` is removed.
 */

const shell = require('shelljs');
const path = require('path');

const sourcePath = path.join(__dirname, '../app/node_modules/@electron/remote');
const destinationPath = path.join(
  __dirname,
  '../../app/resources/preview_node_modules',
  '@electron'
);
const mkdirResult = shell.mkdir('-p', destinationPath);
if (mkdirResult.code !== 0 || mkdirResult.stderr) {
  shell.echo(
    `❌ Error while creating ${destinationPath}: ${mkdirResult.stderr ||
      `exit code ${mkdirResult.code}`}`
  );
  process.exitCode = 1;
} else {
  const cpResult = shell.cp('-R', sourcePath, destinationPath);
  if (cpResult.code !== 0 || cpResult.stderr) {
    shell.echo(
      `❌ Error while copying @electron/remote to ${destinationPath}: ${cpResult.stderr ||
        `exit code ${cpResult.code}`}`
    );
    process.exitCode = 1;
  } else {
    shell.echo(`✅ Copied @electron/remote to ${destinationPath}.`);
  }
}
