/**
 * This script will extract a zipped file of a prebuilt Electron extension.
 * The zip file must contain the raw, unchanged sources, which will be extracted
 * to the folder passed as parameter, in a subfolder with the extension name.
 *
 * This is useful to avoid mixing the Electron extension source files inside
 * GDevelop sources.
 */
var shell = require('shelljs');
var fs = require('fs');
var AdmZip = require('adm-zip');
var process = require('process');
var path = require('path');

const fileName = process.argv[2];
const relativeExtractPath = process.argv[3];
if (
  !fileName ||
  !relativeExtractPath ||
  fileName.indexOf('/') !== -1 ||
  fileName.indexOf('\\') !== -1 ||
  fileName.indexOf('..') !== -1 ||
  fileName.indexOf(':') !== -1 ||
  fileName.indexOf('\0') !== -1 ||
  fileName === '.'
) {
  shell.echo(
    '❌ Usage: node import-zipped-electron-extension.js <fileName> <relativeExtractPath>'
  );
  process.exit(1);
}
const basePath = path.join(relativeExtractPath, fileName);
const zipFilePath = basePath + '.zip';

const validateZipEntries = (zip, destinationPath) => {
  const resolvedDestination = path.resolve(destinationPath);
  const entries = zip.getEntries();

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    const entryName = String(entry.entryName || '');

    if (
      !entryName ||
      entryName.indexOf('\0') !== -1 ||
      /^[a-zA-Z]:/.test(entryName) ||
      entryName.startsWith('/') ||
      entryName.startsWith('\\')
    ) {
      throw new Error(`Unsafe zip entry path: "${entryName}"`);
    }

    const segments = entryName.split(/[/\\]/);
    if (segments.some(segment => segment === '..')) {
      throw new Error(`Zip Slip traversal detected in entry: "${entryName}"`);
    }

    const rawAttr =
      entry.header && typeof entry.header.attr === 'number'
        ? entry.header.attr
        : 0;
    const fileTypeBits = (rawAttr >>> 16) & 0o170000;
    if (fileTypeBits === 0o120000) {
      throw new Error(`Symlink zip entry is not allowed: "${entryName}"`);
    }

    const resolvedEntryPath = path.resolve(resolvedDestination, entryName);
    const relativePath = path.relative(resolvedDestination, resolvedEntryPath);
    if (
      relativePath === '..' ||
      relativePath.startsWith('..' + path.sep) ||
      path.isAbsolute(relativePath)
    ) {
      throw new Error(`Zip entry escapes target directory: "${entryName}"`);
    }
  }
};

try {
  const zip = new AdmZip(zipFilePath);
  validateZipEntries(zip, relativeExtractPath);
  zip.extractAllTo(relativeExtractPath, /*overwrite=*/ true);

  shell.echo('✅ Extracted ' + zipFilePath + ' to ' + basePath + ' folder');
} catch (e) {
  shell.echo(
    '❌ Error while extracting ' + zipFilePath + ' to ' + basePath + ' folder:',
    e.message
  );
  process.exit(1);
}
