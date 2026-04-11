type GDNamespace = typeof import('../GDevelop.js/types');

/**
 * RenderedInstance is the base class used for creating 2D renderers of instances,
 * which display on the scene editor, using Three.js, the instance of an object (see InstancesEditor).
 */
class RenderedInstance {
  _project: gd.Project;
  _instance: gd.InitialInstance;
  _associatedObjectConfiguration: gd.ObjectConfiguration;
  _layerGroup: THREE.Group;
  _resourcesLoader: Class<ThreeResourcesLoader>;
  _threeObject: THREE.Object3D | null;
  _getPropertyOverridings: (() => Map<string, string>) | null;
  wasUsed: boolean;

  /** Set to true when onRemovedFromScene is called. Allows to cancel promises/asynchronous operations (notably: waiting for a resource load). */
  _wasDestroyed: boolean;

  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration,
    layerGroup: THREE.Group,
    resourcesLoader: Class<ThreeResourcesLoader>,
    getPropertyOverridings: (() => Map<string, string>) | null = null
  );

  /**
   * Convert an angle from degrees to radians.
   */
  static toRad(angleInDegrees: number): number;

  /**
   * Called when the scene editor is rendered.
   */
  update(): void;

  getThreeObject(): THREE.Object3D | null;

  getInstance(): gd.InitialInstance;

  /**
   * Called to notify the instance renderer that its associated instance was removed from
   * the scene. The Three.js object should probably be removed from the container: This is what
   * the default implementation of the method does.
   */
  onRemovedFromScene(): void;

  getOriginX(): number;

  getOriginY(): number;

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
 * It can also display auxiliary 2D artifacts using Three.js overlay meshes when needed.
 */
class Rendered3DInstance {
  _project: gdProject;
  _instance: gdInitialInstance;
  _associatedObjectConfiguration: gdObjectConfiguration;
  _layerGroup: THREE.Group;
  _threeGroup: THREE.Group;
  _resourcesLoader: Class<ThreeResourcesLoader>;
  _threeObject: THREE.Object3D | null;
  wasUsed: boolean;

  /** Set to true when onRemovedFromScene is called. Allows to cancel promises/asynchronous operations (notably: waiting for a resource load). */
  _wasDestroyed: boolean;

  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration,
    layerGroup: THREE.Group,
    threeGroup: THREE.Group,
    resourcesLoader: Class<ThreeResourcesLoader>,
    getPropertyOverridings: (() => Map<string, string>) | null = null
  );

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

  getThreeObject(): THREE.Object3D;

  getInstance(): gd.InitialInstance;

  /**
   * Called to notify the instance renderer that its associated instance was removed from
   * the scene. The Three.js object should probably be removed from its group: This is what
   * the default implementation of the method does.
   */
  onRemovedFromScene(): void;

  getOriginX(): number;

  getOriginY(): number;

  getCenterX(): number;

  getCenterY(): number;

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

declare type ObjectsRenderingService = {
  gd: GDNamespace;
  THREE: typeof import('../newIDE/app/node_modules/three');
  THREE_ADDONS: { SkeletonUtils: any };
  RenderedInstance: typeof RenderedInstance;
  Rendered3DInstance: typeof Rendered3DInstance;
  registerInstanceRenderer: (objectType: string, renderer: any) => void;
  registerInstance3DRenderer: (objectType: string, renderer: any) => void;
  requireModule: (dirname: string, moduleName: string) => any;
  getThumbnail: (
    project: gd.Project,
    objectConfiguration: gd.ObjectConfiguration
  ) => string;
  rgbOrHexToHexNumber: (value: string) => number;
  hexNumberToRGBArray: (value: number) => [number, number, number];
  registerClearCache: (clearCache: (_: any) => void) => void;
};

declare class ThreeResourcesLoader {
  static loadFontFamily(
    project: gd.Project,
    resourceName: string
  ): Promise<string>;
  static getThreeTexture(
    project: gd.Project,
    resourceName: string
  ): Promise<THREE.Texture>;
  static getThreeMaterial(
    project: gd.Project,
    resourceName: string,
    options: {
      useTransparentTexture: boolean;
    }
  ): Promise<THREE.Material>;
  static get3DModel(project: gd.Project, resourceName: string): Promise<any>;
  static getBitmapFontData(
    project: gd.Project,
    resourceName: string
  ): Promise<any>;
  static getInvalidThreeTexture(): THREE.Texture;
  static getLoadingThreeTexture(): THREE.Texture;
  static getThreeVideoTexture(
    project: gd.Project,
    resourceName: string
  ): Promise<{
    texture: THREE.VideoTexture;
    video: HTMLVideoElement;
  }>;
}

declare type ObjectsEditorService = {
  registerEditorConfiguration: (
    objectType: string,
    editorConfiguration: any
  ) => void;
  getDefaultObjectJsImplementationPropertiesEditor: ({
    helpPagePath: string,
  }) => any;
};

declare type ExtensionModule = {
  createExtension: (
    _: (string) => string,
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
};
