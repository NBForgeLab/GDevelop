namespace gdjs {
  export type ThreeTextureImageManager = {
    getThreeTexture(resourceName: string): THREE.Texture;
    _threeAnimationFrameTextureManager?: any;
  };

  const getThreeTextureSize = (
    texture: THREE.Texture | null
  ): { width: number; height: number } => {
    if (!texture) {
      return { width: 0, height: 0 };
    }

    const image = texture.image as
      | HTMLImageElement
      | HTMLCanvasElement
      | ImageBitmap
      | undefined;
    if (!image) {
      return { width: 0, height: 0 };
    }

    return {
      width: (image as any).width || 0,
      height: (image as any).height || 0,
    };
  };

  const applyThreeBlendMode = (
    material: THREE.SpriteMaterial,
    blendMode: number
  ) => {
    material.blending = THREE.NormalBlending;
    material.blendEquation = THREE.AddEquation;
    material.blendSrc = THREE.SrcAlphaFactor;
    material.blendDst = THREE.OneMinusSrcAlphaFactor;

    if (blendMode === 1) {
      material.blending = THREE.AdditiveBlending;
    } else if (blendMode === 2) {
      material.blending = THREE.MultiplyBlending;
    } else if (blendMode === 3) {
      material.blending = THREE.CustomBlending;
      material.blendSrc = THREE.OneFactor;
      material.blendDst = THREE.OneMinusSrcColorFactor;
    }

    material.needsUpdate = true;
  };

  /**
   * The renderer for a gdjs.SpriteRuntimeObject using Three.js only.
   * @category Renderers > Sprite
   */
  export class SpriteRuntimeObjectThreeRenderer {
    _object: gdjs.SpriteRuntimeObject;
    _spriteDirty: boolean = true;
    _sprite: THREE.Sprite;
    _material: THREE.SpriteMaterial;
    _cachedWidth: float = 0;
    _cachedHeight: float = 0;

    constructor(
      runtimeObject: gdjs.SpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._material = new THREE.SpriteMaterial({
        transparent: true,
        alphaTest: 0.01,
        depthTest: false,
        depthWrite: false,
        color: 0xffffff,
      });
      this._sprite = new THREE.Sprite(this._material);
      this._sprite.rotation.order = 'ZYX';

      const layer = instanceContainer.getLayer('');
      if (layer) {
        layer
          .getRenderer()
          .addRendererObject(this._sprite, runtimeObject.getZOrder());
      }
    }

    reinitialize(
      runtimeObject: gdjs.SpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._spriteDirty = true;
      this._material.color.setHex(0xffffff);
      this._material.opacity = 1;
      this._material.map = null;
      this._material.needsUpdate = true;

      const layer = instanceContainer.getLayer('');
      if (layer) {
        layer
          .getRenderer()
          .addRendererObject(this._sprite, runtimeObject.getZOrder());
      }
    }

    getRendererObject() {
      return this._sprite;
    }

    private _updateThreeSprite() {
      const animationFrame =
        this._object._animator.getCurrentFrame() as gdjs.SpriteAnimationFrame<THREE.Texture> | null;
      if (
        animationFrame === null &&
        !this._object.getInstanceContainer().getGame().isInGameEdition()
      ) {
        this._sprite.visible = false;
        this._material.opacity = 0;
        this._cachedWidth = 0;
        this._cachedHeight = 0;
        this._spriteDirty = false;
        return;
      }

      const texture =
        this._material.map || (animationFrame ? animationFrame.texture : null);
      if (texture !== this._material.map) {
        this._material.map = texture;
        this._material.needsUpdate = true;
      }

      const textureSize = getThreeTextureSize(texture);
      let centerX = textureSize.width / 2;
      let centerY = textureSize.height / 2;
      let originX = 0;
      let originY = 0;

      if (animationFrame) {
        centerX = animationFrame.center.x;
        centerY = animationFrame.center.y;
        originX = animationFrame.origin.x;
        originY = animationFrame.origin.y;
      }

      const safeWidth = Math.max(textureSize.width, 1);
      const safeHeight = Math.max(textureSize.height, 1);
      const scaleX = this._object._scaleX * this._object._preScale;
      const scaleY = this._object._scaleY * this._object._preScale;

      this._sprite.center.set(centerX / safeWidth, 1 - centerY / safeHeight);
      this._sprite.position.x =
        this._object.x + (centerX - originX) * Math.abs(scaleX);
      this._sprite.position.y =
        this._object.y + (centerY - originY) * Math.abs(scaleY);
      this._sprite.position.z = this._object.getZOrder();
      this._material.rotation = gdjs.toRad(this._object.angle);
      this._sprite.visible = !this._object.hidden;
      this._sprite.scale.set(safeWidth * scaleX, safeHeight * scaleY, 1);
      this._sprite.renderOrder = 100000 + this._object.getZOrder();

      this._material.opacity = this._object.opacity / 255;
      applyThreeBlendMode(this._material, this._object._blendMode);

      this._cachedWidth = Math.abs(safeWidth * scaleX);
      this._cachedHeight = Math.abs(safeHeight * scaleY);
      this._spriteDirty = false;
    }

    ensureUpToDate() {
      if (this._spriteDirty) {
        this._updateThreeSprite();
      }
    }

    updateFrame(
      animationFrame: gdjs.SpriteAnimationFrame<THREE.Texture>
    ): void {
      this._material.map = animationFrame.texture;
      this._material.needsUpdate = true;
      this._spriteDirty = true;
    }

    update(): void {
      this._spriteDirty = true;
    }

    updateX(): void {
      this._spriteDirty = true;
      this.ensureUpToDate();
    }

    updateY(): void {
      this._spriteDirty = true;
      this.ensureUpToDate();
    }

    updateAngle(): void {
      this._material.rotation = gdjs.toRad(this._object.angle);
    }

    updateOpacity(): void {
      this._material.opacity = this._object.opacity / 255;
    }

    updateVisibility(): void {
      this._sprite.visible = !this._object.hidden;
    }

    setColor(rgbOrHexColor: string): void {
      this._material.color.set(gdjs.rgbOrHexStringToNumber(rgbOrHexColor));
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

    getWidth(): float {
      if (this._spriteDirty) {
        this._updateThreeSprite();
      }
      return this._cachedWidth;
    }

    getHeight(): float {
      if (this._spriteDirty) {
        this._updateThreeSprite();
      }
      return this._cachedHeight;
    }

    getUnscaledWidth(): float {
      return getThreeTextureSize(this._material.map).width;
    }

    getUnscaledHeight(): float {
      return getThreeTextureSize(this._material.map).height;
    }

    static getAnimationFrameTextureManager(
      imageManager: gdjs.ThreeTextureImageManager
    ): ThreeAnimationFrameTextureManager {
      if (!imageManager._threeAnimationFrameTextureManager) {
        imageManager._threeAnimationFrameTextureManager =
          new ThreeAnimationFrameTextureManager(imageManager);
      }
      return imageManager._threeAnimationFrameTextureManager;
    }
  }

  class ThreeAnimationFrameTextureManager
    implements gdjs.AnimationFrameTextureManager<THREE.Texture>
  {
    private _imageManager: gdjs.ThreeTextureImageManager;

    constructor(imageManager: gdjs.ThreeTextureImageManager) {
      this._imageManager = imageManager;
    }

    getAnimationFrameTexture(imageName: string) {
      return this._imageManager.getThreeTexture(imageName);
    }

    getAnimationFrameWidth(texture: THREE.Texture) {
      return getThreeTextureSize(texture).width;
    }

    getAnimationFrameHeight(texture: THREE.Texture) {
      return getThreeTextureSize(texture).height;
    }
  }
}
