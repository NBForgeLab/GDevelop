export type TranslationFunction = (text: string) => string;

export type JsExtensionModule = {
  createExtension: (_: TranslationFunction, gd: any) => gdPlatformExtension;
  runExtensionSanityTests: (
    gd: any,
    extension: gdPlatformExtension
  ) => Array<string>;
};

export type ExtensionLoadingResult = {
  error: boolean;
  message: string;
  dangerous?: boolean;
  rawError?: any;
};

export interface JsExtensionsLoader {
  loadAllExtensions: (_: TranslationFunction) => Promise<{
    results: Array<{
      extensionModulePath: string;
      result: ExtensionLoadingResult;
    }>;
    expectedNumberOfJSExtensionModulesLoaded: number;
  }>;
}

export declare const runExtensionSanityTests: (
  gd: any,
  extension: gdPlatformExtension,
  jsExtensionModule: JsExtensionModule
) => ExtensionLoadingResult;

export declare const loadExtension: (
  _: TranslationFunction,
  gd: any,
  platform: gdJsPlatform,
  jsExtensionModule: JsExtensionModule
) => ExtensionLoadingResult;
