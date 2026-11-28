// @ts-check
// Note: this file does not use export/imports to allow its usage from Node.js

const { findGDJS } = require('../GameEngineFinder/LocalGDJSFinder');
const optionalRequire = require('../Utils/OptionalRequire');
/** @type {typeof import('path') | null} */
const path = optionalRequire('path');
/** @type {typeof import('fs') | null} */
const fs = optionalRequire('fs');

/**
 * @param {string | null} modulePath
 * @returns {modulePath is string}
 */
const isNonNullString = (modulePath) => !!modulePath;

/**
 * @param {string} extensionFolderPath
 * @returns {Promise<string | null>}
 */
const checkIfPathHasJsExtensionModule = (extensionFolderPath) => {
  if (!path || !fs) {
    return Promise.resolve(null);
  }
  const pathModule = path;
  const fsModule = fs;
  return new Promise((resolve) => {
    const jsExtensionModulePath = pathModule.join(
      extensionFolderPath,
      'JsExtension.js'
    );
    fsModule.stat(jsExtensionModulePath, (err, stats) => {
      if (err) {
        return resolve(null);
      }

      return resolve(stats.isFile() ? jsExtensionModulePath : null);
    });
  });
};

/**
 * @param {{
 *   filterExamples: boolean,
 *   onFindGDJS?: (() => Promise<{ gdjsRoot: string }>) | null | undefined,
 * }} options
 * @returns {Promise<Array<string>>}
 */
const findJsExtensionModules = ({ filterExamples, onFindGDJS }) => {
  if (!path || !fs) {
    return Promise.reject(new Error('Unsupported'));
  }
  const pathModule = path;
  const fsModule = fs;
  return (onFindGDJS ? onFindGDJS() : findGDJS()).then(({ gdjsRoot }) => {
    const extensionsRoot = pathModule.join(gdjsRoot, 'Runtime', 'Extensions');
    console.info(
      `Searching for JS extensions (file called JsExtension.js) in ${extensionsRoot}...`
    );
    return new Promise((resolve, reject) => {
      fsModule.readdir(extensionsRoot, (error, extensionFolders) => {
        if (error) {
          return reject(error);
        }

        const filteredExtensionFolders = extensionFolders.filter((folder) => {
          if (!filterExamples) return true;

          return folder.indexOf('Example') === -1;
        });

        Promise.all(
          filteredExtensionFolders.map((extensionFolder) =>
            checkIfPathHasJsExtensionModule(
              pathModule.join(extensionsRoot, extensionFolder)
            )
          )
        ).then((modulePaths) => {
          resolve(modulePaths.filter(isNonNullString));
        }, reject);
      });
    });
  });
};

/** @type {typeof import('./LocalJsExtensionsFinder')} */
const LocalJsExtensionsFinder = {
  findJsExtensionModules,
};

module.exports = LocalJsExtensionsFinder;
