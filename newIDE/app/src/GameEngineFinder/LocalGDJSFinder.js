// @ts-check
// Note: this file does not use ES import/export syntax so it can be required directly from Node.js.

const optionalRequire = require('../Utils/OptionalRequire');
/** @type {{ app?: { getAppPath: () => string } } | null} */
const remote = optionalRequire('@electron/remote');
const app = remote && remote.app ? remote.app : null;
/** @type {typeof import('fs') | null} */
const fs = optionalRequire('fs');
/** @type {typeof import('path') | null} */
const path = optionalRequire('path');
/** @type {NodeJS.Process | null} */
const process = optionalRequire('process');
var isDarwin = process && /^darwin/.test(process.platform);

/**
 * @param {string} targetPath
 * @param {(gdjsRoot: string) => void} onExists
 * @param {() => void} onNoAccess
 */
const tryPath = (targetPath, onExists, onNoAccess) => {
  if (!fs) {
    onNoAccess();
    return;
  }
  fs.access(targetPath, fs.constants.R_OK, (err) => {
    if (!err) onExists(targetPath);
    else onNoAccess();
  });
};

/** @returns {Promise<{ gdjsRoot: string }>} */
const findGDJS = () => {
  if (!path || !process || !fs) return Promise.reject(new Error('Unsupported'));

  const appPath = app ? app.getAppPath() : process.cwd();

  // The app path is [...]/*.app/Contents/Resources/app.asar on macOS
  // and [...]/resources/app.asar on other OSes.
  const pathToRoot = isDarwin ? '../../../../' : path.join('..', '..');
  const rootPath = path.join(appPath, pathToRoot);

  return new Promise((resolve, reject) => {
    /** @param {string} gdjsRoot */
    const onFound = (gdjsRoot) => resolve({ gdjsRoot });
    const onNotFound = () => reject(new Error('Could not find GDJS'));

    // First try to find GDJS in the parent folder (when newIDE is inside IDE)
    tryPath(path.join(rootPath, '..', 'JsPlatform'), onFound, () => {
      // Or in the resources (for a standalone newIDE)
      tryPath(path.join(appPath, '..', 'GDJS'), onFound, () => {
        // Or in the resources when developing with Electron
        const devPath = path.join(
          appPath,
          '..',
          '..',
          'app',
          'resources',
          'GDJS'
        );
        tryPath(devPath, onFound, onNotFound);
      });
    });
  });
};

/** @type {typeof import('./LocalGDJSFinder')} */
const LocalGDJSFinder = {
  findGDJS,
};

module.exports = LocalGDJSFinder;
