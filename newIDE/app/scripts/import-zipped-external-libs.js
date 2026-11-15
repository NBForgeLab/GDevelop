// @ts-check
/**
 * This script extracts the external libraries in external-libs inside
 * public/external. It's up to the IDE to load them appropriately.
 */
const shell = require('shelljs');
const fs = require('fs');
const AdmZip = require('adm-zip');
const path = require('path');
const { validateZipEntries } = require('./lib/ValidateZipEntries');

const externalLibsFolder = path.join(__dirname, 'external-libs');
const destinationFolder = '../public/external/';

const getAllExternalLibFiles = async () => {
  const externalLibs = await fs.promises.readdir(externalLibsFolder);
  return externalLibs
    .filter(name => name !== '.DS_Store')
    .filter(name => name !== '.')
    .filter(name => name !== '..');
};

(async () => {
  let externalLibFiles;
  try {
    externalLibFiles = await getAllExternalLibFiles();
  } catch (error) {
    shell.echo(
      '❌ Error while listing external-libs:',
      error instanceof Error ? error.message : String(error)
    );
    process.exitCode = 1;
    return;
  }

  for (const externalLibFile of externalLibFiles) {
    try {
      const zip = new AdmZip(path.join(externalLibsFolder, externalLibFile));
      validateZipEntries(zip, destinationFolder);
      zip.extractAllTo(destinationFolder, /*overwrite=*/ true);

      shell.echo(
        '✅ Extracted ' + externalLibFile + ' to public/external/ folder'
      );
    } catch (e) {
      shell.echo(
        '❌ Error while extracting ' +
          externalLibFile +
          ' to public/external/ folder:',
        e instanceof Error ? e.message : String(e)
      );
      process.exitCode = 1;
      return;
    }
  }
})();
