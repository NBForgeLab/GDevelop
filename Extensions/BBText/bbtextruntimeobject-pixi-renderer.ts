namespace gdjs {
  export class BBTextRuntimeObjectPixiRenderer {
    private _object: gdjs.BBTextRuntimeObject;
    private _canvas: HTMLCanvasElement;
    private _context: CanvasRenderingContext2D;
    private _texture: PIXI.Texture;
    private _sprite: PIXI.Sprite;
    private _renderedWidth = 1;
    private _renderedHeight = 1;

    constructor(
      runtimeObject: gdjs.BBTextRuntimeObject,
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

      this.updateText();
      this.updatePosition();
      this.updateOpacity();
    }

    getRendererObject() {
      return this._sprite;
    }

    destroy(): void {
      this._sprite.destroy();
      this._texture.destroy(true);
    }

    private _renderToCanvas(): void {
      const fontFamily = this._object._fontFamily || 'Arial';
      const fontSize = Math.max(1, this._object._fontSize);
      const text = this._object._text || ' ';
      const lines = text.split('\n');
      const ctx = this._context;
      ctx.font = `${fontSize}px "${fontFamily}"`;
      const widths = lines.map((line) => ctx.measureText(line || ' ').width);
      const width = Math.max(1, Math.ceil(Math.max(...widths, 1)));
      const lineHeight = Math.ceil(fontSize * 1.2);
      const height = Math.max(1, lineHeight * Math.max(lines.length, 1));

      this._canvas.width = width;
      this._canvas.height = height;
      this._renderedWidth = width;
      this._renderedHeight = height;

      ctx.clearRect(0, 0, width, height);
      ctx.font = `${fontSize}px "${fontFamily}"`;
      ctx.textBaseline = 'top';
      ctx.fillStyle = `rgb(${this._object._color[0]}, ${this._object._color[1]}, ${this._object._color[2]})`;

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] || ' ';
        const lineWidth = widths[i] || 0;
        let x = 0;
        if (this._object._textAlign === 'center') {
          x = (width - lineWidth) / 2;
        } else if (this._object._textAlign === 'right') {
          x = width - lineWidth;
        }
        ctx.fillText(line, x, i * lineHeight);
      }

      this._texture.update();
      this._sprite.width = width;
      this._sprite.height = height;
    }

    updateText(): void {
      this._renderToCanvas();
      this.updatePosition();
    }

    updateColor(): void {
      this._renderToCanvas();
    }

    updateFontSize(): void {
      this._renderToCanvas();
    }

    updateFontFamily(): void {
      this._renderToCanvas();
    }

    updateAlignment(): void {
      this._renderToCanvas();
    }

    updateWordWrap(): void {
      this._renderToCanvas();
    }

    updateWrappingWidth(): void {
      this._renderToCanvas();
    }

    updatePosition(): void {
      const yOffset =
        this._object._verticalTextAlignment === 'center'
          ? this.getHeight() / 2
          : this._object._verticalTextAlignment === 'bottom'
            ? this.getHeight()
            : 0;
      this._sprite.position.set(this._object.getX(), this._object.getY() - yOffset);
      this._sprite.zIndex = this._object.getZOrder();
    }

    updateAngle(): void {
      this._sprite.angle = this._object.angle;
    }

    updateOpacity(): void {
      this._sprite.alpha = this._object._opacity / 255;
      this._sprite.visible = !this._object.hidden;
    }

    getWidth(): float {
      return this._renderedWidth;
    }

    getHeight(): float {
      return this._renderedHeight;
    }
  }
}
