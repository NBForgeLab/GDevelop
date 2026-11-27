// @ts-check
// Note: this file uses CommonJS syntax so it can be required directly from Node.js (types are in LocalJsExtensionsLoader.d.ts).

const { loadExtension } = require('.');
const optionalRequire = require('../Utils/OptionalRequire');
const { findJsExtensionModules } = require('./LocalJsExtensionsFinder');

/** @typedef {import('./index').JsExtensionModule} JsExtensionModule */

// This value is hardcoded to allow raising an error if the number of JS extensions
// loaded is different from the expected one, which may lead
// to projects corruption in the future if the app is still used.
// If a new extension is added, update this value.
// Also remember to add the extension in the list of extensions in BrowserJsExtensionsLoader.ts
/**
 * @param {{ filterExamples: boolean }} options
 * @returns {number}
 */
function getExpectedNumberOfJSExtensionModules({ filterExamples }) {
  return 30 + (filterExamples ? 0 : 1);
}

/**
 * Loader that will find all JS extensions declared in GDJS/Runtime/Extensions/xxx/JsExtension.js.
 * If you add a new extension and also want it to be available for the web-app version, add it in
 * BrowserJsExtensionsLoader.ts
 * @type {typeof import('./LocalJsExtensionsLoader')}
 */
const makeExtensionsLoader = function makeExtensionsLoader({
  gd,
  objectsEditorService,
  objectsRenderingService,
  filterExamples,
  onFindGDJS,
}) {
  return {
    loadAllExtensions: (_) => {
      return findJsExtensionModules({ filterExamples, onFindGDJS }).then(
        (extensionModulePaths) => {
          return Promise.all(
            extensionModulePaths.map((extensionModulePath) => {
              /** @type {JsExtensionModule | null} */
              let extensionModule = null;
              try {
                extensionModule = optionalRequire(extensionModulePath, {
                  rethrowException: true,
                });
              } catch (ex) {
                return {
                  extensionModulePath,
                  result: {
                    message:
                      'Unable to import extension. Please check for any syntax error or error that would prevent it from being run.',
                    error: true,
                    rawError: ex,
                  },
                };
              }

              if (!extensionModule) {
                return {
                  extensionModulePath,
                  result: {
                    error: true,
                    message:
                      'Unknown error. Please check for any syntax error or error that would prevent it from being run.',
                  },
                };
              }

              if (
                objectsEditorService &&
                extensionModule.registerEditorConfigurations
              ) {
                extensionModule.registerEditorConfigurations(
                  objectsEditorService
                );
              }

              if (objectsRenderingService) {
                if (extensionModule.registerInstanceRenderers) {
                  extensionModule.registerInstanceRenderers(
                    objectsRenderingService
                  );
                }
                if (extensionModule.registerClearCache) {
                  extensionModule.registerClearCache(objectsRenderingService);
                }
              }

              return {
                extensionModulePath,
                result: loadExtension(
                  _,
                  gd,
                  gd.JsPlatform.get(),
                  extensionModule
                ),
              };
            })
          ).then((results) => {
            return {
              results,
              expectedNumberOfJSExtensionModulesLoaded:
                getExpectedNumberOfJSExtensionModules({ filterExamples }),
            };
          });
        },
        (err) => {
          console.error(`Unable to find JS extensions modules`);
          throw err;
        }
      );
    },
  };
};

module.exports = makeExtensionsLoader;
