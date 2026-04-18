namespace gdjs {
  const createPixiPanelRegionTexture = (
    baseTexture: PIXI.Texture,
    x: number,
    y: number,
    width: number,
    height: number
  ): PIXI.Texture =>
    new PIXI.Texture({
      source: baseTexture.source,
      frame: new PIXI.Rectangle(
        x,
        y,
        Math.max(width, 1),
        Math.max(height, 1)
      ),
    });

  export class PanelSpriteRuntimeObjectPixiRenderer {
    _object: gdjs.PanelSpriteRuntimeObject;
    _container: PIXI.Container;
    _nodes: Array<PIXI.Sprite | PIXI.TilingSprite> = [];
    _textures: PIXI.Texture[] = [];
    _baseTexture: PIXI.Texture | null = null;
    _textureWidth = 0;
    _textureHeight = 0;

    constructor(
      runtimeObject: gdjs.PanelSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string,
      tiled: boolean
    ) {
      void tiled;
      this._object = runtimeObject;
      this._container = new PIXI.Container({ sortableChildren: true });
      this._container.eventMode = 'none';

      for (let i = 0; i < 9; ++i) {
        const node =
          runtimeObject._tiled && i !== 2 && i !== 4 && i !== 6 && i !== 8
            ? new PIXI.TilingSprite({
                texture: PIXI.Texture.EMPTY,
                width: 1,
                height: 1,
              })
            : new PIXI.Sprite(PIXI.Texture.EMPTY);
        node.eventMode = 'none';
        this._nodes.push(node);
        this._container.addChild(node);
      }

      instanceContainer
        .getLayer(runtimeObject.getLayer())
        .getRenderer()
        .addRendererObject(this._container, runtimeObject.getZOrder());

      this.setTexture(textureName, instanceContainer);
      this.updatePosition();
      this.updateAngle();
      this.updateOpacity();
    }

    getRendererObject() {
      return this._container;
    }

    ensureUpToDate() {}

    private _setRegionTexture(
      index: number,
      x: number,
      y: number,
      width: number,
      height: number
    ) {
      if (!this._baseTexture) {
        return;
      }

      const previous = this._textures[index];
      if (previous) previous.destroy(false);

      const texture = createPixiPanelRegionTexture(
        this._baseTexture,
        x,
        y,
        width,
        height
      );
      this._textures[index] = texture;
      this._nodes[index].texture = texture;
    }

    private _setNodeRect(
      index: number,
      x: number,
      y: number,
      width: number,
      height: number
    ) {
      const node = this._nodes[index];
      node.visible = width > 0 && height > 0;
      if (!node.visible) {
        return;
      }

      node.position.set(x, y);
      node.width = width;
      node.height = height;
    }

    private _updateNodes() {
      const obj = this._object;
      const centerWidth = Math.max(obj._width - obj._lBorder - obj._rBorder, 0);
      const centerHeight = Math.max(
        obj._height - obj._tBorder - obj._bBorder,
        0
      );
      const left = 0;
      const top = 0;
      const centerX = obj._lBorder;
      const centerY = obj._tBorder;
      const rightX = obj._width - obj._rBorder;
      const bottomY = obj._height - obj._bBorder;

      this._setNodeRect(0, centerX, centerY, centerWidth, centerHeight);
      this._setNodeRect(1, rightX, centerY, obj._rBorder, centerHeight);
      this._setNodeRect(2, rightX, top, obj._rBorder, obj._tBorder);
      this._setNodeRect(3, centerX, top, centerWidth, obj._tBorder);
      this._setNodeRect(4, left, top, obj._lBorder, obj._tBorder);
      this._setNodeRect(5, left, centerY, obj._lBorder, centerHeight);
      this._setNodeRect(6, left, bottomY, obj._lBorder, obj._bBorder);
      this._setNodeRect(7, centerX, bottomY, centerWidth, obj._bBorder);
      this._setNodeRect(8, rightX, bottomY, obj._rBorder, obj._bBorder);
    }

    setTexture(
      textureName: string,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): void {
      this._baseTexture = instanceContainer
        .getGame()
        .getImageManager()
        .getPixiTexture(textureName);
      this._textureWidth = this._baseTexture.width;
      this._textureHeight = this._baseTexture.height;

      const obj = this._object;
      this._setRegionTexture(
        0,
        obj._lBorder,
        obj._tBorder,
        Math.max(this._textureWidth - obj._lBorder - obj._rBorder, 0),
        Math.max(this._textureHeight - obj._tBorder - obj._bBorder, 0)
      );
      this._setRegionTexture(
        1,
        this._textureWidth - obj._rBorder,
        obj._tBorder,
        obj._rBorder,
        Math.max(this._textureHeight - obj._tBorder - obj._bBorder, 0)
      );
      this._setRegionTexture(2, this._textureWidth - obj._rBorder, 0, obj._rBorder, obj._tBorder);
      this._setRegionTexture(
        3,
        obj._lBorder,
        0,
        Math.max(this._textureWidth - obj._lBorder - obj._rBorder, 0),
        obj._tBorder
      );
      this._setRegionTexture(4, 0, 0, obj._lBorder, obj._tBorder);
      this._setRegionTexture(
        5,
        0,
        obj._tBorder,
        obj._lBorder,
        Math.max(this._textureHeight - obj._tBorder - obj._bBorder, 0)
      );
      this._setRegionTexture(
        6,
        0,
        this._textureHeight - obj._bBorder,
        obj._lBorder,
        obj._bBorder
      );
      this._setRegionTexture(
        7,
        obj._lBorder,
        this._textureHeight - obj._bBorder,
        Math.max(this._textureWidth - obj._lBorder - obj._rBorder, 0),
        obj._bBorder
      );
      this._setRegionTexture(
        8,
        this._textureWidth - obj._rBorder,
        this._textureHeight - obj._bBorder,
        obj._rBorder,
        obj._bBorder
      );
      this._updateNodes();
    }

    updateOpacity(): void {
      this._container.alpha = this._object.opacity / 255;
    }

    updateAngle(): void {
      this._container.angle = this._object.angle;
    }

    updatePosition(): void {
      this._container.position.set(this._object.x, this._object.y);
      this._container.zIndex = this._object.getZOrder();
    }

    updateWidth(): void {
      this._updateNodes();
      this.updatePosition();
    }

    updateHeight(): void {
      this._updateNodes();
      this.updatePosition();
    }

    setColor(rgbOrHexColor: string): void {
      const tint = gdjs.rgbOrHexStringToNumber(rgbOrHexColor);
      for (const node of this._nodes) {
        node.tint = tint;
      }
    }

    getColor() {
      const color = this._nodes[0].tint;
      return (
        (color >> 16) +
        ';' +
        ((color >> 8) & 255) +
        ';' +
        (color & 255)
      );
    }

    getTextureWidth() {
      return this._textureWidth;
    }

    getTextureHeight() {
      return this._textureHeight;
    }

    destroy() {
      for (const texture of this._textures) {
        if (texture) texture.destroy(false);
      }
      this._container.destroy({ children: true });
    }
  }
}
