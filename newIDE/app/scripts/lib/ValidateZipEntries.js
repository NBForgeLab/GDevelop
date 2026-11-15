// @ts-check
const path = require('path');

/**
 * Validate all entries in an AdmZip archive before extraction to prevent
 * Zip Slip path traversal, absolute path writes, Windows drive-letter paths,
 * or symlink extraction.
 *
 * @param {import('adm-zip')} zip
 * @param {string} destinationPath
 */
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

    // Reject POSIX symlink entries (S_IFLNK = 0o120000 in upper 16 bits of external attributes).
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

module.exports = {
  validateZipEntries,
};
