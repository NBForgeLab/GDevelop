type GDNamespace = typeof import('../GDevelop.js/types');

// This is necessary for typescript to interpret the identifier PIXI as a namespace
// in this file and merge it with the other namespace declarations.
declare namespace PIXI {}

declare interface PixiResourcesLoader {
  burstCache(): Promise<void>;
  reloadResource(project: gd.Project, resourceName: string): Promise<void>;
  loadTextures(project: gd.Project, resourceNames: string[]): Promise<void>;
  getPIXITexture(project: gd.Project, resourceName: string): PIXI.Texture;
  getThreeTexture(
    project: gd.Project,
    resourceName: string
  ): Promise<THREE.Texture>;
  getThreeMaterial(
    project: gd.Project,
    resourceName: string,
    options: {
      useTransparentTexture: boolean;
      forceBasicMaterial: boolean;
    }
  ): Promise<THREE.Material>;
  get3DModel(
    project: gd.Project,
    resourceName: string
  ): Promise<THREE_ADDONS.GLTF>;
  createSpine(
    project: gd.Project,
    resourceName: string
  ): Promise<spine.Spine | null>;
  getPIXIVideoTexture(project: gd.Project, resourceName: string): PIXI.Texture;
  loadFontFamily(
    project: gd.Project,
    fontResourceName: string
  ): Promise<string>;
  getFontFamily(project: gd.Project, resourceName: string): string;
  getBitmapFontData(project: gd.Project, resourceName: string): Promise<any>;
  getInvalidPIXITexture(): PIXI.Texture;
  getLoadingPIXITexture(): PIXI.Texture;
  getResourceJsonData(project: gd.Project, resourceName: string): Promise<any>;
}

/**
 * RenderedInstance is the base class used for creating 2D renderers of instances,
 * which display on the scene editor, using Pixi.js, the instance of an object (see InstancesEditor).
 */
declare class RenderedInstance<
  TPixiObject extends PIXI.DisplayObject = PIXI.DisplayObject,
> {
  _project: gd.Project;
  _instance: gd.InitialInstance;
  _associatedObjectConfiguration: gd.ObjectConfiguration;
  _pixiContainer: PIXI.Container;
  _pixiResourcesLoader: PixiResourcesLoader;
  _pixiObject: TPixiObject | null;
  _getPropertyOverridings: (() => Map<string, string>) | null;
  wasUsed: boolean;

  /** Set to true when onRemovedFromScene is called. Allows to cancel promises/asynchronous operations (notably: waiting for a resource load). */
  _wasDestroyed: boolean;

  constructor(
    project: gd.Project,
    instance: gd.InitialInstance,
    associatedObjectConfiguration: gd.ObjectConfiguration,
    pixiContainer: PIXI.Container,
    pixiResourcesLoader: PixiResourcesLoader,
    getPropertyOverridings?: (() => Map<string, string>) | null
  );

  isRenderedIn3D(): boolean;

  /**
   * Convert an angle from degrees to radians.
   */
  static toRad(angleInDegrees: number): number;

  /**
   * Called when the scene editor is rendered.
   */
  update(): void;

  getPixiObject(): PIXI.DisplayObject | null;

  getInstance(): gd.InitialInstance;

  /**
   * Called to notify the instance renderer that its associated instance was removed from
   * the scene. The PIXI object should probably be removed from the container: This is what
   * the default implementation of the method does.
   */
  onRemovedFromScene(): void;

  resetInstanceRenderersFor(objectName: string): void;

  getOriginX(): number;

  getOriginY(): number;

  getOriginZ(): number;

  getCenterX(): number;

  getCenterY(): number;

  getCustomWidth(): number;

  getCustomHeight(): number;

  getWidth(): number;

  getHeight(): number;

  getDepth(): number;

  /**
   * Return the width of the instance when the instance doesn't have a custom size.
   */
  getDefaultWidth(): number;

  /**
   * Return the height of the instance when the instance doesn't have a custom size.
   */
  getDefaultHeight(): number;

  getDefaultDepth(): number;

  getPropertyOverridings(): Map<string, string> | null;
}

/**
 * Rendered3DInstance is the base class used for creating 3D renderers of instances,
 * which display on the scene editor, using Three.js, the instance of an object (see InstancesEditor).
 * It can also display 2D artifacts on Pixi 2D plane (3D object shadow projected on the plane for instance).
 */
declare class Rendered3DInstance<
  TPixiObject extends PIXI.DisplayObject = PIXI.DisplayObject,
  TThreeObject extends THREE.Object3D = THREE.Object3D,
