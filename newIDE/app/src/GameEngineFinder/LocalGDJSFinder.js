// @flow
// Note: this file don't use export/imports nor Flow to allow its usage from Node.js

const optionalRequire = require('../Utils/OptionalRequire');

const getDesktopBridge = () =>
  typeof window !== 'undefined' && window.gdevelopDesktop
    ? window.gdevelopDesktop
    : null;

const findGDJS = () /*: Promise<{|gdjsRoot: string|}> */ => {
  const desktopBridge = getDesktopBridge();
  const bootstrap =
    desktopBridge && typeof desktopBridge.getBootstrapData === 'function'
      ? desktopBridge.getBootstrapData()
      : null;

  if (desktopBridge && desktopBridge.fs && bootstrap) {
    const platform = bootstrap.platform || '';
    const isDarwin = /^darwin/.test(platform);
    const appPath = bootstrap.appPath || bootstrap.cwd || '/';
    const {
      join: joinPath,
    } = require('../Utils/DesktopPath').createDesktopPath({
      platform,
      getCwd: () => bootstrap.cwd || '/',
    });

    const tryBridgePath = (
      targetPath /*: string*/,
      onExists /*: string => void*/,
      onNoAccess /*: Function*/
    ) => {
      desktopBridge.fs
        .access(targetPath)
        .then(
          result =>
            result && result.ok === false ? onNoAccess() : onExists(targetPath),
          () => onNoAccess()
        );
    };

    const rootPath = isDarwin
      ? joinPath(appPath, '..', '..', '..', '..')
      : joinPath(appPath, '..', '..');

    return new Promise((resolve, reject) => {
      // $FlowFixMe[missing-local-annot]
      const onFound = gdjsRoot => resolve({ gdjsRoot });
      const onNotFound = () => reject(new Error('Could not find GDJS'));

      tryBridgePath(joinPath(rootPath, '..', 'JsPlatform'), onFound, () => {
        tryBridgePath(joinPath(appPath, '..', 'GDJS'), onFound, () => {
          const devPath = joinPath(
            appPath,
            '..',
            '..',
            'app',
            'resources',
            'GDJS'
          );
          tryBridgePath(devPath, onFound, onNotFound);
        });
      });
    });
  }

  const fs = optionalRequire('fs');
  const path = optionalRequire('path');
  const process = optionalRequire('process');
  if (!path || !process || !fs) return Promise.reject(new Error('Unsupported'));

  const isDarwin = /^darwin/.test(process.platform);
  const tryPath = (
    targetPath /*: string*/,
    onExists /*: string => void*/,
    onNoAccess /*: Function*/
  ) =>
    fs.access(targetPath, fs.constants.R_OK, err => {
      if (!err) onExists(targetPath);
      else onNoAccess();
    });

  const appPath = process.cwd();

  // The app path is [...]/*.app/Contents/Resources/app.asar on macOS
  // and [...]/resources/app.asar on other OSes.
  const pathToRoot = isDarwin ? '../../../../' : path.join('..', '..');
  const rootPath = path.join(appPath, pathToRoot);

  return new Promise((resolve, reject) => {
    // $FlowFixMe[missing-local-annot]
    const onFound = gdjsRoot => resolve({ gdjsRoot });
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

module.exports = {
  findGDJS,
};
