namespace gdjs {
  type BitmapGlyphData = {
    xAdvance: number;
    xOffset: number;
    yOffset: number;
    texture?: any;
    frame?: { x: number; y: number; width: number; height: number };
    kerning?: Map<number, number> | Record<number, number>;
  };

  type BitmapTextLayoutGlyph = {
    glyph: BitmapGlyphData;
    x: number;
    y: number;
    charCode: number;
  };

  type BitmapTextLayoutLine = {
    width: number;
    glyphs: BitmapTextLayoutGlyph[];
  };

  export class BitmapTextRuntimeObjectThreeRenderer {
    _object: gdjs.BitmapTextRuntimeObject;
    _bitmapFont: any = null;
    _bitmapFontName: string = '';
    _fontSize: number = 20;
    _canvas: HTMLCanvasElement;
    _context: CanvasRenderingContext2D;
    _texture: THREE.CanvasTexture;
    _material: THREE.SpriteMaterial;
    _sprite: THREE.Sprite;
    _renderedWidth: number = 0;
    _renderedHeight: number = 0;

    constructor(
      runtimeObject: gdjs.BitmapTextRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._canvas = document.createElement('canvas');
      this._context = this._canvas.getContext('2d') as CanvasRenderingContext2D;
      this._texture = new THREE.CanvasTexture(this._canvas);
      this._texture.colorSpace = THREE.SRGBColorSpace;
      this._material = new THREE.SpriteMaterial({
        map: this._texture,
        transparent: true,
        alphaTest: 0.01,
      });
      this._sprite = new THREE.Sprite(this._material);

      instanceContainer
        .getLayer('')
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
      this._object
        .getInstanceContainer()
        .getLayer('')
        .getRenderer()
        .removeRendererObject(this._sprite);
      if (this._bitmapFontName) {
        this._object
          .getInstanceContainer()
          .getGame()
          .getBitmapFontManager()
          .releaseBitmapFont(this._bitmapFontName);
      }
      this._material.dispose();
      this._texture.dispose();
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
      this._material.color.setRGB(
        this._object._tint[0] / 255,
        this._object._tint[1] / 255,
        this._object._tint[2] / 255
      );
    }

    getTint(): string {
      return (
        this._object._tint[0] +
        ';' +
        this._object._tint[1] +
        ';' +
        this._object._tint[2]
      );
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
      if (this._object.isWrapping() && this.getWidth() !== 0) {
        const alignmentX =
          this._object._textAlign === 'right'
            ? 1
            : this._object._textAlign === 'center'
              ? 0.5
              : 0;

        const width = this._object.getWrappingWidth();
        const renderedWidth = this.getWidth();
        const centerToCenterX = (width - renderedWidth) * (alignmentX - 0.5);

        this._sprite.position.x = this._object.x + width / 2;
        this._sprite.center.x = 0.5 - centerToCenterX / renderedWidth;
      } else {
        this._sprite.position.x = this._object.x + this.getWidth() / 2;
        this._sprite.center.x = 0.5;
      }

      const alignmentY =
        this._object._verticalTextAlignment === 'bottom'
          ? 1
          : this._object._verticalTextAlignment === 'center'
            ? 0.5
            : 0;
      this._sprite.position.y =
        this._object.y + this.getHeight() * (0.5 - alignmentY);
      this._sprite.center.y = 0.5;
    }

    updateAngle(): void {
      this._sprite.material.rotation = gdjs.toRad(this._object.angle);
    }

    updateOpacity(): void {
      this._material.opacity = this._object._opacity / 255;
    }

    getWidth(): float {
      return this._renderedWidth * Math.max(this._object._scaleX, 0);
    }

    getHeight(): float {
      return this._renderedHeight * Math.max(this._object._scaleY, 0);
    }

    _updateSpriteTransform(): void {
      this._sprite.scale.set(this.getWidth(), this.getHeight(), 1);
    }

    _renderBitmapText(): void {
      const layout = this._layoutText();
      this._renderedWidth = Math.max(1, Math.ceil(layout.width));
      this._renderedHeight = Math.max(1, Math.ceil(layout.height));

      if (
        this._canvas.width !== this._renderedWidth ||
        this._canvas.height !== this._renderedHeight
      ) {
        this._canvas.width = this._renderedWidth;
        this._canvas.height = this._renderedHeight;
      }

      const atlasImage = this._getAtlasImage();
      this._context.clearRect(0, 0, this._renderedWidth, this._renderedHeight);

      if (atlasImage) {
        for (const line of layout.lines) {
          for (const entry of line.glyphs) {
            this._drawGlyph(atlasImage, entry);
          }
        }
      }

      this._texture.needsUpdate = true;
      this._updateSpriteTransform();
    }

