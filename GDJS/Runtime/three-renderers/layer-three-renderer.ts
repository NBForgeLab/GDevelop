namespace gdjs {
  const renderOrderFor2DObject = (zOrder: float) => 100000 + zOrder;

  const asThreeObjectOrNull = (object: unknown): THREE.Object3D | null => {
    if (object instanceof THREE.Object3D) {
      return object;
    }

    return null;
  };

  const throwIfNotThreeObject = (
    object: unknown,
    context: string
  ): THREE.Object3D => {
    if (object instanceof THREE.Object3D) {
      return object;
    }

    throw new Error(
      context +
        ' received a non-Three renderer object. The runtime only accepts Three.js display objects.'
    );
  };

  /**
   * The renderer for a gdjs.Layer using Three.js only.
   * @category Renderers > Layers
   */
  export class LayerThreeRenderer {
    private static vectorForProjections: THREE.Vector3 | null = null;
    private _layer: gdjs.RuntimeLayer;
    private _threeRenderer: THREE.WebGLRenderer | null;
    private _threeGroup: THREE.Group;
    private _threeScene: THREE.Scene;
    private _threeCamera: THREE.PerspectiveCamera | THREE.OrthographicCamera;
    private _threeEffectComposer: THREE_ADDONS.EffectComposer | null = null;
    private _threePostProcessingPassesByEffectName: Map<
      string,
      THREE_ADDONS.Pass
    > = new Map();
    private _camera3DFieldOfView: float;
    private _camera3DNearPlaneDistance: float;
    private _camera3DFarPlaneDistance: float;
    private _camera2DPlaneMaxDrawingDistance: float;
    private _needsCameraUpdate: boolean = true;

    constructor(
      layer: gdjs.RuntimeLayer,
      runtimeInstanceContainerRenderer: gdjs.RuntimeInstanceContainerRenderer,
      runtimeGameRenderer: gdjs.RuntimeGameRenderer
    ) {
      this._layer = layer;
      this._threeRenderer = runtimeGameRenderer.getThreeRenderer();
      this._camera3DFieldOfView = layer.getInitialCamera3DFieldOfView();
      this._camera3DNearPlaneDistance =
        layer.getInitialCamera3DNearPlaneDistance();
      this._camera3DFarPlaneDistance =
        layer.getInitialCamera3DFarPlaneDistance();
      this._camera2DPlaneMaxDrawingDistance =
        layer.getInitialCamera2DPlaneMaxDrawingDistance();

      this._threeGroup = new THREE.Group();
      this._threeGroup.name = layer.getName();
      this._threeScene = new THREE.Scene();
      this._threeScene.name = layer.getName();
      this._threeScene.add(this._threeGroup);
      this._threeScene.background = null;

      this._threeCamera = this._createCamera();
      this._threeCamera.rotation.order = 'ZYX';
      this._threeScene.add(this._threeCamera);

      const parentRendererObject = asThreeObjectOrNull(
        runtimeInstanceContainerRenderer.get3DRendererObject()
      )
        ? asThreeObjectOrNull(
            runtimeInstanceContainerRenderer.get3DRendererObject()
          )
        : asThreeObjectOrNull(
            runtimeInstanceContainerRenderer.getRendererObject()
          );
      if (parentRendererObject) {
        parentRendererObject.add(this._threeGroup);
      }

      this._setupEffectComposer();
      this.updateVisibility(layer.isVisible());
      this.onCreated();
    }

    private _createCamera():
      | THREE.PerspectiveCamera
      | THREE.OrthographicCamera {
      if (
        this._layer.getCameraType() === gdjs.RuntimeLayerCameraType.ORTHOGRAPHIC
      ) {
        return new THREE.OrthographicCamera(
          -1,
          1,
          1,
          -1,
          this._camera3DNearPlaneDistance,
          this._camera3DFarPlaneDistance
        );
      }

      return new THREE.PerspectiveCamera(
        this._camera3DFieldOfView,
        1,
        this._camera3DNearPlaneDistance,
        this._camera3DFarPlaneDistance
      );
    }

    private _setupEffectComposer() {
      if (!this._threeRenderer) {
        return;
      }

      this._threeEffectComposer = new THREE_ADDONS.EffectComposer(
        this._threeRenderer
      );
      this._threeEffectComposer.addPass(
        new THREE_ADDONS.RenderPass(this._threeScene, this._threeCamera)
      );

      const game = this._layer.getRuntimeScene().getGame();
      if (game.getAntialiasingMode() !== 'none') {
        this._threeEffectComposer.addPass(
          new THREE_ADDONS.SMAAPass(
            game.getGameResolutionWidth(),
            game.getGameResolutionHeight()
          )
        );
      }

      this._threeEffectComposer.addPass(new THREE_ADDONS.OutputPass());
    }

    private _updateCameraProjectionAndPosition() {
      const width = Math.max(this._layer.getWidth(), 1);
      const height = Math.max(this._layer.getHeight(), 1);

      if (this._threeCamera instanceof THREE.OrthographicCamera) {
        this._threeCamera.left = -width / 2;
        this._threeCamera.right = width / 2;
        this._threeCamera.top = height / 2;
        this._threeCamera.bottom = -height / 2;
        this._threeCamera.zoom = this._layer.getCameraZoom();
        this._threeCamera.position.z = this._layer.getCameraZ(null);
      } else {
        this._threeCamera.aspect = width / height;
        this._threeCamera.fov = this._camera3DFieldOfView;
        this._threeCamera.position.z = this._layer.getCameraZ(
          this._camera3DFieldOfView
        );
      }

      this._threeCamera.near = this._camera3DNearPlaneDistance;
      this._threeCamera.far = this._camera3DFarPlaneDistance;
      this._threeCamera.position.x = this._layer.getCameraX();
      this._threeCamera.position.y = this._layer.getCameraY();
      this._threeCamera.rotation.z = gdjs.toRad(
        this._layer.getCameraRotation()
      );
      this._threeCamera.updateProjectionMatrix();
      this._needsCameraUpdate = false;

      if (this._threeEffectComposer) {
        this._threeEffectComposer.setPixelRatio(window.devicePixelRatio || 1);
        this._threeEffectComposer.setSize(width, height);
      }
    }

    onCreated() {
      this._needsCameraUpdate = true;
      this.updatePreRender();
    }

    onGameResolutionResized() {
      this._needsCameraUpdate = true;
      this.updatePreRender();
    }

    updatePosition(): void {
      this._needsCameraUpdate = true;
      this.updatePreRender();
    }

    updateResolution(): void {
      this._needsCameraUpdate = true;
      this.updatePreRender();
    }

    isCameraRotatedIn3D(): boolean {
      return (
        this._threeCamera.rotation.x !== 0 || this._threeCamera.rotation.y !== 0
      );
    }

    transformTo3DWorld(
      screenX: float,
      screenY: float,
      worldZ: float,
      cameraId: integer,
      result: FloatPoint
    ): FloatPoint {
      void cameraId;
      const camera = this._threeCamera;
      const width = Math.max(this._layer.getWidth(), 1);
      const height = Math.max(this._layer.getHeight(), 1);
      const normalizedX = (screenX / width) * 2 - 1;
      const normalizedY = -(screenY / height) * 2 + 1;

      let vector = LayerThreeRenderer.vectorForProjections;
      if (!vector) {
        vector = new THREE.Vector3();
        LayerThreeRenderer.vectorForProjections = vector;
      }

      camera.updateMatrixWorld();

      if (camera instanceof THREE.OrthographicCamera) {
        vector.set(normalizedX, normalizedY, 0);
        vector.unproject(camera);

        const direction = new THREE.Vector3();
        camera.getWorldDirection(direction);
        const distance = (worldZ - vector.z) / direction.z;
        vector.x += distance * direction.x;
        vector.y += distance * direction.y;
      } else {
        vector.set(normalizedX, normalizedY, 0.5);
        vector.unproject(camera);
        vector.sub(camera.position).normalize();
        const distance = (worldZ - camera.position.z) / vector.z;
        vector.x = distance * vector.x + camera.position.x;
        vector.y = distance * vector.y + camera.position.y;
      }

      if (!Number.isFinite(vector.x) || !Number.isFinite(vector.y)) {
        result[0] = 0;
        result[1] = 0;
        return result;
      }

      result[0] = vector.x;
      result[1] = vector.y;
      return result;
    }

    updateVisibility(visible: boolean): void {
      this._threeGroup.visible = !!visible;
    }

    updatePreRender(): void {
      if (this._needsCameraUpdate) {
        this._updateCameraProjectionAndPosition();
      }
    }

    getRendererObject() {
      return this._threeGroup;
    }

    getThreeScene(): THREE.Scene | null {
      return this._threeScene;
    }

    getThreeGroup(): THREE.Group | null {
      return this._threeGroup;
    }

    getThreeCamera():
      | THREE.PerspectiveCamera
      | THREE.OrthographicCamera
      | null {
      return this._threeCamera;
    }

    getCamera(): THREE.PerspectiveCamera | THREE.OrthographicCamera | null {
      return this._threeCamera;
    }

    getThreeEffectComposer(): THREE_ADDONS.EffectComposer | null {
      return this._threeEffectComposer;
    }

    addPostProcessingPass(pass: THREE_ADDONS.Pass, effectName?: string) {
      if (!this._threeEffectComposer) {
        return;
      }

      if (effectName) {
        this._threePostProcessingPassesByEffectName.set(effectName, pass);
        this._reorderPostProcessingPasses();
        return;
      }

      const insertIndex = this._threeEffectComposer.passes.length - 1;
      this._threeEffectComposer.insertPass(pass, Math.max(1, insertIndex));
    }

    removePostProcessingPass(pass: THREE_ADDONS.Pass, effectName?: string) {
      if (!this._threeEffectComposer) {
        return;
      }

      this._threeEffectComposer.removePass(pass);
      if (effectName) {
        this._threePostProcessingPassesByEffectName.delete(effectName);
      } else {
        for (const [name, existingPass] of this
          ._threePostProcessingPassesByEffectName) {
          if (existingPass === pass) {
            this._threePostProcessingPassesByEffectName.delete(name);
            break;
          }
        }
      }
      this._reorderPostProcessingPasses();
    }

    reorderPostProcessingPasses(effectsData?: EffectData[]) {
      this._reorderPostProcessingPasses(effectsData);
    }

    private _reorderPostProcessingPasses(effectsData?: EffectData[]) {
      const composer = this._threeEffectComposer;
      if (!composer || composer.passes.length === 0) {
        return;
      }

      const renderPass = composer.passes[0];
      const outputPass = composer.passes[composer.passes.length - 1];
      const middlePasses = new Set<THREE_ADDONS.Pass>();
      const orderedPasses: THREE_ADDONS.Pass[] = [];

      const effects = effectsData || this._layer.getInitialEffectsData() || [];
      for (const effectData of effects) {
        const pass = this._threePostProcessingPassesByEffectName.get(
          effectData.name
        );
        if (pass && !middlePasses.has(pass)) {
          middlePasses.add(pass);
          orderedPasses.push(pass);
        }
      }

      for (const pass of composer.passes) {
        if (pass === renderPass || pass === outputPass) {
          continue;
        }
        if (middlePasses.has(pass)) {
          continue;
        }
        orderedPasses.push(pass);
      }

      composer.passes.length = 0;
      composer.passes.push(renderPass, ...orderedPasses, outputPass);
    }

    hasPostProcessingPass() {
      if (!this._threeEffectComposer) {
        return false;
      }

      const basePassesCount =
        this._layer.getRuntimeScene().getGame().getAntialiasingMode() !== 'none'
          ? 3
          : 2;
      return (
        this._threePostProcessingPassesByEffectName.size > 0 ||
        this._threeEffectComposer.passes.length > basePassesCount
      );
    }

    hasPostProcessingEffects() {
      return this.hasPostProcessingPass();
    }

    setLayerIndex(index: number) {
      this._threeGroup.renderOrder = index;
    }

    addRendererObject(rendererObject: unknown, zOrder: float): void {
      const object = throwIfNotThreeObject(
        rendererObject,
        'LayerThreeRenderer.addRendererObject'
      );
      object.renderOrder = renderOrderFor2DObject(zOrder || 0);
      object.userData.gdjsIs2DRendererObject = true;
      this._threeGroup.add(object);
    }

    changeRendererObjectZOrder(
      rendererObject: unknown,
      newZOrder: float
    ): void {
      const object = throwIfNotThreeObject(
        rendererObject,
        'LayerThreeRenderer.changeRendererObjectZOrder'
      );
      object.renderOrder = renderOrderFor2DObject(newZOrder || 0);
    }

    removeRendererObject(rendererObject: unknown): void {
      const object = throwIfNotThreeObject(
        rendererObject,
        'LayerThreeRenderer.removeRendererObject'
      );
      this._threeGroup.remove(object);
    }

    has3DObjects(): boolean {
      return this._threeGroup.children.some(
        (child) => !child.userData.gdjsIs2DRendererObject
      );
    }

    has2DObjects(): boolean {
      return this._threeGroup.children.some(
        (child) => !!child.userData.gdjsIs2DRendererObject
      );
    }

    add3DRendererObject(object: THREE.Object3D): void {
      object.userData.gdjsIs2DRendererObject = false;
      this._threeGroup.add(object);
    }

    remove3DRendererObject(object: THREE.Object3D): void {
      this._threeGroup.remove(object);
    }

    updateClearColor(): void {
      void this._layer;
    }

    setCamera3DFieldOfView(fieldOfView: float): void {
      this._camera3DFieldOfView = fieldOfView;
      this._needsCameraUpdate = true;
    }

    setCamera3DNearPlaneDistance(nearPlaneDistance: float): void {
      this._camera3DNearPlaneDistance = Math.max(0.0001, nearPlaneDistance);
      this._needsCameraUpdate = true;
    }

    setCamera3DFarPlaneDistance(farPlaneDistance: float): void {
      this._camera3DFarPlaneDistance = Math.max(
        this._camera3DNearPlaneDistance,
        farPlaneDistance
      );
      this._needsCameraUpdate = true;
    }

    set2DPlaneMaxDrawingDistance(maxDrawingDistance: float): void {
      this._camera2DPlaneMaxDrawingDistance = maxDrawingDistance;
    }

    getCamera3DNearPlaneDistance(): float {
      return this._camera3DNearPlaneDistance;
    }

    getCamera3DFarPlaneDistance(): float {
      return this._camera3DFarPlaneDistance;
    }

    getCamera3DFieldOfView(): float {
      return this._camera3DFieldOfView;
    }

    get2DPlaneMaxDrawingDistance(): float {
      return this._camera2DPlaneMaxDrawingDistance;
    }

    dispose(): void {
      this._threePostProcessingPassesByEffectName.clear();
      if (this._threeEffectComposer) {
        this._threeEffectComposer.passes.length = 0;
      }
      this._threeScene.remove(this._threeGroup);
      this._threeGroup.clear();
      this._threeScene.clear();
    }
  }
}
