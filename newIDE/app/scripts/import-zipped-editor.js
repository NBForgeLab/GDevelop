/**
 * This script will download and extract a zipped version of a prebuilt external html5 editor
 * The zip file contains the raw, unchanged editor sources, which will be extracted into a folder
 * The zip should be uploaded with one of the git releases (use gitRelease variable for version where you released it)
 */
var shell = require('shelljs');
var AdmZip = require('adm-zip');
var fs = require('fs');
var process = require('process');
var path = require('path');
const { hashElement } = require('folder-hash');
const { downloadLocalFile } = require('./lib/DownloadLocalFile');
const { retryIfFailed } = require('./lib/RetryIfFailed');
const { validateZipEntries } = require('./lib/ValidateZipEntries');

const editor = process.argv[2];
const gitRelease = process.argv[3];
const expectedFolderHash = process.argv[4];
if (
  !editor ||
  !gitRelease ||
  !expectedFolderHash ||
  editor.indexOf('/') !== -1 ||
  editor.indexOf('\\') !== -1 ||
  editor.indexOf('..') !== -1 ||
  editor.indexOf(':') !== -1 ||
  editor.indexOf('\0') !== -1 ||
  editor === '.'
) {
  shell.echo(
    '❌ Usage: node import-zipped-editor.js <editor> <gitRelease> <expectedFolderHash>'
  );
  process.exit(1);
}
const gitUrl = 'https://github.com/4ian/GDevelop';
const editorParentPath = path.join('../public/external/', editor);
const expectedFolderName = editor + '-editor';
const basePath = path.join(editorParentPath, expectedFolderName);
const zipFilePath = basePath + '.zip';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const safeRemovePath = targetPath => {
  if (!targetPath) return;
  fs.rmSync(targetPath, {
    recursive: true,
    force: true,
    maxRetries: 5,
    retryDelay: 100,
  });
};

const renameWithRetry = async (
  sourcePath,
  destinationPath,
  maxRetries = 5,
  retryDelayMs = 100
) => {
  for (let attempt = 0; ; attempt++) {
    try {
      await fs.promises.rename(sourcePath, destinationPath);
      return;
    } catch (error) {
      const code = error && error.code;
      const isRetryable =
        code === 'EPERM' || code === 'EBUSY' || code === 'EACCES';
      if (!isRetryable || attempt >= maxRetries) {
        throw error;
      }
      await delay(retryDelayMs * (attempt + 1));
    }
  }
};

const replaceDirectorySafely = async (
  stagedPath,
  targetPath,
  parentPath,
  editorName
) => {
  const backupPath = path.join(
    parentPath,
    '.backup-' + editorName + '-' + process.pid + '-' + Date.now()
  );
  let hasBackup = false;

  if (fs.existsSync(targetPath)) {
    await renameWithRetry(targetPath, backupPath);
    hasBackup = true;
  }

  try {
    await renameWithRetry(stagedPath, targetPath);
  } catch (error) {
    if (hasBackup && !fs.existsSync(targetPath) && fs.existsSync(backupPath)) {
      try {
        await renameWithRetry(backupPath, targetPath);
      } catch (restoreError) {
        shell.echo(
          `⚠️ Failed to restore existing ${editorName}-editor backup: ${
            restoreError.message
          }`
        );
      }
    }
    throw error;
  }

  if (hasBackup) {
    safeRemovePath(backupPath);
  }
};

// Tool function checking if the editor folder has the proper SHA256 checksum
// If you're updating the zip of a third party editor, update also the checksum
// in package.json.
const editorHasCorrectHash = (targetPath = basePath) =>
  hashElement(targetPath, { algo: 'sha256', encoding: 'hex' }).then(
    folderHashResult => {
      const actualFolderHash = folderHashResult.hash;
      return {
        isHashCorrect: actualFolderHash === expectedFolderHash,
        actualFolderHash,
      };
    },
    () => {
      // Cannot hash the editor folder to see if it's up-to-date, assuming not.
      return {
        isHashCorrect: false,
        actualFolderHash: '',
      };
    }
  );

(async () => {
  const { isHashCorrect } = await editorHasCorrectHash();

  if (isHashCorrect) {
    //Nothing to do
    shell.echo(
      '✅ ' +
        editor +
        '-editor already existing in public/external/' +
        editor +
        ' folder and up-to-date - skipping download'
    );
    return;
  }

  shell.echo(
    '🌐 Outdated/non-existing ' +
      editor +
      '-editor, downloading it from ' +
      gitUrl +
      ' (be patient)...'
  );

  try {
    fs.mkdirSync(editorParentPath, { recursive: true });
    await retryIfFailed(
      { times: 3, backoff: { initialDelay: 400, factor: 2 } },
      () =>
        downloadLocalFile(
          gitUrl +
            '/releases/download/v' +
            gitRelease +
            '/' +
            editor +
            '-editor.zip',
          zipFilePath
        )
    );
    shell.echo(
      '📂 Extracting ' +
        editor +
        '-editor.zip to public/external/' +
        editor +
        ' folder'
    );

    let stagingDir = null;
    try {
      stagingDir = fs.mkdtempSync(
        path.join(editorParentPath, '.tmp-' + editor + '-')
      );
      const zip = new AdmZip(zipFilePath);
      validateZipEntries(zip, stagingDir);
      zip.extractAllTo(stagingDir, /*overwrite=*/ true);

      const stagedEntries = fs.readdirSync(stagingDir);
      const unexpectedEntries = stagedEntries.filter(
        entry => entry !== expectedFolderName && entry !== '__MACOSX'
      );
      const stagedBasePath = path.join(stagingDir, expectedFolderName);
      if (
        unexpectedEntries.length > 0 ||
        !fs.existsSync(stagedBasePath) ||
        !fs.statSync(stagedBasePath).isDirectory()
      ) {
        throw new Error(
          `Unexpected archive structure in ${editor}-editor.zip (entries: ${stagedEntries.join(
            ', '
          )})`
        );
      }

      const { isHashCorrect, actualFolderHash } = await editorHasCorrectHash(
        stagedBasePath
      );

      if (!isHashCorrect) {
        shell.echo(
          "❌ Can't verify that " +
            editor +
            '-editor hash is correct. Be careful about potential tampering of the third party editor! 💣'
        );
        shell.echo(
          `ℹ️ Expected folder hash was "${expectedFolderHash}" while actual folder hash that is computed is "${actualFolderHash}".`
        );
        safeRemovePath(stagingDir);
        safeRemovePath(zipFilePath);
        process.exit(1);
      }

      await replaceDirectorySafely(
        stagedBasePath,
        basePath,
        editorParentPath,
        editor
      );
      safeRemovePath(stagingDir);
      safeRemovePath(zipFilePath);

      shell.echo(
        '✅ Extracted ' +
          editor +
          '-editor.zip to public/external/' +
          editor +
          ' folder'
      );
    } catch (e) {
      shell.echo(
        '❌ Error while extracting ' +
          editor +
          '-editor.zip to public/external/' +
          editor +
          ' folder:',
        e.message
      );
      if (stagingDir) safeRemovePath(stagingDir);
      safeRemovePath(zipFilePath);
      process.exit(1);
    }
  } catch (e) {
    shell.echo(
      `❌ Can't download ` +
        editor +
        `-editor.zip (${e}), please check your internet connection`
    );
    safeRemovePath(zipFilePath);
    process.exit(1);
    return;
  }
})();
