namespace gdjs {
  export class TiledSpriteRuntimeObjectPixiRenderer {
    _object: gdjs.TiledSpriteRuntimeObject;
    _sprite: PIXI.TilingSprite;
    _texture: PIXI.Texture | null = null;

    constructor(
      runtimeObject: gdjs.TiledSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string
    ) {
      this._object = runtimeObject;
      this._sprite = new PIXI.TilingSprite({
        texture: PIXI.Texture.EMPTY,
        width: 1,
        height: 1,
      });
      this._sprite.eventMode = 'none';

      instanceContainer
        .getLayer(runtimeObject.getLayer())
        .getRenderer()
        .addRendererObject(this._sprite, runtimeObject.getZOrder());

      this.setTexture(textureName, instanceContainer);
      this.updateOpacity();
      this.updatePosition();
      this.updateAngle();
      this.updateXOffset();
      this.updateYOffset();
    }

    getRendererObject() {
      return this._sprite;
    }

    updateOpacity(): void {
      this._sprite.alpha = this._object.opacity / 255;
    }

    updatePosition(): void {
      this._sprite.position.set(this._object.x, this._object.y);
      this._sprite.zIndex = this._object.getZOrder();
      this._sprite.width = Math.max(this._object.getWidth(), 0);
      this._sprite.height = Math.max(this._object.getHeight(), 0);
    }

    setTexture(
      textureName: string,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): void {
      this._texture = instanceContainer
        .getGame()
        .getImageManager()
        .getPixiTexture(textureName);
      this._sprite.texture = this._texture;
      this._updateTextureRepeat();
    }

    updateAngle(): void {
      this._sprite.angle = this._object.angle;
    }

    getWidth(): float {
      return this._object.getWidth();
    }

    getHeight(): float {
      return this._object.getHeight();
    }

    setWidth(width: float): void {
      this._sprite.width = Math.max(width, 0);
      this.updatePosition();
      this._updateTextureRepeat();
    }

    setHeight(height: float): void {
      this._sprite.height = Math.max(height, 0);
      this.updatePosition();
      this._updateTextureRepeat();
    }

    private _updateTextureRepeat(): void {
      if (!this._texture) {
        return;
      }

      this._sprite.tileScale.set(1, 1);
      this._sprite.width = Math.max(this._object.getWidth(), 0);
      this._sprite.height = Math.max(this._object.getHeight(), 0);
    }

    updateXOffset(): void {
      this._sprite.tilePosition.x = -this._object._xOffset;
    }

    updateYOffset(): void {
      this._sprite.tilePosition.y = -this._object._yOffset;
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

    getTextureWidth() {
      return this._texture ? this._texture.width : 0;
    }

    getTextureHeight() {
      return this._texture ? this._texture.height : 0;
    }

    destroy(): void {
      this._sprite.destroy();
    }
  }
}
