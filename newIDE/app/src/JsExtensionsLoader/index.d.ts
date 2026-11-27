export type TranslationFunction = (text: string) => string;

export type ObjectEditorConfiguration<
  TObjectConfiguration extends gdObjectConfiguration = gdObjectConfiguration,
  TComponent = any,
> = {
  component: TComponent;
  createNewObject: (
    objectConfiguration: gdObjectConfiguration
  ) => gdObjectConfiguration;
  castToObjectType: (
    objectConfiguration: gdObjectConfiguration
  ) => TObjectConfiguration;
  helpPagePath: string;
};

export interface JsExtensionObjectsEditorService {
  registerEditorConfiguration: (
    objectType: string,
    editorConfiguration: ObjectEditorConfiguration<any, any>
  ) => void;
  getDefaultObjectJsImplementationPropertiesEditor: (options: {
    helpPagePath: string;
  }) => ObjectEditorConfiguration<gdObjectJsImplementation, any>;
  editorConfigurations: Record<string, ObjectEditorConfiguration<any, any>>;
}

export interface JsExtensionObjectsRenderingService {
  renderers: Record<string, any>;
  renderers3D: Record<string, any>;
  registerInstanceRenderer: (objectType: string, renderer: any) => void;
  registerInstance3DRenderer: (objectType: string, renderer: any) => void;
  registerClearCache: (clearCache: (project: gdProject) => void) => void;
  registerModule: (requirePath: string, module: any) => void;
  requireModule: (
    requireBasePath: string,
    requirePath: string
  ) => any | null | undefined;
  getThumbnail: (
    project: gdProject,
    objectConfiguration: gdObjectConfiguration
  ) => any;
  rgbOrHexToHexNumber: (value: string) => number;
  hexNumberToRGBArray: (value: number) => [number, number, number];
  gd: libGDevelop;
  PIXI: any;
  THREE: any;
  THREE_ADDONS: {
    SkeletonUtils: any;
  };
  RenderedInstance: any;
  Rendered3DInstance: any;
}

export type JsExtensionModule = {
  createExtension: (
    _: TranslationFunction,
    gd: libGDevelop
  ) => gdPlatformExtension;
  runExtensionSanityTests: (
    gd: libGDevelop,
    extension: gdPlatformExtension
  ) => Array<string>;
  registerEditorConfigurations?: (
    objectsEditorService: JsExtensionObjectsEditorService
  ) => void;
  registerInstanceRenderers?: (
    objectsRenderingService: JsExtensionObjectsRenderingService
  ) => void;
  registerClearCache?: (
    objectsRenderingService: JsExtensionObjectsRenderingService
  ) => void;
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
  gd: libGDevelop,
  extension: gdPlatformExtension,
  jsExtensionModule: JsExtensionModule
) => ExtensionLoadingResult;

export declare const loadExtension: (
  _: TranslationFunction,
  gd: libGDevelop,
  platform: gdJsPlatform,
  jsExtensionModule: JsExtensionModule
) => ExtensionLoadingResult;
