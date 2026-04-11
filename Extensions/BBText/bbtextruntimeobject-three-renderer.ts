namespace gdjs {
  type BBTextSegmentStyle = {
    fill: string;
    fontFamily: string;
    fontSize: number;
    fontStyle: string;
    fontWeight: string;
    letterSpacing: number;
    stroke: string | null;
    strokeThickness: number;
    shadowColor: string | null;
    shadowBlur: number;
    shadowDistance: number;
  };

  type BBTextSegment = {
    text: string;
    style: BBTextSegmentStyle;
  };

  type BBTextLine = {
    height: number;
    segments: Array<BBTextSegment & { width: number }>;
    width: number;
  };

  const getDefaultBBTextStyle = (
    runtimeObject: gdjs.BBTextRuntimeObject,
    fontFamily: string
  ): BBTextSegmentStyle => ({
    fill: `rgb(${runtimeObject._color[0]}, ${runtimeObject._color[1]}, ${runtimeObject._color[2]})`,
    fontFamily: fontFamily || 'Arial',
    fontSize: Math.max(1, runtimeObject._fontSize),
    fontStyle: 'normal',
    fontWeight: 'normal',
    letterSpacing: 0,
    stroke: null,
    strokeThickness: 0,
    shadowColor: null,
    shadowBlur: 0,
    shadowDistance: 0,
  });

  const cloneBBTextStyle = (
    style: BBTextSegmentStyle
  ): BBTextSegmentStyle => ({ ...style });

  const normalizeBBTextColor = (
    color: string | null | undefined,
    fallback: string
  ): string => {
    if (!color) return fallback;

    const normalizedColor = color.trim();
    if (!normalizedColor) return fallback;
    if (normalizedColor.includes(';')) {
      const rgb = gdjs.rgbOrHexToRGBColor(normalizedColor);
      return `rgb(${rgb[0]}, ${rgb[1]}, ${rgb[2]})`;
    }

    if (normalizedColor[0] === '#') return normalizedColor;
    return normalizedColor;
  };

  const getBBTextFontString = (style: BBTextSegmentStyle): string => {
    const parts: string[] = [];
    if (style.fontStyle !== 'normal') parts.push(style.fontStyle);
    if (style.fontWeight !== 'normal') parts.push(style.fontWeight);
    parts.push(`${style.fontSize}px`);
    parts.push(`"${style.fontFamily}"`);
    return parts.join(' ');
  };

  const applyBBTextTag = (
    style: BBTextSegmentStyle,
    tagName: string,
    tagValue: string | undefined
  ): BBTextSegmentStyle => {
    const nextStyle = cloneBBTextStyle(style);
    if (tagName === 'b') {
      nextStyle.fontWeight = 'bold';
    } else if (tagName === 'i') {
      nextStyle.fontStyle = 'italic';
    } else if (tagName === 'color') {
      nextStyle.fill = normalizeBBTextColor(tagValue, nextStyle.fill);
    } else if (tagName === 'size') {
      const parsedSize = parseFloat(tagValue || '');
      if (!isNaN(parsedSize)) nextStyle.fontSize = Math.max(1, parsedSize);
    } else if (tagName === 'font' && tagValue) {
      nextStyle.fontFamily = tagValue;
    } else if (tagName === 'outline') {
      nextStyle.stroke = normalizeBBTextColor(tagValue, nextStyle.fill);
      nextStyle.strokeThickness = Math.max(1, nextStyle.fontSize / 8);
    } else if (tagName === 'shadow') {
      nextStyle.shadowColor = normalizeBBTextColor(tagValue, '#000000');
      nextStyle.shadowBlur = Math.max(1, nextStyle.fontSize / 10);
      nextStyle.shadowDistance = Math.max(1, nextStyle.fontSize / 10);
    } else if (tagName === 'spacing') {
      const parsedSpacing = parseFloat(tagValue || '');
      if (!isNaN(parsedSpacing)) nextStyle.letterSpacing = parsedSpacing;
    }

    return nextStyle;
  };

  const parseBBTextSegments = (
    text: string,
    baseStyle: BBTextSegmentStyle
  ): (BBTextSegment | { newline: true })[] => {
    const tagsStack: Array<{ tagName: string; style: BBTextSegmentStyle }> = [
      { tagName: 'default', style: cloneBBTextStyle(baseStyle) },
    ];
    const segments: (BBTextSegment | { newline: true })[] = [];
    const tagRegExp =
      /\[(\/?)(b|i|color|size|font|outline|shadow|spacing)(?:=([^\]]+))?\]/gi;
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = tagRegExp.exec(text))) {
      if (match.index > lastIndex) {
        const plainText = text.substring(lastIndex, match.index);
        const lines = plainText.split('\n');
        for (let index = 0; index < lines.length; index++) {
          if (lines[index]) {
            segments.push({
              text: lines[index],
              style: cloneBBTextStyle(tagsStack[tagsStack.length - 1].style),
            });
          }
          if (index < lines.length - 1) segments.push({ newline: true });
        }
      }

      const isClosingTag = match[1] === '/';
      const tagName = (match[2] || '').toLowerCase();
      const tagValue = match[3];

      if (isClosingTag) {
        for (let stackIndex = tagsStack.length - 1; stackIndex > 0; stackIndex--) {
          if (tagsStack[stackIndex].tagName === tagName) {
            tagsStack.splice(stackIndex, 1);
            break;
          }
        }
      } else {
        const nextStyle = applyBBTextTag(
          tagsStack[tagsStack.length - 1].style,
          tagName,
          tagValue
        );
        tagsStack.push({ tagName, style: nextStyle });
      }

      lastIndex = tagRegExp.lastIndex;
    }

    if (lastIndex < text.length) {
      const plainText = text.substring(lastIndex);
      const lines = plainText.split('\n');
      for (let index = 0; index < lines.length; index++) {
        if (lines[index]) {
          segments.push({
            text: lines[index],
            style: cloneBBTextStyle(tagsStack[tagsStack.length - 1].style),
          });
        }
        if (index < lines.length - 1) segments.push({ newline: true });
      }
    }

    return segments.length
      ? segments
      : [{ text: ' ', style: cloneBBTextStyle(baseStyle) }];
  };

  const measureBBTextSegmentWidth = (
    context: CanvasRenderingContext2D,
    text: string,
    style: BBTextSegmentStyle
  ): number => {
    if (!text.length) return 0;
    context.font = getBBTextFontString(style);
    let width = 0;
    for (let index = 0; index < text.length; index++) {
      width += context.measureText(text[index]).width;
      if (index < text.length - 1) width += style.letterSpacing;
    }
    return width;
  };

  const buildBBTextLines = (
    context: CanvasRenderingContext2D,
    parsedSegments: (BBTextSegment | { newline: true })[],
    maxWidth: number
  ): BBTextLine[] => {
    const lines: BBTextLine[] = [];
    let currentLine: BBTextLine = { height: 1, segments: [], width: 0 };

    const pushCurrentLine = () => {
      lines.push(currentLine);
      currentLine = { height: 1, segments: [], width: 0 };
    };

    const appendChunk = (text: string, style: BBTextSegmentStyle) => {
      if (!text.length) return;

      let chunk = '';
      for (const character of text) {
        const candidate = chunk + character;
        const candidateWidth = measureBBTextSegmentWidth(context, candidate, style);
        if (
          maxWidth > 0 &&
          currentLine.width > 0 &&
          currentLine.width + candidateWidth > maxWidth
        ) {
          const chunkWidth = measureBBTextSegmentWidth(context, chunk, style);
          currentLine.segments.push({ text: chunk, style, width: chunkWidth });
          currentLine.width += chunkWidth;
          currentLine.height = Math.max(
            currentLine.height,
            Math.ceil(style.fontSize * 1.2 + style.strokeThickness + style.shadowDistance)
          );
          pushCurrentLine();
          chunk = character;
        } else {
          chunk = candidate;
        }
      }

      if (!chunk.length) return;
      const chunkWidth = measureBBTextSegmentWidth(context, chunk, style);
      currentLine.segments.push({ text: chunk, style, width: chunkWidth });
      currentLine.width += chunkWidth;
      currentLine.height = Math.max(
        currentLine.height,
        Math.ceil(style.fontSize * 1.2 + style.strokeThickness + style.shadowDistance)
      );
    };

    for (const parsedSegment of parsedSegments) {
      if ('newline' in parsedSegment) {
        pushCurrentLine();
        continue;
      }

      appendChunk(parsedSegment.text || ' ', parsedSegment.style);
    }

    lines.push(currentLine);
    return lines.length ? lines : [{ height: 1, segments: [], width: 0 }];
  };

  /**
   * The Three.js renderer for the BBCode Text runtime object.
   * @category Renderers > BBText
   */
  export class BBTextRuntimeObjectThreeRenderer {
    _object: gdjs.BBTextRuntimeObject;
    _fontManager: gdjs.FontFaceObserverFontManager;
    _canvas: HTMLCanvasElement;
    _context: CanvasRenderingContext2D;
    _texture: THREE.CanvasTexture;
    _material: THREE.MeshBasicMaterial;
    _mesh: THREE.Mesh;
    _canvasWidth: float = 1;
    _canvasHeight: float = 1;

    constructor(
      runtimeObject: gdjs.BBTextRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._fontManager = instanceContainer.getGame().getFontManager();
      this._canvas = document.createElement('canvas');
      this._context = this._canvas.getContext('2d') as CanvasRenderingContext2D;
      this._texture = new THREE.CanvasTexture(this._canvas);
      this._texture.colorSpace = THREE.SRGBColorSpace;
      this._texture.minFilter = THREE.LinearFilter;
      this._texture.magFilter = THREE.LinearFilter;
      const geometry = new THREE.PlaneGeometry(1, 1);
      geometry.translate(0.5, -0.5, 0);
      this._material = new THREE.MeshBasicMaterial({
        map: this._texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });
      this._mesh = new THREE.Mesh(geometry, this._material);
      this._mesh.rotation.order = 'ZYX';
      this._mesh.renderOrder = 100000 + runtimeObject.getZOrder();

      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._mesh, runtimeObject.getZOrder());

      this._redraw();
      this.updatePosition();
      this.updateAngle();
      this.updateOpacity();
    }

    getRendererObject() {
      return this._mesh;
    }

    private _redraw() {
      const baseStyle = getDefaultBBTextStyle(
        this._object,
        this._fontManager.getFontFamily(this._object._fontFamily)
      );
      const parsedSegments = parseBBTextSegments(this._object._text || ' ', baseStyle);
      const wrappingWidth = this._object.isWrapping()
        ? Math.max(1, this._object.getWrappingWidth())
        : 0;
      const lines = buildBBTextLines(this._context, parsedSegments, wrappingWidth);
      const padding = 6;
      const naturalWidth = lines.reduce(
        (maxWidth, line) => Math.max(maxWidth, Math.ceil(line.width)),
        1
      );
      const canvasWidth = Math.max(
        1,
        Math.ceil((wrappingWidth || naturalWidth) + padding * 2)
      );
      const canvasHeight = Math.max(
        1,
        Math.ceil(
          lines.reduce((height, line) => height + Math.max(1, line.height), 0) +
            padding * 2
        )
      );

      this._canvas.width = canvasWidth;
      this._canvas.height = canvasHeight;
      this._canvasWidth = canvasWidth;
      this._canvasHeight = canvasHeight;

      const context = this._context;
      context.clearRect(0, 0, canvasWidth, canvasHeight);
      context.textBaseline = 'top';

      let drawY = padding;
      for (const line of lines) {
        const drawX =
          this._object._textAlign === 'right'
            ? canvasWidth - padding - line.width
            : this._object._textAlign === 'center'
              ? padding + ((wrappingWidth || line.width) - line.width) / 2
              : padding;
        let cursorX = drawX;

        for (const segment of line.segments) {
          context.font = getBBTextFontString(segment.style);
          context.fillStyle = segment.style.fill;
          context.strokeStyle = segment.style.stroke || segment.style.fill;
          context.lineWidth = segment.style.strokeThickness;
          context.shadowColor = segment.style.shadowColor || 'rgba(0,0,0,0)';
          context.shadowBlur = segment.style.shadowBlur;
          context.shadowOffsetX = segment.style.shadowDistance;
          context.shadowOffsetY = segment.style.shadowDistance;

          for (let index = 0; index < segment.text.length; index++) {
            const character = segment.text[index];
            const characterWidth = context.measureText(character).width;
            if (segment.style.stroke && segment.style.strokeThickness > 0) {
              context.strokeText(character, cursorX, drawY);
            }
            context.fillText(character, cursorX, drawY);
            cursorX += characterWidth + (index < segment.text.length - 1 ? segment.style.letterSpacing : 0);
          }

          context.shadowColor = 'rgba(0,0,0,0)';
          context.shadowBlur = 0;
          context.shadowOffsetX = 0;
          context.shadowOffsetY = 0;
        }

        drawY += Math.max(1, line.height);
      }

      this._texture.needsUpdate = true;
      this._mesh.scale.set(this._canvasWidth, this._canvasHeight, 1);
    }

    updateWordWrap(): void {
      this._redraw();
      this.updatePosition();
    }

    updateWrappingWidth(): void {
      this._redraw();
      this.updatePosition();
    }

    updateText(): void {
      this._redraw();
      this.updatePosition();
    }

    updateColor(): void {
      this._redraw();
    }

    updateAlignment(): void {
      this._redraw();
      this.updatePosition();
    }

    updateFontFamily(): void {
      this._redraw();
      this.updatePosition();
    }

    updateFontSize(): void {
      this._redraw();
      this.updatePosition();
    }

    updatePosition(): void {
      if (this._object.isWrapping() && this._canvasWidth !== 0) {
        const alignmentX =
          this._object._textAlign === 'right'
            ? 1
            : this._object._textAlign === 'center'
              ? 0.5
              : 0;
        const width = this._object.getWrappingWidth();
        const centerToCenterX = (width - this._canvasWidth) * (alignmentX - 0.5);

        this._mesh.position.x = this._object.x + width / 2;
        this._mesh.scale.x = width;
        this._mesh.userData.anchorX = 0.5 - centerToCenterX / this._canvasWidth;
      } else {
        this._mesh.position.x = this._object.x + this._canvasWidth / 2;
        this._mesh.scale.x = this._canvasWidth;
        this._mesh.userData.anchorX = 0.5;
      }

      const alignmentY =
        this._object._verticalTextAlignment === 'bottom'
          ? 1
          : this._object._verticalTextAlignment === 'center'
            ? 0.5
            : 0;
      this._mesh.position.y =
        this._object.y + this._canvasHeight * (0.5 - alignmentY);
      this._mesh.position.z = this._object.getZOrder();
      this._mesh.scale.y = this._canvasHeight;
    }

    updateAngle(): void {
      this._mesh.rotation.z = -gdjs.toRad(this._object.angle);
    }

    updateOpacity(): void {
      this._material.opacity = this._object._opacity / 255;
    }

    getWidth(): float {
      return this._canvasWidth;
    }

    getHeight(): float {
      return this._canvasHeight;
    }

    destroy(): void {
      this._texture.dispose();
      this._material.dispose();
      this._mesh.geometry.dispose();
    }
  }

  /**
   * @category Renderers > BBText
   */
  export const BBTextRuntimeObjectRenderer = BBTextRuntimeObjectThreeRenderer;
  /**
   * @category Renderers > BBText
   */
  export type BBTextRuntimeObjectRenderer = BBTextRuntimeObjectThreeRenderer;
}
