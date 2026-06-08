namespace gdjs {
  const logger = new gdjs.Logger('BBText renderer');

  type BBTextRenderData = {
    text: string;
    tagStyles: { [tagName: string]: Partial<PIXI.TextStyleOptions> };
  };

  const escapePixiTagText = (text: string): string =>
    text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');

  const getSafeColor = (color: string): string | null => {
    try {
      new PIXI.Color(color);
      return color;
    } catch (error) {
      logger.warn(
        'Error rendering BBText (invalid color or style in BBCode): ' + error
      );
      return null;
    }
  };

  const getPixiTagStyle = (
    tagName: string,
    value: string | undefined
  ): Partial<PIXI.TextStyleOptions> | null => {
    switch (tagName) {
      case 'b':
        return { fontWeight: 'bold' };
      case 'i':
        return { fontStyle: 'italic' };
      case 'color': {
        const color = value ? getSafeColor(value) : null;
        return color ? { fill: color } : null;
      }
      case 'outline': {
        const color = value ? getSafeColor(value) : null;
        return color
          ? {
              stroke: {
                color,
                width: 6,
              },
            }
          : null;
      }
      case 'font':
        return value ? { fontFamily: value } : null;
      case 'shadow': {
        const color = value ? getSafeColor(value) : null;
        return color
          ? {
              dropShadow: {
                color,
                blur: 3,
                distance: 3,
                angle: 2,
              },
            }
          : null;
      }
      case 'size': {
        const fontSize = value ? parseFloat(value) : NaN;
        return Number.isFinite(fontSize) ? { fontSize } : null;
      }
      case 'spacing': {
        const letterSpacing = value ? parseFloat(value) : NaN;
        return Number.isFinite(letterSpacing) ? { letterSpacing } : null;
      }
      case 'align':
        return value
          ? { align: value as PIXI.TextStyleAlign }
          : null;
      default:
        return null;
    }
  };

  const parseBBCodeText = (text: string): BBTextRenderData => {
    const tagStyles: BBTextRenderData['tagStyles'] = {
      b: { fontWeight: 'bold' },
      i: { fontStyle: 'italic' },
    };
    const tagStacks: { [tagName: string]: string[] } = {};
    const output: string[] = [];
    const tagRegex =
      /\[(\/?)(b|i|color|outline|font|shadow|size|spacing|align)(?:=([^\]]+))?\]/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let dynamicTagIndex = 0;

    while ((match = tagRegex.exec(text))) {
      output.push(escapePixiTagText(text.substring(lastIndex, match.index)));
      lastIndex = match.index + match[0].length;

      const isClosingTag = match[1] === '/';
      const baseTagName = match[2].toLowerCase();
      if (isClosingTag) {
        const tagName = (tagStacks[baseTagName] || []).pop();
        if (tagName) {
          output.push('</' + tagName + '>');
        }
        continue;
      }

      const tagStyle = getPixiTagStyle(baseTagName, match[3]);
      if (!tagStyle) {
        continue;
      }

      const tagName =
        baseTagName === 'b' || baseTagName === 'i'
          ? baseTagName
          : baseTagName + dynamicTagIndex++;
      tagStyles[tagName] = tagStyle;
      tagStacks[baseTagName] = tagStacks[baseTagName] || [];
      tagStacks[baseTagName].push(tagName);
      output.push('<' + tagName + '>');
    }

    output.push(escapePixiTagText(text.substring(lastIndex)));

    return {
      text: output.join(''),
      tagStyles,
    };
  };

  /**
   * The PIXI.js renderer for the BBCode Text runtime object.
   * @category Renderers > BBText
   */
  export class BBTextRuntimeObjectPixiRenderer {
    _object: gdjs.BBTextRuntimeObject;
    _pixiObject: PIXI.Text;

    /**
     * @param runtimeObject The object to render
     * @param instanceContainer The gdjs.RuntimeInstanceContainer in which the object is
     */
    constructor(
      runtimeObject: gdjs.BBTextRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;

      const renderData = parseBBCodeText(runtimeObject._text);
      this._pixiObject = new PIXI.Text({
        text: renderData.text,
        style: {
          fontFamily: instanceContainer
            .getGame()
            .getFontManager()
            .getFontFamily(runtimeObject._fontFamily),
          fontSize: runtimeObject._fontSize,
          fill: gdjs.rgbToHexNumber(
            runtimeObject._color[0],
            runtimeObject._color[1],
            runtimeObject._color[2]
          ),
          wordWrap: runtimeObject._wrapping,
          wordWrapWidth: runtimeObject._wrappingWidth,
          align: runtimeObject._textAlign as PIXI.TextStyleAlign | undefined,
          tagStyles: renderData.tagStyles,
        },
      });
      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._pixiObject, runtimeObject.getZOrder());

      this.updateAlignment();
      this.updateText();
      this.updatePosition();
      this.updateAngle();
      this.updateOpacity();
    }

    getRendererObject() {
      return this._pixiObject;
    }

    updateWordWrap(): void {
      this._pixiObject.style.wordWrap = this._object._wrapping;
      this.updatePosition();
    }

    updateWrappingWidth(): void {
      this._pixiObject.style.wordWrapWidth = this._object._wrappingWidth;
      this.updatePosition();
    }

    updateText(): void {
      const renderData = parseBBCodeText(this._object._text);
      this._pixiObject.text = renderData.text;
      this._pixiObject.style.tagStyles = renderData.tagStyles;
      this.updatePosition();
    }

    updateColor(): void {
      this._pixiObject.style.fill = gdjs.rgbToHexNumber(
        this._object._color[0],
        this._object._color[1],
        this._object._color[2]
      );
    }

    updateAlignment(): void {
      this._pixiObject.style.align = this._object
        ._textAlign as PIXI.TextStyleAlign;
    }

    updateFontFamily(): void {
      this._pixiObject.style.fontFamily = this._object
        .getInstanceContainer()
        .getGame()
        .getFontManager()
        .getFontFamily(this._object._fontFamily);
    }

    updateFontSize(): void {
      this._pixiObject.style.fontSize = this._object._fontSize;
    }

    updatePosition(): void {
      if (this._object.isWrapping() && this._pixiObject.width !== 0) {
        const alignmentX =
          this._object._textAlign === 'right'
            ? 1
            : this._object._textAlign === 'center'
              ? 0.5
              : 0;

        const width = this._object.getWrappingWidth();

        // A vector from the custom size center to the renderer center.
        const centerToCenterX =
          (width - this._pixiObject.width) * (alignmentX - 0.5);

        this._pixiObject.position.x = this._object.x + width / 2;
        this._pixiObject.anchor.x =
          0.5 - centerToCenterX / this._pixiObject.width;
      } else {
        this._pixiObject.position.x =
          this._object.x + this._pixiObject.width / 2;
        this._pixiObject.anchor.x = 0.5;
      }

      const alignmentY =
        this._object._verticalTextAlignment === 'bottom'
          ? 1
          : this._object._verticalTextAlignment === 'center'
            ? 0.5
            : 0;
      this._pixiObject.position.y =
        this._object.y + this._pixiObject.height * (0.5 - alignmentY);
      this._pixiObject.anchor.y = 0.5;
    }

    updateAngle(): void {
      this._pixiObject.rotation = gdjs.toRad(this._object.angle);
    }

    updateOpacity(): void {
      this._pixiObject.alpha = this._object._opacity / 255;
    }

    getWidth(): float {
      return this._pixiObject.width;
    }

    getHeight(): float {
      return this._pixiObject.height;
    }

    destroy(): void {
      this._pixiObject.destroy({ texture: true, textureSource: true });
    }
  }

  /**
   * @category Renderers > BBText
   */
  export const BBTextRuntimeObjectRenderer = BBTextRuntimeObjectPixiRenderer;
  /**
   * @category Renderers > BBText
   */
  export type BBTextRuntimeObjectRenderer = BBTextRuntimeObjectPixiRenderer;
}
