// @ts-check
// Note: this file uses CommonJS syntax so it can be required directly from Node.js (types are in index.d.ts).

const some = require('lodash/some');

/** @typedef {import('./index').TranslationFunction} TranslationFunction */
/** @typedef {import('./index').JsExtensionModule} JsExtensionModule */
/** @typedef {import('./index').ExtensionLoadingResult} ExtensionLoadingResult */

/**
 * Run extensions tests and check for any non-empty results.
 * @param {libGDevelop} gd
 * @param {gdPlatformExtension} extension
 * @param {JsExtensionModule} jsExtensionModule
 * @returns {ExtensionLoadingResult}
 */
const runExtensionSanityTests = (gd, extension, jsExtensionModule) => {
  if (!jsExtensionModule.runExtensionSanityTests) {
    return {
      error: true,
      message:
        'Missing runExtensionSanityTests in the extension module exports',
    };
  }

  const testResults = jsExtensionModule.runExtensionSanityTests(gd, extension);
  if (some(testResults)) {
    return {
      error: true,
      message: 'One or more tests are failing for the extension (see rawError)',
      rawError: testResults,
    };
  }

  return {
    error: false,
    message: 'Tests passed successfully',
  };
};

/**
 * Load an extension from the specified JavaScript module, which is supposed
 * to contain a "createExtension" function returning a gd.PlatformExtension.
 * @param {TranslationFunction} _
 * @param {libGDevelop} gd
 * @param {gdJsPlatform} platform
 * @param {JsExtensionModule} jsExtensionModule
 * @returns {ExtensionLoadingResult}
 */
const loadExtension = (_, gd, platform, jsExtensionModule) => {
  if (!jsExtensionModule.createExtension) {
    return {
      message:
        'Extension module found, but no createExtension method is exported',
      error: true,
    };
  }

  let extension = null;
  try {
    extension = jsExtensionModule.createExtension(_, gd);
    if (!extension) {
      return {
        message: `createExtension did not return any extension. Did you forget to return the extension created?`,
        error: true,
      };
    }
  } catch (ex) {
    return {
      message: `🚨 Exception caught while running createExtension. 💣 Please fix this error as this will make GDevelop crash at some point.`,
      error: true,
      dangerous: true,
      rawError: ex,
    };
  }

  try {
    const testsResult = runExtensionSanityTests(
      gd,
      extension,
      jsExtensionModule
    );
    if (testsResult.error) {
      extension.delete();
      return testsResult;
    }
  } catch (ex) {
    return {
      message: `🚨 Exception caught while running runExtensionSanityTests. 💣 Please fix this error as this will make GDevelop crash at some point.`,
      error: true,
      dangerous: true,
      rawError: ex,
    };
  }

  platform.addNewExtension(extension);
  extension.delete(); // Release the extension as it was copied inside gd.JsPlatform

  return {
    message: '✅ Successfully loaded the extension.',
    error: false,
  };
};

/** @type {Pick<typeof import('./index'), 'runExtensionSanityTests' | 'loadExtension'>} */
const JsExtensionsLoaderHelpers = {
  runExtensionSanityTests,
  loadExtension,
};

module.exports = JsExtensionsLoaderHelpers;
