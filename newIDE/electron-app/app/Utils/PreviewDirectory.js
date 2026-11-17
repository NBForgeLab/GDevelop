const fs = require('fs');
const path = require('path');
const { isPathWithinCanonicalRoot } = require('./GdevelopFileProtocol');

// Both the native preview and the network server consume generated output.
const resolvePreviewDirectory = (candidate, temporaryDirectory) => {
  if (
    typeof candidate !== 'string' ||
    !path.isAbsolute(candidate) ||
    !temporaryDirectory ||
    !isPathWithinCanonicalRoot(candidate, temporaryDirectory)
  )
    throw new Error('Expected a generated preview directory.');
  const root = fs.realpathSync(temporaryDirectory);
  const directory = fs.realpathSync(candidate);
  if (
    !path.relative(root, directory) ||
    !isPathWithinCanonicalRoot(directory, root) ||
    !fs.statSync(directory).isDirectory()
  )
    throw new Error('Expected a generated preview directory.');
  return directory;
};

module.exports = { resolvePreviewDirectory };
