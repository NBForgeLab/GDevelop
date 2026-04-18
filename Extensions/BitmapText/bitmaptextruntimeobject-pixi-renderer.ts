namespace gdjs {
  export class BitmapTextRuntimeObjectPixiRenderer {
    _object: gdjs.BitmapTextRuntimeObject;
    _bitmapFont: any = null;
    _bitmapFontName = '';
    _fontSize = 20;
    _canvas: HTMLCanvasElement;
    _context: CanvasRenderingContext2D;
    _texture: PIXI.Texture;
    _sprite: PIXI.Sprite;
    _renderedWidth = 1;
    _renderedHeight = 1;

    constructor(
      runtimeObject: gdjs.BitmapTextRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._canvas = document.createElement('canvas');
      this._context = this._canvas.getContext('2d') as CanvasRenderingContext2D;
      this._texture = PIXI.Texture.from(this._canvas);
      this._sprite = new PIXI.Sprite(this._texture);
      this._sprite.anchor.set(0, 0);
      this._sprite.eventMode = 'none';

      instanceContainer
        .getLayer(runtimeObject.getLayer())
        .getRenderer()
        .addRendererObject(this._sprite, runtimeObject.getZOrder());

      this.updateFont();
      this.updateTextContent();
      this.updateAngle();
      this.updateOpacity();
      this.updateScale();
      this.updateWrappingWidth();
      this.updateTint();
    }

    getRendererObject() {
      return this._sprite;
    }

    onDestroy() {
      if (this._bitmapFontName) {
        this._object
          .getInstanceContainer()
          .getGame()
          .getBitmapFontManager()
          .releaseBitmapFont(this._bitmapFontName);
      }
      this._sprite.destroy();
      this._texture.destroy(true);
    }

    getFontSize() {
      return this._fontSize;
    }

    getFontName(): string {
      return this._bitmapFontName;
    }

    updateFont(): void {
      const bitmapFont = this._object
        .getInstanceContainer()
        .getGame()
        .getBitmapFontManager()
        .obtainBitmapFont(
          this._object._bitmapFontResourceName,
          this._object._textureAtlasResourceName
        ) as any;

      const oldFontName = this._bitmapFontName;
      this._bitmapFont = bitmapFont;
      this._bitmapFontName = bitmapFont?.font || '';
      this._fontSize = bitmapFont?.size || bitmapFont?.lineHeight || 20;

      if (oldFontName && oldFontName !== this._bitmapFontName) {
        this._object
          .getInstanceContainer()
          .getGame()
          .getBitmapFontManager()
          .releaseBitmapFont(oldFontName);
      }

      this._renderBitmapText();
    }

    updateTint(): void {
      this._sprite.tint =
        (this._object._tint[0] << 16) |
        (this._object._tint[1] << 8) |
        this._object._tint[2];
    }

    updateScale(): void {
      this._updateSpriteTransform();
      this.updatePosition();
    }

    updateWrappingWidth(): void {
      this._renderBitmapText();
      this.updatePosition();
    }

    updateTextContent(): void {
      this._renderBitmapText();
      this.updatePosition();
    }

    updateAlignment(): void {
      this._renderBitmapText();
      this.updatePosition();
    }

    updatePosition(): void {
      this._sprite.position.set(
        this._object.x,
        this._object.y -
          (this._object._verticalTextAlignment === 'center'
            ? this.getHeight() / 2
            : this._object._verticalTextAlignment === 'bottom'
              ? this.getHeight()
              : 0)
      );
      this._sprite.zIndex = this._object.getZOrder();
    }

    updateAngle(): void {
      this._sprite.angle = this._object.angle;
    }

    updateOpacity(): void {
      this._sprite.alpha = this._object._opacity / 255;
    }

    getWidth(): float {
      return this._renderedWidth * Math.max(this._object._scaleX, 0);
    }

    getHeight(): float {
      return this._renderedHeight * Math.max(this._object._scaleY, 0);
    }

    _updateSpriteTransform(): void {
      this._sprite.scale.set(
        Math.max(this._object._scaleX, 0),
        Math.max(this._object._scaleY, 0)
      );
    }

    _renderBitmapText(): void {
      const text = this._object._text || ' ';
      const fontSize = this._fontSize || 20;
      const fontName = this._bitmapFontName || 'Arial';
      const lines = text.split('\n');
      const ctx = this._context;
      ctx.font = `${fontSize}px "${fontName}"`;
      const widths = lines.map((line) => ctx.measureText(line || ' ').width);
      const width = Math.max(1, Math.ceil(Math.max(...widths, 1)));
      const lineHeight = Math.ceil(fontSize * 1.2);
      const height = Math.max(1, lineHeight * Math.max(lines.length, 1));

      this._canvas.width = width;
      this._canvas.height = height;
      this._renderedWidth = width;
      this._renderedHeight = height;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `${fontSize}px "${fontName}"`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = '#ffffff';
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] || ' ';
        let x = 0;
        if (this._object._textAlign === 'center') {
          x = (width - widths[i]) / 2;
        } else if (this._object._textAlign === 'right') {
          x = width - widths[i];
        }
        ctx.fillText(line, x, i * lineHeight);
      }

      this._texture.update();
      this._updateSpriteTransform();
    }
  }
}