> {
  _project: gd.Project;
  _instance: gd.InitialInstance;
  _associatedObjectConfiguration: gd.ObjectConfiguration;
  _pixiContainer: PIXI.Container;
  _threeGroup: THREE.Group | null;
  _pixiResourcesLoader: PixiResourcesLoader;
  _pixiObject: TPixiObject | null;
  _threeObject: TThreeObject | null;
  _getPropertyOverridings: (() => Map<string, string>) | null;
  wasUsed: boolean;

  /** Set to true when onRemovedFromScene is called. Allows to cancel promises/asynchronous operations (notably: waiting for a resource load). */
  _wasDestroyed: boolean;

  constructor(
    project: gd.Project,
    instance: gd.InitialInstance,
    associatedObjectConfiguration: gd.ObjectConfiguration,
    pixiContainer: PIXI.Container,
    threeGroup: THREE.Group | null,
    pixiResourcesLoader: PixiResourcesLoader,
    getPropertyOverridings?: (() => Map<string, string>) | null
  );

  isRenderedIn3D(): boolean;

  /**
   * Convert an angle from degrees to radians.
   */
  static toRad(angleInDegrees: number): number;

  /**
   * Applies ratio to value without intermediary value to avoid precision issues.
   */
  static applyRatio({
    oldReferenceValue,
    newReferenceValue,
    valueToApplyTo,
  }: {
    oldReferenceValue: number;
    newReferenceValue: number;
    valueToApplyTo: number;
  }): number;

  /**
   * Called when the scene editor is rendered.
   */
  update(): void;

  getPixiObject(): PIXI.DisplayObject | null;

  getThreeObject(): THREE.Object3D | null;

  getInstance(): gd.InitialInstance;

  /**
   * Called to notify the instance renderer that its associated instance was removed from
   * the scene. The PIXI object should probably be removed from the container: This is what
   * the default implementation of the method does.
   */
  onRemovedFromScene(): void;

  resetInstanceRenderersFor(objectName: string): void;

  getOriginX(): number;

  getOriginY(): number;

  getOriginZ(): number;

  getCenterX(): number;

  getCenterY(): number;

  getCenterZ(): number;

  getCustomWidth(): number;

  getCustomHeight(): number;

  getCustomDepth(): number;

  getWidth(): number;

  getHeight(): number;

  getDepth(): number;

  /**
   * Return the width of the instance when the instance doesn't have a custom size.
   */
  getDefaultWidth(): number;

  /**
   * Return the height of the instance when the instance doesn't have a custom size.
   */
  getDefaultHeight(): number;

  /**
   * Return the depth of the instance when the instance doesn't have a custom size.
   */
  getDefaultDepth(): number;

  getPropertyOverridings(): Map<string, string> | null;
}

declare type ObjectEditorConfiguration<
  TObjectConfiguration extends gd.ObjectConfiguration = gd.ObjectConfiguration,
> = {
  component: any;
  createNewObject: (
    objectConfiguration: gd.ObjectConfiguration
  ) => gd.ObjectConfiguration;
  castToObjectType: (
    objectConfiguration: gd.ObjectConfiguration
  ) => TObjectConfiguration;
  helpPagePath: string;
};

declare type InstanceRendererConstructor = (new (
  project: gd.Project,
  instance: gd.InitialInstance,
  associatedObjectConfiguration: gd.ObjectConfiguration,
  pixiContainer: PIXI.Container,
  pixiResourcesLoader: PixiResourcesLoader,
  getPropertyOverridings?: (() => Map<string, string>) | null
) => RenderedInstance<any>) & {
  getThumbnail: (
    project: gd.Project,
    resourcesLoader: any,
    objectConfiguration: gd.ObjectConfiguration
  ) => string;
};

declare type Instance3DRendererConstructor = new (
  project: gd.Project,
  instance: gd.InitialInstance,
  associatedObjectConfiguration: gd.ObjectConfiguration,
  pixiContainer: PIXI.Container,
  threeGroup: THREE.Group | null,
  pixiResourcesLoader: PixiResourcesLoader,
  getPropertyOverridings?: (() => Map<string, string>) | null
) => Rendered3DInstance<any, any>;

declare type ObjectsRenderingService = {
  gd: GDNamespace;
  PIXI: typeof PIXI;
  THREE: typeof THREE;
  THREE_ADDONS: { SkeletonUtils: typeof THREE_ADDONS.SkeletonUtils };
  RenderedInstance: typeof RenderedInstance;
  Rendered3DInstance: typeof Rendered3DInstance;
  registerInstanceRenderer: (
    objectType: string,
    renderer: InstanceRendererConstructor
  ) => void;
  registerInstance3DRenderer: (
    objectType: string,
    renderer: Instance3DRendererConstructor
  ) => void;
  requireModule: (dirname: string, moduleName: string) => any;
  getThumbnail: (
    project: gd.Project,
    objectConfiguration: gd.ObjectConfiguration
  ) => string;
  rgbOrHexToHexNumber: (value: string) => number;
  hexNumberToRGBArray: (value: number) => [number, number, number];
  registerClearCache: (clearCache: (project: gd.Project) => void) => void;
};

declare type ObjectsEditorService = {
  registerEditorConfiguration: (
    objectType: string,
    editorConfiguration: ObjectEditorConfiguration<any>
  ) => void;
  getDefaultObjectJsImplementationPropertiesEditor: (options: {
    helpPagePath: string;
  }) => ObjectEditorConfiguration<gd.ObjectJsImplementation>;
};

declare type ExtensionModule = {
  createExtension: (
    _: (text: string) => string,
    gd: GDNamespace
  ) => gd.PlatformExtension;
  /**
   * You can optionally add sanity tests that will check the basic working
   * of your extension behaviors/objects by instantiating behaviors/objects
   * and setting the property to a given value.
   *
   * If you don't have any tests, you can simply return an empty array.
   *
   * But it is recommended to create tests for the behaviors/objects properties you created
   * to avoid mistakes.
   */
  runExtensionSanityTests: (
    gd: GDNamespace,
    extension: gd.PlatformExtension
  ) => string[];
  /**
   * Register editors for objects.
   *
   * ℹ️ Run `node import-GDJS-Runtime.js` (in newIDE/app/scripts) if you make any change.
   */
  registerEditorConfigurations?: (
    objectsEditorService: ObjectsEditorService
  ) => void;
  /**
   * Register renderers for instance of objects on the scene editor.
   *
   * ℹ️ Run `node import-GDJS-Runtime.js` (in newIDE/app/scripts) if you make any change.
   */
  registerInstanceRenderers?: (
    objectsRenderingService: ObjectsRenderingService
  ) => void;
  /**
   * Register callbacks clearing cached resources when closing or reloading a project.
   *
   * ℹ️ Run `node import-GDJS-Runtime.js` (in newIDE/app/scripts) if you make any change.
   */
  registerClearCache?: (
    objectsRenderingService: ObjectsRenderingService
  ) => void;
};
