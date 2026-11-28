// @ts-check
const fs = require('fs');
const path = require('path');

const buildFolderName = 'build';
const buildPath = path.join(__dirname, '..', buildFolderName);

/**
 * Verify that the build folder contains the files expected for a working
 * app. This is important because the build can, in some cases, "succeed"
 * while producing an empty or unusable build folder. For example, an error
 * in a web worker file is not always reported as an error of the whole
 * compilation - see `Resource3DPreview.worker.js`.
 */
const checkBuildOutput = () => {
  /** @type {string[]} */
  const errors = [];

  /** @param {string} directory @param {RegExp} pattern */
  const checkFileExists = (directory, pattern) => {
    const directoryPath = path.join(buildPath, directory);
    const files = fs.existsSync(directoryPath)
      ? fs.readdirSync(directoryPath)
      : [];
    if (!files.some(file => pattern.test(file))) {
      errors.push(
        `Expected a file matching ${pattern} in "${buildFolderName}/${directory}".`
      );
    }
  };

  /** @param {string} directory @param {RegExp[]} filePatterns */
  const checkNoUntransformedRequires = (directory, filePatterns) => {
    const directoryPath = path.join(buildPath, directory);
    if (!fs.existsSync(directoryPath)) return;
    const files = fs.readdirSync(directoryPath);
    const untransformedRequirePattern = /(?:^|[^\w$.'"`])require\((['"])[^'"]+\1\)/g;
    for (const file of files) {
      if (!filePatterns.some(pattern => pattern.test(file))) continue;
      const content = fs.readFileSync(path.join(directoryPath, file), 'utf8');
      const matches = Array.from(
        content.matchAll(untransformedRequirePattern),
        match => match[0].trim()
      );
      if (matches.length > 0) {
        errors.push(
          `Found untransformed CommonJS require() in "${buildFolderName}/${directory}/${file}": ${matches
            .slice(0, 3)
            .join(', ')}.`
        );
      }
    }
  };

  checkFileExists('', /^index\.html$/);
  checkFileExists('assets', /^index-.*\.js$/);
  checkFileExists('assets', /^index-.*\.css$/);
  checkFileExists('assets', /^Resource3DPreview\.worker-.*\.js$/);
  checkFileExists('assets', /^BackgroundSerializer\.worker-.*\.js$/);
  checkNoUntransformedRequires('assets', [
    /^index-.*\.js$/,
    /^BrowserApp-.*\.js$/,
    /^shared-.*\.js$/,
  ]);

  if (errors.length > 0) {
    console.error(
      '❌ The build folder is incomplete - the build silently failed:'
    );
    errors.forEach(error => console.error(`  - ${error}`));
    process.exit(1);
  }

  console.log('✅ Build folder content looks complete.');
};

checkBuildOutput();
