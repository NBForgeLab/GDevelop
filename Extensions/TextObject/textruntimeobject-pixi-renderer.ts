namespace gdjs {
  class TextRuntimeObjectPixiRenderer {
    _object: gdjs.TextRuntimeObject;
    _fontManager: any;
    _text: PIXI.Text;
    _justCreated: boolean = true;

    constructor(
      runtimeObject: gdjs.TextRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._fontManager = instanceContainer.getGame().getFontManager();
      this._text = new PIXI.Text({
        text: ' ',
        style: { align: 'left' },
      });
      this._text.anchor.x = 0.5;
      this._text.anchor.y = 0.5;
      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._text, runtimeObject.getZOrder());
      this._text.text =
        runtimeObject._str.length === 0 ? ' ' : runtimeObject._str;

      //Work around a PIXI.js bug. See updateTime method.
      this.updateStyle();
      this.updatePosition();
    }

    getRendererObject() {
      return this._text;
    }

    ensureUpToDate() {
      if (this._justCreated) {
        //Width seems not to be correct when text is not rendered yet.
        this.updatePosition();
        this._justCreated = false;
      }
    }

    updateStyle(): void {
      const fontName =
        '"' + this._fontManager.getFontFamily(this._object._fontName) + '"';
      const style = this._text.style;
      style.fontStyle = this._object._italic ? 'italic' : 'normal';
      style.fontWeight = this._object._bold ? 'bold' : 'normal';
      style.fontSize = this._object._characterSize;
      style.fontFamily = fontName;
      if (this._object._useGradient) {
        style.fill = this._getGradientFill();
      } else {
        style.fill = this._getColorHex();
      }
      // @ts-ignore
      style.align = this._object._textAlign;
      style.wordWrap = this._object._wrapping;
      style.wordWrapWidth = this._object._wrappingWidth;
      style.breakWords = true;
      style.stroke = {
        color: gdjs.rgbToHexNumber(
          this._object._outlineColor[0],
          this._object._outlineColor[1],
          this._object._outlineColor[2]
        ),
        width: this._object._isOutlineEnabled
          ? this._object._outlineThickness
          : 0,
        join: 'miter',
        miterLimit: 3,
      };
      style.dropShadow = this._object._shadow
        ? {
            color: gdjs.rgbToHexNumber(
              this._object._shadowColor[0],
              this._object._shadowColor[1],
              this._object._shadowColor[2]
            ),
            alpha: this._object._shadowOpacity / 255,
            blur: this._object._shadowBlur,
            angle: gdjs.toRad(this._object._shadowAngle),
            distance: this._object._shadowDistance,
          }
        : false;
      const extraPaddingForShadow = this._object._shadow
        ? this._object._shadowDistance + this._object._shadowBlur
        : 0;
      style.padding = Math.ceil(this._object._padding + extraPaddingForShadow);
      style.lineHeight = this._object._lineHeight;
      this.updatePosition();
    }

    updatePosition(): void {
      if (this._object.isWrapping() && this._text.width !== 0) {
        const alignmentX =
          this._object._textAlign === 'right'
            ? 1
            : this._object._textAlign === 'center'
              ? 0.5
              : 0;

        const width = this._object.getWrappingWidth();

        // A vector from the custom size center to the renderer center.
        const centerToCenterX = (width - this._text.width) * (alignmentX - 0.5);

        this._text.position.x = this._object.x + width / 2;
        this._text.anchor.x = 0.5 - centerToCenterX / this._text.width;
      } else {
        this._text.position.x = this._object.x + this._text.width / 2;
        this._text.anchor.x = 0.5;
      }

      const alignmentY =
        this._object._verticalTextAlignment === 'bottom'
          ? 1
          : this._object._verticalTextAlignment === 'center'
            ? 0.5
            : 0;
      this._text.position.y =
        this._object.y + this._text.height * (0.5 - alignmentY);
      this._text.anchor.y = 0.5;
    }

    updateAngle(): void {
      this._text.rotation = gdjs.toRad(this._object.angle);
    }

    updateOpacity(): void {
      this._text.alpha = this._object.opacity / 255;
    }

    updateString(): void {
      this._text.text =
        this._object._str.length === 0 ? ' ' : this._object._str;
    }

    getWidth(): float {
      return this._text.width;
    }

    getHeight(): float {
      return this._text.height;
    }

    _getColorHex() {
      return gdjs.rgbToHexNumber(
        this._object._color[0],
        this._object._color[1],
        this._object._color[2]
      );
    }

    _getGradientFill() {
      const lastColorIndex = this._object._gradient.length - 1;
      if (lastColorIndex <= 0) {
        const color = this._object._gradient[0] || this._object._color;
        return gdjs.rgbToHexNumber(color[0], color[1], color[2]);
      }
      return new PIXI.FillGradient({
        type: 'linear',
        start: { x: 0, y: 0 },
        end:
          this._object._gradientType === 'LINEAR_VERTICAL'
            ? { x: 0, y: 1 }
            : { x: 1, y: 0 },
        colorStops: this._object._gradient.map((color, index) => ({
          offset: index / lastColorIndex,
          color: gdjs.rgbToHexNumber(color[0], color[1], color[2]),
        })),
        textureSpace: 'local',
      });
    }

    /**
     * Get x-scale of the text.
     */
    getScaleX(): float {
      return this._text.scale.x;
    }

    /**
     * Get y-scale of the text.
     */
    getScaleY(): float {
      return this._text.scale.y;
    }

    /**
     * Set the text object scale.
     * @param newScale The new scale for the text object.
     */
    setScale(newScale: float): void {
      this._text.scale.x = newScale;
      this._text.scale.y = newScale;
    }

    /**
     * Set the text object x-scale.
     * @param newScale The new x-scale for the text object.
     */
    setScaleX(newScale: float): void {
      this._text.scale.x = newScale;
    }

    /**
     * Set the text object y-scale.
     * @param newScale The new y-scale for the text object.
     */
    setScaleY(newScale: float): void {
      this._text.scale.y = newScale;
    }

    destroy() {
      this._text.destroy({ texture: true, textureSource: true });
    }
  }

  // Register the class to let the engine use it.
  /**
   * @category Renderers > Text
   */
  export const TextRuntimeObjectRenderer = TextRuntimeObjectPixiRenderer;
  /**
   * @category Renderers > Text
   */
  export type TextRuntimeObjectRenderer = TextRuntimeObjectPixiRenderer;
}
