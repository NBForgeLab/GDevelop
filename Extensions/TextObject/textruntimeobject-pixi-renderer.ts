namespace gdjs {
  const createPixiTextGradient = (
    ctx: CanvasRenderingContext2D,
    object: gdjs.TextRuntimeObject,
    width: number,
    height: number
  ) => {
    const isVertical = object._gradientType === 'LINEAR_VERTICAL';
    const gradient = isVertical
      ? ctx.createLinearGradient(0, 0, 0, Math.max(height, 1))
      : ctx.createLinearGradient(0, 0, Math.max(width, 1), 0);

    const stopCount = Math.max(object._gradient.length - 1, 1);
    for (let i = 0; i < object._gradient.length; i++) {
      const color = object._gradient[i];
      gradient.addColorStop(
        i / stopCount,
        `rgb(${color[0]}, ${color[1]}, ${color[2]})`
      );
    }

    return gradient;
  };

  const wrapPixiText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number
  ): string[] => {
    if (!text.includes('\n') && ctx.measureText(text).width <= maxWidth) {
      return [text];
    }

    const lines: string[] = [];
    const paragraphs = text.split('\n');
    for (const paragraph of paragraphs) {
      if (!paragraph.length) {
        lines.push('');
        continue;
      }

      const words = paragraph.split(' ');
      let currentLine = '';
      for (const word of words) {
        const candidate = currentLine ? currentLine + ' ' + word : word;
        if (ctx.measureText(candidate).width <= maxWidth) {
          currentLine = candidate;
          continue;
        }

        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }

        if (ctx.measureText(word).width <= maxWidth) {
          currentLine = word;
          continue;
        }

        let currentWordLine = '';
        for (const character of word) {
          const characterCandidate = currentWordLine + character;
          if (
            currentWordLine &&
            ctx.measureText(characterCandidate).width > maxWidth
          ) {
            lines.push(currentWordLine);
            currentWordLine = character;
          } else {
            currentWordLine = characterCandidate;
          }
        }
        currentLine = currentWordLine;
      }

      lines.push(currentLine);
    }

    return lines.length ? lines : [''];
  };

  export class TextRuntimeObjectPixiRenderer {
    _object: gdjs.TextRuntimeObject;
    _fontManager: gdjs.FontFaceObserverFontManager;
    _canvas: HTMLCanvasElement;
    _context: CanvasRenderingContext2D;
    _texture: PIXI.Texture;
    _sprite: PIXI.Sprite;
    _justCreated: boolean = true;
    _canvasWidth: float = 1;
    _canvasHeight: float = 1;
    _scaleX: float = 1;
    _scaleY: float = 1;

    constructor(
      runtimeObject: gdjs.TextRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._fontManager = instanceContainer.getGame().getFontManager();
      this._canvas = document.createElement('canvas');
      this._context = this._canvas.getContext('2d') as CanvasRenderingContext2D;
      this._texture = PIXI.Texture.from(this._canvas);
      this._sprite = new PIXI.Sprite(this._texture);
      this._sprite.anchor.set(0, 0);
      this._sprite.eventMode = 'none';
      this._sprite.zIndex = runtimeObject.getZOrder();

      instanceContainer
        .getLayer(runtimeObject.getLayer())
        .getRenderer()
        .addRendererObject(this._sprite, runtimeObject.getZOrder());

      this.updateStyle();
      this.updatePosition();
    }

    getRendererObject() {
      return this._sprite;
    }

    ensureUpToDate() {
      if (this._justCreated) {
        this.updatePosition();
        this._justCreated = false;
      }
    }

    private _getFontString(): string {
      const fontFamily =
        '"' + this._fontManager.getFontFamily(this._object._fontName) + '"';
      const fontParts: string[] = [];
      if (this._object._italic) fontParts.push('italic');
      if (this._object._bold) fontParts.push('bold');
      fontParts.push(`${this._object._characterSize}px`);
      fontParts.push(fontFamily);
      return fontParts.join(' ');
    }

    private _renderTextToCanvas() {
      const ctx = this._context;
      const object = this._object;
      const displayedText = object._str.length === 0 ? ' ' : object._str;

      ctx.font = this._getFontString();
      const lineHeight =
        object._lineHeight > 0
          ? object._lineHeight
          : Math.ceil(object._characterSize * 1.2);
      const wrappingWidth = object.isWrapping()
        ? Math.max(object.getWrappingWidth(), 1)
        : 0;
      const lines = object.isWrapping()
        ? wrapPixiText(ctx, displayedText, wrappingWidth)
        : displayedText.split('\n');
      const measuredLineWidths = lines.map((line) =>
        Math.ceil(ctx.measureText(line.length ? line : ' ').width)
      );
      const naturalTextWidth = measuredLineWidths.length
        ? Math.max(...measuredLineWidths)
        : 1;
      const extraPaddingForShadow = object._shadow
        ? object._shadowDistance + object._shadowBlur
        : 0;
      const padding = Math.ceil(object.getPadding() + extraPaddingForShadow);
      const canvasWidth =
        Math.ceil(
          (object.isWrapping() ? wrappingWidth : naturalTextWidth) + padding * 2
        ) || 1;
      const canvasHeight =
        Math.ceil(lines.length * lineHeight + padding * 2) || 1;

      this._canvas.width = canvasWidth;
      this._canvas.height = canvasHeight;
      this._canvasWidth = canvasWidth;
      this._canvasHeight = canvasHeight;

      ctx.clearRect(0, 0, canvasWidth, canvasHeight);
      ctx.font = this._getFontString();
      ctx.textBaseline = 'top';
      ctx.textAlign = 'left';
      ctx.lineJoin = 'round';
      ctx.miterLimit = 3;

      if (object._shadow) {
        ctx.shadowColor = `rgba(${object._shadowColor[0]}, ${object._shadowColor[1]}, ${object._shadowColor[2]}, ${object._shadowOpacity / 255})`;
        ctx.shadowBlur = object._shadowBlur;
        ctx.shadowOffsetX =
          Math.cos(gdjs.toRad(object._shadowAngle)) * object._shadowDistance;
        ctx.shadowOffsetY =
          Math.sin(gdjs.toRad(object._shadowAngle)) * object._shadowDistance;
      } else {
        ctx.shadowColor = 'rgba(0,0,0,0)';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
      }

      if (object._useGradient) {
        ctx.fillStyle = createPixiTextGradient(
          ctx,
          object,
          canvasWidth,
          canvasHeight
        );
      } else {
        ctx.fillStyle = `rgb(${object._color[0]}, ${object._color[1]}, ${object._color[2]})`;
      }

      ctx.strokeStyle = `rgb(${object._outlineColor[0]}, ${object._outlineColor[1]}, ${object._outlineColor[2]})`;
      ctx.lineWidth = object._isOutlineEnabled ? object._outlineThickness : 0;

      for (let lineIndex = 0; lineIndex < lines.length; lineIndex++) {
        const line = lines[lineIndex].length ? lines[lineIndex] : ' ';
        const measuredWidth = measuredLineWidths[lineIndex] || 0;
        const drawX = object.isWrapping()
          ? object._textAlign === 'right'
            ? canvasWidth - padding - measuredWidth
            : object._textAlign === 'center'
              ? padding + (wrappingWidth - measuredWidth) / 2
              : padding
          : padding;
        const drawY = padding + lineIndex * lineHeight;

        if (object._isOutlineEnabled && object._outlineThickness > 0) {
          ctx.strokeText(line, drawX, drawY);
        }
        ctx.fillText(line, drawX, drawY);
      }

      this._texture.update();
      this._applyScale();
      this.updatePosition();
    }

    updateStyle(): void {
      this._renderTextToCanvas();
    }

    updatePosition(): void {
      const object = this._object;
      const scaledHeight = this.getHeight();
      this._sprite.position.set(
        object.x,
        object.y -
          (object._verticalTextAlignment === 'center'
            ? scaledHeight / 2
            : object._verticalTextAlignment === 'bottom'
              ? scaledHeight
              : 0)
      );
      this._sprite.zIndex = object.getZOrder();
    }

    updateAngle(): void {
      this._sprite.angle = this._object.angle;
    }

    updateOpacity(): void {
      this._sprite.alpha = this._object.opacity / 255;
    }

    updateString(): void {
      this._renderTextToCanvas();
    }

    getWidth(): float {
      return Math.abs(this._canvasWidth * this._scaleX);
    }

    getHeight(): float {
      return Math.abs(this._canvasHeight * this._scaleY);
    }

    private _applyScale() {
      this._sprite.scale.set(this._scaleX, this._scaleY);
      this._sprite.width = this._canvasWidth * Math.abs(this._scaleX);
      this._sprite.height = this._canvasHeight * Math.abs(this._scaleY);
    }

    setScale(newScale: float): void {
      this._scaleX = newScale;
      this._scaleY = newScale;
      this._applyScale();
      this.updatePosition();
    }

    setScaleX(newScale: float): void {
      this._scaleX = newScale;
      this._applyScale();
      this.updatePosition();
    }

    setScaleY(newScale: float): void {
      this._scaleY = newScale;
      this._applyScale();
      this.updatePosition();
    }

    destroy() {
      this._sprite.destroy();
      this._texture.destroy(true);
    }
  }
}
