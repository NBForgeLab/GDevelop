/**
 * This script will extract a zipped file of a prebuilt Electron extension.
 * The zip file must contain the raw, unchanged sources, which will be extracted
 * to the folder passed as parameter, in a subfolder with the extension name.
 *
 * This is useful to avoid mixing the Electron extension source files inside
 * GDevelop sources.
 */
var shell = require('shelljs');
var AdmZip = require('adm-zip');
var process = require('process');
var path = require('path');
const {
  validateZipEntries,
} = require('../../app/scripts/lib/ValidateZipEntries');

const fileName = process.argv[2];
const relativeExtractPath = process.argv[3];
if (
  !fileName ||
  !relativeExtractPath ||
  !/^[a-zA-Z0-9._-]+$/.test(fileName) ||
  fileName === '.' ||
  fileName === '..' ||
  fileName.indexOf('..') !== -1
) {
  shell.echo(
    '❌ Usage: node import-zipped-electron-extension.js <fileName> <relativeExtractPath>'
  );
  process.exit(1);
}
const basePath = path.join(relativeExtractPath, fileName);
const zipFilePath = basePath + '.zip';

try {
  const zip = new AdmZip(zipFilePath);
  validateZipEntries(zip, relativeExtractPath, {
    allowedTopLevelDirectories: [fileName, '__MACOSX'],
    requiredTopLevelDirectory: fileName,
  });
  zip.extractAllTo(relativeExtractPath, /*overwrite=*/ true);

  shell.echo('✅ Extracted ' + zipFilePath + ' to ' + basePath + ' folder');
} catch (e) {
  shell.echo(
    '❌ Error while extracting ' + zipFilePath + ' to ' + basePath + ' folder:',
    e.message
  );
  process.exit(1);
}
