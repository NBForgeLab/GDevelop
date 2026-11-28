import * as PIXI from 'pixi.js-legacy';
import * as THREE from 'three';
import * as SkeletonUtils from 'three/examples/jsm/utils/SkeletonUtils';
import type ResourcesLoader from '../ResourcesLoader';
import type PixiResourcesLoader from '../ObjectsRendering/PixiResourcesLoader';
import type RenderedInstance from '../ObjectsRendering/Renderers/RenderedInstance';
import type Rendered3DInstance from '../ObjectsRendering/Renderers/Rendered3DInstance';

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

export type InstanceRendererConstructor = (new (
  project: gdProject,
  instance: gdInitialInstance,
  associatedObjectConfiguration: gdObjectConfiguration,
  pixiContainer: PIXI.Container,
  pixiResourcesLoader: typeof PixiResourcesLoader,
  getPropertyOverridings?: (() => Map<string, string>) | null
) => RenderedInstance<any>) & {
  getThumbnail: (
    project: gdProject,
    resourcesLoader: typeof ResourcesLoader,
    objectConfiguration: gdObjectConfiguration
  ) => string;
};

export type Instance3DRendererConstructor = new (
  project: gdProject,
  instance: gdInitialInstance,
  associatedObjectConfiguration: gdObjectConfiguration,
  pixiContainer: PIXI.Container,
  threeGroup: THREE.Group | null,
  pixiResourcesLoader: typeof PixiResourcesLoader,
  getPropertyOverridings?: (() => Map<string, string>) | null
) => Rendered3DInstance<any, any>;

export interface JsExtensionObjectsRenderingService {
  renderers: Record<string, InstanceRendererConstructor>;
  renderers3D: Record<string, Instance3DRendererConstructor>;
  registerInstanceRenderer: (
    objectType: string,
    renderer: InstanceRendererConstructor
  ) => void;
  registerInstance3DRenderer: (
    objectType: string,
    renderer: Instance3DRendererConstructor
  ) => void;
  registerClearCache: (clearCache: (project: gdProject) => void) => void;
  registerModule: (requirePath: string, module: any) => void;
  requireModule: (
    requireBasePath: string,
    requirePath: string
  ) => any | null | undefined;
  getThumbnail: (
    project: gdProject,
    objectConfiguration: gdObjectConfiguration
  ) => string;
  rgbOrHexToHexNumber: (value: string) => number;
  hexNumberToRGBArray: (value: number) => [number, number, number];
  gd: libGDevelop;
  PIXI: typeof PIXI;
  THREE: typeof THREE;
  THREE_ADDONS: {
    SkeletonUtils: typeof SkeletonUtils;
  };
  RenderedInstance: typeof RenderedInstance;
  Rendered3DInstance: typeof Rendered3DInstance;
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
