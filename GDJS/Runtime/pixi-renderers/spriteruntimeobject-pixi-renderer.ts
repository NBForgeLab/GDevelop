namespace gdjs {
  const getPixiTextureSize = (
    texture: PIXI.Texture | null
  ): { width: number; height: number } => {
    if (!texture) {
      return { width: 0, height: 0 };
    }

    return {
      width: texture.width || 0,
      height: texture.height || 0,
    };
  };

  export class SpriteRuntimeObjectPixiRenderer {
    private _object: gdjs.SpriteRuntimeObject;
    private _sprite: PIXI.Sprite;
    private _cachedWidth: float = 0;
    private _cachedHeight: float = 0;
    private _dirty = true;

    constructor(
      runtimeObject: gdjs.SpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._sprite = new PIXI.Sprite();
      this._sprite.anchor.set(0, 0);
      this._sprite.eventMode = 'none';

      const layer = instanceContainer.getLayer(runtimeObject.getLayer());
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
      this._sprite.tint = 0xffffff;
      this._sprite.alpha = 1;
      this._sprite.texture = PIXI.Texture.EMPTY;
      this._dirty = true;

      const layer = instanceContainer.getLayer(runtimeObject.getLayer());
      if (layer) {
        layer
          .getRenderer()
          .addRendererObject(this._sprite, runtimeObject.getZOrder());
      }
    }

    getRendererObject() {
      return this._sprite;
    }

    private _updatePixiSprite() {
      const animationFrame =
        this._object._animator.getCurrentFrame() as gdjs.SpriteAnimationFrame<THREE.Texture> | null;
      if (
        animationFrame === null &&
        !this._object.getInstanceContainer().getGame().isInGameEdition()
      ) {
        this._sprite.visible = false;
        this._sprite.alpha = 0;
        this._cachedWidth = 0;
        this._cachedHeight = 0;
        this._dirty = false;
        return;
      }

      const pixiTexture = animationFrame
        ? this._object
            .getInstanceContainer()
            .getGame()
            .getImageManager()
            .getPixiTexture(animationFrame.image)
        : PIXI.Texture.EMPTY;
      if (this._sprite.texture !== pixiTexture) {
        this._sprite.texture = pixiTexture;
      }

      const textureSize = getPixiTextureSize(pixiTexture);
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

      this._sprite.anchor.set(centerX / safeWidth, centerY / safeHeight);
      this._sprite.position.set(
        this._object.x + (centerX - originX) * Math.abs(scaleX),
        this._object.y + (centerY - originY) * Math.abs(scaleY)
      );
      this._sprite.angle = this._object.angle;
      this._sprite.visible = !this._object.hidden;
      this._sprite.scale.set(scaleX, scaleY);
      this._sprite.zIndex = this._object.getZOrder();
      this._sprite.alpha = this._object.opacity / 255;

      this._cachedWidth = Math.abs(safeWidth * scaleX);
      this._cachedHeight = Math.abs(safeHeight * scaleY);
      this._dirty = false;
    }

    ensureUpToDate() {
      if (this._dirty) {
        this._updatePixiSprite();
      }
    }

    updateFrame(): void {
      this._dirty = true;
      this.ensureUpToDate();
    }

    update(): void {
      this._dirty = true;
    }

    updateX(): void {
      this._dirty = true;
      this.ensureUpToDate();
    }

    updateY(): void {
      this._dirty = true;
      this.ensureUpToDate();
    }

    updateAngle(): void {
      this._sprite.angle = this._object.angle;
    }

    updateOpacity(): void {
      this._sprite.alpha = this._object.opacity / 255;
    }

    updateVisibility(): void {
      this._sprite.visible = !this._object.hidden;
    }

    setColor(rgbOrHexColor: string): void {
      this._sprite.tint = gdjs.rgbOrHexStringToNumber(rgbOrHexColor);
    }

    getColor() {
      const color = this._sprite.tint;
      return (
        (color >> 16) +
        ';' +
        ((color >> 8) & 255) +
        ';' +
        (color & 255)
      );
    }

    getWidth(): float {
      this.ensureUpToDate();
      return this._cachedWidth;
    }

    getHeight(): float {
      this.ensureUpToDate();
      return this._cachedHeight;
    }

    getUnscaledWidth(): float {
      return getPixiTextureSize(this._sprite.texture).width;
    }

    getUnscaledHeight(): float {
      return getPixiTextureSize(this._sprite.texture).height;
    }

    destroy(): void {
      this._sprite.destroy();
    }
  }
}
