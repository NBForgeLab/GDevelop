namespace gdjs {
  const applyOpacityFactorToCustomMaterial = (
    material: any,
    parentOpacityFactor: number
  ) => {
    if (!material || typeof material.opacity !== 'number') {
      return;
    }

    const previousParentOpacity =
      material.userData &&
      typeof material.userData.gdjsParentOpacity === 'number'
        ? material.userData.gdjsParentOpacity
        : 1;
    const baseOpacity =
      previousParentOpacity === 0
        ? material.opacity
        : material.opacity / previousParentOpacity;

    if (!material.userData) {
      material.userData = {};
    }
    material.userData.gdjsParentOpacity = parentOpacityFactor;
    material.opacity = baseOpacity * parentOpacityFactor;
    material.transparent = material.opacity < 1 || material.transparent;
    material.needsUpdate = true;
  };

  const applyOpacityFactorToCustomObject = (
    object: THREE.Object3D,
    parentOpacityFactor: number
  ) => {
    object.traverse((child) => {
      const material = (child as any).material;
      if (!material) {
        return;
      }

      if (Array.isArray(material)) {
        for (const item of material) {
          applyOpacityFactorToCustomMaterial(item, parentOpacityFactor);
        }
      } else {
        applyOpacityFactorToCustomMaterial(material, parentOpacityFactor);
      }
    });
  };

  /**
   * The renderer for a {@link gdjs.CustomRuntimeObject2D} using Three.js only.
   * @category Renderers > Custom Object
   */
  export class CustomRuntimeObject2DThreeRenderer {
    _object: gdjs.CustomRuntimeObject;
    _instanceContainer: gdjs.CustomRuntimeObjectInstanceContainer;
    _threeGroup: THREE.Group;
    _isContainerDirty: boolean = true;

    constructor(
      object: gdjs.CustomRuntimeObject,
      instanceContainer: gdjs.CustomRuntimeObjectInstanceContainer,
      parent: gdjs.RuntimeInstanceContainer
    ) {
      this._object = object;
      this._instanceContainer = instanceContainer;
      this._threeGroup = new THREE.Group();
      this._threeGroup.rotation.order = 'ZYX';
      this._threeGroup.renderOrder = 100000 + object.getZOrder();

      const layer = parent.getLayer(object.getLayer());
      if (layer) {
        layer
          .getRenderer()
          .addRendererObject(this._threeGroup, object.getZOrder());
      }
    }

    reinitialize(
      object: gdjs.CustomRuntimeObject,
      parent: gdjs.RuntimeInstanceContainer
    ) {
      void parent;
      this._object = object;
      this._isContainerDirty = true;
      this._threeGroup.clear();
    }

    getRendererObject() {
      return this._threeGroup;
    }

    get3DRendererObject(): THREE.Object3D | null {
      return null;
    }

    private _updateOpacityOnChildren() {
      applyOpacityFactorToCustomObject(
        this._threeGroup,
        this._object.getOpacity() / 255
      );
    }

    private _updateThreeGroup() {
      const scaleX = this._object.getScaleX();
      const scaleY = this._object.getScaleY();
      this._threeGroup.position.x =
        this._object.getX() +
        this._object.getUnscaledCenterX() * Math.abs(scaleX);
      this._threeGroup.position.y =
        this._object.getY() +
        this._object.getUnscaledCenterY() * Math.abs(scaleY);
      this._threeGroup.position.z = this._object.getZOrder();
      this._threeGroup.rotation.z = gdjs.toRad(this._object.angle);
      this._threeGroup.scale.x = scaleX * (this._object.isFlippedX() ? -1 : 1);
      this._threeGroup.scale.y = scaleY * (this._object.isFlippedY() ? -1 : 1);
      this._threeGroup.visible = !this._object.hidden;
      this._threeGroup.renderOrder = 100000 + this._object.getZOrder();
      this._updateOpacityOnChildren();
      this._isContainerDirty = false;
    }

    ensureUpToDate() {
      if (this._isContainerDirty) {
        this._updateThreeGroup();
      } else {
        this._updateOpacityOnChildren();
      }
    }

    update(): void {
      this._isContainerDirty = true;
    }

    updateX(): void {
      const scaleX = this._object.getScaleX();
      this._threeGroup.position.x =
        this._object.x + this._object.getUnscaledCenterX() * Math.abs(scaleX);
    }

    updateY(): void {
      const scaleY = this._object.getScaleY();
      this._threeGroup.position.y =
        this._object.y + this._object.getUnscaledCenterY() * Math.abs(scaleY);
    }

    updateAngle(): void {
      this._threeGroup.rotation.z = gdjs.toRad(this._object.angle);
    }

    updateOpacity(): void {
      this._updateOpacityOnChildren();
    }

    updateVisibility(): void {
      this._threeGroup.visible = !this._object.hidden;
    }

    setLayerIndex(layer: gdjs.RuntimeLayer, index: float): void {
      const layerRendererObject = layer.getRenderer().getRendererObject();
      if (layerRendererObject instanceof THREE.Object3D) {
        layerRendererObject.renderOrder = index;
      }
    }

    static getAnimationFrameTextureManager(
      imageManager: gdjs.ThreeTextureImageManager
    ) {
      return gdjs.SpriteRuntimeObjectRenderer.getAnimationFrameTextureManager(
        imageManager
      );
    }
  }
}