    _layoutText(): {
      width: number;
      height: number;
      lines: BitmapTextLayoutLine[];
    } {
      const font = this._bitmapFont;
      if (!font) {
        return { width: 1, height: this._fontSize, lines: [] };
      }

      const text = this._object._text || '';
      const maxWidth =
        this._object._wrapping && this._object._scaleX > 0
          ? this._object._wrappingWidth / this._object._scaleX
          : 0;
      const lineHeight = font.lineHeight || font.size || this._fontSize || 20;
      const chars = this._getCharsMap(font);

      const lines: BitmapTextLayoutLine[] = [];
      let currentLine: BitmapTextLayoutLine = { width: 0, glyphs: [] };
      let x = 0;
      let y = 0;
      let maxLineWidth = 0;
      let previousCharCode = 0;

      const flushLine = () => {
        currentLine.width = x;
        maxLineWidth = Math.max(maxLineWidth, currentLine.width);
        lines.push(currentLine);
        currentLine = { width: 0, glyphs: [] };
        x = 0;
        y += lineHeight;
        previousCharCode = 0;
      };

      for (let i = 0; i < text.length; i++) {
        const character = text[i];
        if (character === '\r') continue;
        if (character === '\n') {
          flushLine();
          continue;
        }

        const glyph = this._getGlyph(chars, character);
        if (!glyph) {
          continue;
        }

        const kerning = this._getKerning(glyph, previousCharCode);
        const glyphWidth =
          glyph.xAdvance || this._getGlyphFrame(glyph)?.width || 0;
        if (maxWidth > 0 && x > 0 && x + kerning + glyphWidth > maxWidth) {
          flushLine();
        }

        x += kerning;
        currentLine.glyphs.push({
          glyph,
          x: x + (glyph.xOffset || 0),
          y: y + (glyph.yOffset || 0),
          charCode: character.charCodeAt(0),
        });
        x += glyph.xAdvance || 0;
        previousCharCode = character.charCodeAt(0);
      }

      currentLine.width = x;
      maxLineWidth = Math.max(maxLineWidth, currentLine.width);
      lines.push(currentLine);

      return {
        width: maxLineWidth || 1,
        height: Math.max(lineHeight, lines.length * lineHeight),
        lines,
      };
    }

    _drawGlyph(
      atlasImage: CanvasImageSource,
      entry: BitmapTextLayoutGlyph
    ): void {
      const frame = this._getGlyphFrame(entry.glyph);
      if (!frame || frame.width <= 0 || frame.height <= 0) {
        return;
      }

      this._context.drawImage(
        atlasImage,
        frame.x,
        frame.y,
        frame.width,
        frame.height,
        entry.x,
        entry.y,
        frame.width,
        frame.height
      );
    }

    _getGlyphFrame(glyph: BitmapGlyphData): {
      x: number;
      y: number;
      width: number;
      height: number;
    } | null {
      const texture = glyph.texture as any;
      const frame = texture?.frame || glyph.frame;
      if (!frame) {
        return null;
      }
      return {
        x: frame.x || 0,
        y: frame.y || 0,
        width: frame.width || 0,
        height: frame.height || 0,
      };
    }

    _getAtlasImage(): CanvasImageSource | null {
      const font = this._bitmapFont as any;
      const chars = this._getCharsMap(font);
      for (const glyph of Object.values(chars) as BitmapGlyphData[]) {
        const texture = glyph?.texture as any;
        const image =
          texture?.baseTexture?.resource?.source ||
          texture?.baseTexture?.resource?.image ||
          null;
        if (image) {
          return image;
        }
      }

      const threeTexture = (
        this._object
          .getInstanceContainer()
          .getGame()
          .getImageManager() as gdjs.ThreeTextureImageManager
      ).getThreeTexture(this._object._textureAtlasResourceName);
      return (threeTexture?.image as CanvasImageSource | undefined) || null;
    }

    _getCharsMap(font: any): Record<string, BitmapGlyphData> {
      const chars = font?.chars;
      if (!chars) {
        return {};
      }
      if (chars instanceof Map) {
        const result: Record<string, BitmapGlyphData> = {};
        chars.forEach((value, key) => {
          result[String(key)] = value;
        });
        return result;
      }
      return chars;
    }

    _getGlyph(
      chars: Record<string, BitmapGlyphData>,
      character: string
    ): BitmapGlyphData | null {
      const charCode = character.charCodeAt(0);
      return (
        chars[charCode] || chars[character] || chars[String(charCode)] || null
      );
    }

    _getKerning(glyph: BitmapGlyphData, previousCharCode: number): number {
      const kerning = glyph.kerning;
      if (!kerning || !previousCharCode) {
        return 0;
      }
      if (kerning instanceof Map) {
        return kerning.get(previousCharCode) || 0;
      }
      return (kerning as Record<number, number>)[previousCharCode] || 0;
    }
  }

  export const BitmapTextRuntimeObjectRenderer =
    BitmapTextRuntimeObjectThreeRenderer;
  export type BitmapTextRuntimeObjectRenderer =
    BitmapTextRuntimeObjectThreeRenderer;
}
