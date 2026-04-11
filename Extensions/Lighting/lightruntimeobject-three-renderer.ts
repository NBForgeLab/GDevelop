namespace gdjs {
  const getTextureSize = (texture: THREE.Texture | null) => {
    if (!texture || !texture.image) {
      return { width: 32, height: 32 };
    }

    return {
      width: (texture.image as any).width || 32,
      height: (texture.image as any).height || 32,
    };
  };

  export class LightRuntimeObjectThreeRenderer {
    _object: gdjs.LightRuntimeObject;
    _instanceContainer: gdjs.RuntimeInstanceContainer;
    _radius: number;
    _color: THREE.Color;
    _root: THREE.Group;
    _pointLight: THREE.PointLight;
    _debugMode: boolean = false;
    _debugHelper: THREE.PointLightHelper | null = null;
    _editorRangeCircle: THREE.LineLoop | null = null;
    _lightIconSprite: THREE.Sprite | null = null;

    constructor(
      runtimeObject: gdjs.LightRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._instanceContainer = instanceContainer;
      this._radius = runtimeObject.getRadius();
      const objectColor = runtimeObject._color;
      this._color = new THREE.Color(
        objectColor[0] / 255,
        objectColor[1] / 255,
        objectColor[2] / 255
      );
      this._root = new THREE.Group();
      this._pointLight = new THREE.PointLight(
        this._color,
        runtimeObject.getIntensity(),
        this._radius
      );
      this._root.add(this._pointLight);

      instanceContainer
        .getLayer(runtimeObject.getLayer())
        .getRenderer()
        .add3DRendererObject(this._root);

      if (instanceContainer.getGame().isInGameEdition()) {
        this._ensureEditorPreview();
      }

      this.updateDebugMode();
      this.ensureUpToDate();
    }

    get3DRendererObject(): THREE.Group {
      return this._root;
    }

    destroy(): void {
      this._instanceContainer
        .getLayer(this._object.getLayer())
        .getRenderer()
        .remove3DRendererObject(this._root);

      if (this._debugHelper) {
        this._debugHelper.dispose();
        this._root.remove(this._debugHelper);
        this._debugHelper = null;
      }

      if (this._editorRangeCircle) {
        this._editorRangeCircle.geometry.dispose();
        (this._editorRangeCircle.material as THREE.Material).dispose();
        this._root.remove(this._editorRangeCircle);
        this._editorRangeCircle = null;
      }

      if (this._lightIconSprite) {
        (this._lightIconSprite.material as THREE.Material).dispose();
        this._root.remove(this._lightIconSprite);
        this._lightIconSprite = null;
      }
    }

    ensureUpToDate() {
      this._root.visible = !this._object.isHidden();
      if (!this._root.visible) {
        return;
      }

      this.updatePosition();
      this.updateRadius();
      this.updateColor();
      this.updateIntensity();

      if (this._debugHelper) {
        this._debugHelper.update();
      }

      if (this._instanceContainer.getGame().isInGameEdition()) {
        this._updateEditorPreview();
      }
    }

    updatePosition(): void {
      this._root.position.set(
        this._object.getX(),
        this._object.getY(),
        this._object.getZ()
      );
    }

    updateRadius(): void {
      this._radius = this._object.getRadius();
      this._pointLight.distance = this._radius;
      if (this._debugHelper) {
        this._debugHelper.update();
      }
      if (this._editorRangeCircle) {
        this._updateEditorCircleGeometry();
      }
    }

    updateColor(): void {
      const objectColor = this._object._color;
      this._color.setRGB(
        objectColor[0] / 255,
        objectColor[1] / 255,
        objectColor[2] / 255
      );
      this._pointLight.color.copy(this._color);
      if (this._debugHelper) {
        this._debugHelper.color = this._color;
      }
      if (this._editorRangeCircle) {
        (
          this._editorRangeCircle.material as THREE.LineBasicMaterial
        ).color.copy(this._color);
      }
    }

    updateIntensity(): void {
      this._pointLight.intensity = this._object.getIntensity();
    }

    updateDebugMode(): void {
      this._debugMode = this._object.getDebugMode();

      if (!this._debugMode && this._debugHelper) {
        this._debugHelper.dispose();
        this._root.remove(this._debugHelper);
        this._debugHelper = null;
      }

      if (this._debugMode && !this._debugHelper) {
        this._debugHelper = new THREE.PointLightHelper(
          this._pointLight,
          Math.max(1, this._radius * 0.1),
          this._color.getHex()
        );
        this._root.add(this._debugHelper);
      }

      if (this._instanceContainer.getGame().isInGameEdition()) {
        this._ensureEditorPreview();
        this._updateEditorPreview();
      }
    }

    _ensureEditorPreview() {
      if (!this._lightIconSprite) {
        const texture = (
          this._instanceContainer
            .getGame()
            .getImageManager() as gdjs.ThreeTextureImageManager
        ).getThreeTexture('InGameEditor-LightIcon');
        const size = getTextureSize(texture);
        const material = new THREE.SpriteMaterial({
          map: texture,
          transparent: true,
          depthTest: false,
          depthWrite: false,
        });
        this._lightIconSprite = new THREE.Sprite(material);
        this._lightIconSprite.center.set(0.5, 0.5);
        this._lightIconSprite.scale.set(size.width, size.height, 1);
        this._root.add(this._lightIconSprite);
      }

      if (!this._editorRangeCircle) {
        this._editorRangeCircle = new THREE.LineLoop(
          new THREE.BufferGeometry(),
          new THREE.LineBasicMaterial({
            color: this._color,
            transparent: true,
            opacity: 0.8,
          })
        );
        this._root.add(this._editorRangeCircle);
      }
    }

    _updateEditorPreview() {
      this.updatePosition();
      this._updateEditorCircleGeometry();
      if (this._editorRangeCircle) {
        this._editorRangeCircle.visible = this._debugMode;
        (
          this._editorRangeCircle.material as THREE.LineBasicMaterial
        ).color.copy(this._color);
      }
    }

    _updateEditorCircleGeometry() {
      if (!this._editorRangeCircle) {
        return;
      }

      const segments = 48;
      const positions = new Float32Array(segments * 3);
      for (let i = 0; i < segments; i++) {
        const angle = (i / segments) * Math.PI * 2;
        positions[i * 3] = Math.cos(angle) * Math.max(1, this._radius);
        positions[i * 3 + 1] = Math.sin(angle) * Math.max(1, this._radius);
        positions[i * 3 + 2] = 0;
      }

      this._editorRangeCircle.geometry.dispose();
      this._editorRangeCircle.geometry = new THREE.BufferGeometry();
      this._editorRangeCircle.geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      );
    }
  }

  export const LightRuntimeObjectRenderer = LightRuntimeObjectThreeRenderer;
  export type LightRuntimeObjectRenderer = LightRuntimeObjectThreeRenderer;
}
