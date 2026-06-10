const shell = require('shelljs');
const path = require('path');
const fs = require('fs');

const sourcePaths = [
  path.join(__dirname, '../../Binaries/embuild/GDevelop.js'),
  path.join(__dirname, '../../Binaries/embuild-fresh/GDevelop.js'),
];
const destinationPath = path.join(__dirname, '../../newIDE/app/public');
const destinationTestPath = path.join(
  __dirname,
  '../../newIDE/app/node_modules/libGD.js-for-tests-only'
);

const copyFileAtomically = (sourceFile, destinationFile) => {
  const temporaryDestinationFile = `${destinationFile}.tmp`;
  fs.mkdirSync(path.dirname(destinationFile), { recursive: true });
  fs.copyFileSync(sourceFile, temporaryDestinationFile);
  fs.renameSync(temporaryDestinationFile, destinationFile);
};

const assertReadableFile = filePath => {
  fs.accessSync(filePath, fs.constants.R_OK);
  const fileDescriptor = fs.openSync(filePath, 'r');
  try {
    fs.readSync(fileDescriptor, Buffer.alloc(1), 0, 1, 0);
  } finally {
    fs.closeSync(fileDescriptor);
  }
};

const findReadableSourcePath = () => {
  const errors = [];
  for (const sourcePath of sourcePaths) {
    const sourceJsFile = path.join(sourcePath, 'libGD.js');
    const sourceWasmFile = path.join(sourcePath, 'libGD.wasm');
    try {
      assertReadableFile(sourceJsFile);
      assertReadableFile(sourceWasmFile);
      return { sourcePath, sourceJsFile, sourceWasmFile };
    } catch (error) {
      errors.push(`${sourcePath}: ${error.message}`);
    }
  }

  shell.echo('❌ You must compile GDevelop.js first.');
  shell.echo('ℹ️ Expected a readable matching libGD.js/libGD.wasm pair in:');
  for (const sourcePath of sourcePaths) {
    shell.echo(`- ${sourcePath}`);
  }
  shell.echo(errors.join('\n'));
  shell.exit(1);
};

if (shell.mkdir('-p', destinationTestPath).stderr) {
  shell.echo(
    `❌ Can't create ${destinationTestPath}. Have you the proper rights?`
  );
  shell.exit(1);
}

const { sourcePath, sourceJsFile, sourceWasmFile } = findReadableSourcePath();

try {
  copyFileAtomically(sourceJsFile, path.join(destinationPath, 'libGD.js'));
  copyFileAtomically(sourceJsFile, path.join(destinationTestPath, 'index.js'));
  copyFileAtomically(sourceWasmFile, path.join(destinationPath, 'libGD.wasm'));
  copyFileAtomically(sourceWasmFile, path.join(destinationTestPath, 'libGD.wasm'));
  shell.echo(
    `✅ Copied matching libGD.js/libGD.wasm from ${sourcePath} to public and node_modules folders of newIDE/app.`
  );
} catch (error) {
  shell.echo(
    `❌ Error while copying libGD.js/libGD.wasm from ${sourcePath} to public and node_modules folders of newIDE/app.`
  );
  shell.echo(error.message);
  shell.exit(1);
}
