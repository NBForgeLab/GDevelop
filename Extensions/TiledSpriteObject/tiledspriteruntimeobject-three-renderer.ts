namespace gdjs {
  const getTextureImageSize = (
    texture: THREE.Texture | null
  ): { width: number; height: number } => {
    if (!texture || !texture.image) {
      return { width: 1, height: 1 };
    }

    return {
      width: (texture.image as any).width || 1,
      height: (texture.image as any).height || 1,
    };
  };

  /**
   * The renderer for a gdjs.TiledSpriteRuntimeObject using Three.js only.
   * @category Renderers > Tiled Sprite
   */
  export class TiledSpriteRuntimeObjectThreeRenderer {
    _object: gdjs.TiledSpriteRuntimeObject;
    _mesh: THREE.Mesh;
    _geometry: THREE.PlaneGeometry;
    _material: THREE.MeshBasicMaterial;
    _texture: THREE.Texture | null = null;
    _tintColor: THREE.Color;

    constructor(
      runtimeObject: gdjs.TiledSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string
    ) {
      this._object = runtimeObject;
      this._geometry = new THREE.PlaneGeometry(1, 1);
      this._material = new THREE.MeshBasicMaterial({
        transparent: true,
        side: THREE.DoubleSide,
        depthTest: false,
        depthWrite: false,
        color: 0xffffff,
      });
      this._tintColor = this._material.color.clone();
      this._mesh = new THREE.Mesh(this._geometry, this._material);
      this._mesh.rotation.order = 'ZYX';

      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._mesh, runtimeObject.getZOrder());

      this.setTexture(textureName, instanceContainer);
      this.updateOpacity();
      this.updatePosition();
      this.updateAngle();
      this.updateXOffset();
      this.updateYOffset();
    }

    getRendererObject() {
      return this._mesh;
    }

    updateOpacity(): void {
      this._material.opacity = this._object.opacity / 255;
      this._material.needsUpdate = true;
    }

    updatePosition(): void {
      this._mesh.position.x = this._object.x + this._object.getWidth() / 2;
      this._mesh.position.y = this._object.y + this._object.getHeight() / 2;
      this._mesh.position.z = this._object.getZOrder();
      this._mesh.renderOrder = 100000 + this._object.getZOrder();
    }

    setTexture(
      textureName: string,
      instanceContainer: RuntimeInstanceContainer
    ): void {
      this._texture = instanceContainer
        .getGame()
        .getImageManager()
        .getThreeTexture(textureName);
      this._texture.wrapS = THREE.RepeatWrapping;
      this._texture.wrapT = THREE.RepeatWrapping;
      this._texture.needsUpdate = true;
      this._material.map = this._texture;
      this._material.needsUpdate = true;
      this._updateTextureRepeat();
    }

    updateAngle(): void {
      this._mesh.rotation.z = gdjs.toRad(this._object.angle);
    }

    getWidth(): float {
      return this._object.getWidth();
    }

    getHeight(): float {
      return this._object.getHeight();
    }

    setWidth(width: float): void {
      this._mesh.scale.x = Math.max(width, 0);
      this.updatePosition();
      this._updateTextureRepeat();
    }

    setHeight(height: float): void {
      this._mesh.scale.y = Math.max(height, 0);
      this.updatePosition();
      this._updateTextureRepeat();
    }

    private _updateTextureRepeat(): void {
      if (!this._texture) {
        return;
      }

      const textureSize = getTextureImageSize(this._texture);
      this._texture.repeat.set(
        this._object.getWidth() / Math.max(textureSize.width, 1),
        this._object.getHeight() / Math.max(textureSize.height, 1)
      );
      this._texture.needsUpdate = true;
    }

    updateXOffset(): void {
      if (!this._texture) {
        return;
      }
      const textureWidth = Math.max(
        getTextureImageSize(this._texture).width,
        1
      );
      this._texture.offset.x = -this._object._xOffset / textureWidth;
      this._texture.needsUpdate = true;
    }

    updateYOffset(): void {
      if (!this._texture) {
        return;
      }
      const textureHeight = Math.max(
        getTextureImageSize(this._texture).height,
        1
      );
      this._texture.offset.y = -this._object._yOffset / textureHeight;
      this._texture.needsUpdate = true;
    }

    setColor(rgbOrHexColor: string): void {
      this._tintColor.set(gdjs.rgbOrHexStringToNumber(rgbOrHexColor));
      this._material.color.copy(this._tintColor);
      this._material.needsUpdate = true;
    }

    getColor() {
      return (
        Math.round(this._material.color.r * 255) +
        ';' +
        Math.round(this._material.color.g * 255) +
        ';' +
        Math.round(this._material.color.b * 255)
      );
    }

    getTextureWidth() {
      return getTextureImageSize(this._texture).width;
    }

    getTextureHeight() {
      return getTextureImageSize(this._texture).height;
    }

    destroy(): void {
      this._geometry.dispose();
      this._material.dispose();
    }
  }
}
