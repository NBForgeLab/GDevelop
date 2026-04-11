namespace gdjs {
  type ShapePainterCommand = (ctx: CanvasRenderingContext2D) => void;

  const numberToRgba = (color: number, opacity: number) => {
    const rgb = gdjs.hexNumberToRGBArray(color);
    return `rgba(${Math.round(rgb[0] * 255)}, ${Math.round(
      rgb[1] * 255
    )}, ${Math.round(rgb[2] * 255)}, ${opacity / 255})`;
  };

  const boundsFromPoints = (points: FloatPoint[]) => {
    let minX = Number.POSITIVE_INFINITY;
    let minY = Number.POSITIVE_INFINITY;
    let maxX = Number.NEGATIVE_INFINITY;
    let maxY = Number.NEGATIVE_INFINITY;
    for (const point of points) {
      minX = Math.min(minX, point[0]);
      minY = Math.min(minY, point[1]);
      maxX = Math.max(maxX, point[0]);
      maxY = Math.max(maxY, point[1]);
    }

    if (!Number.isFinite(minX)) {
      return { left: 0, top: 0, width: 0, height: 0 };
    }

    return {
      left: minX,
      top: minY,
      width: Math.max(0, maxX - minX),
      height: Math.max(0, maxY - minY),
    };
  };

  /**
   * The renderer for a gdjs.ShapePainterRuntimeObject using Three.js only.
   * @category Renderers > Shape Painter
   */
  export class ShapePainterRuntimeObjectThreeRenderer {
    _object: gdjs.ShapePainterRuntimeObject;
    _canvas: HTMLCanvasElement;
    _context: CanvasRenderingContext2D;
    _texture: THREE.CanvasTexture;
    _material: THREE.SpriteMaterial;
    _sprite: THREE.Sprite;
    _commands: ShapePainterCommand[] = [];
    _pathOpen: boolean = false;
    _localBounds = { left: 0, top: 0, width: 0, height: 0 };
    _positionXIsUpToDate = false;
    _positionYIsUpToDate = false;
    _transformationIsUpToDate = false;
    _placeholderTexture: THREE.Texture | null = null;
    _placeholderMaterial: THREE.SpriteMaterial | null = null;
    _placeholder: THREE.Sprite | null = null;

    private _position = new THREE.Vector3();
    private _quaternion = new THREE.Quaternion();
    private _scale = new THREE.Vector3(1, 1, 1);
    private _matrix = new THREE.Matrix4();
    private _inverseMatrix = new THREE.Matrix4();

    constructor(
      runtimeObject: gdjs.ShapePainterRuntimeObject,
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
        depthTest: false,
        depthWrite: false,
      });
      this._sprite = new THREE.Sprite(this._material);
      this._sprite.center.set(0, 1);

      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._sprite, runtimeObject.getZOrder());
      this._rerender();
      this.updateAntialiasing();
    }

    getRendererObject() {
      return this._sprite;
    }

    private _getPadding() {
      return Math.max(this._object._outlineSize, 1) + 4;
    }

    private _updateTransformMatrices() {
      this.updatePositionIfNeeded();
      
      // Get the rotation center in drawing coordinates
      const rotationCenterX = this._object.getRotationCenterX();
      const rotationCenterY = this._object.getRotationCenterY();
      
      // Get object position and scale
      const objX = this._object.getX();
      const objY = this._object.getY();
      const scaleX = this._object._scaleX;
      const scaleY = this._object._scaleY;
      const angle = this._object.angle;
      
      // Build transformation matrix:
      // 1. Translate to rotation center in scene coordinates
      const centerInSceneX = objX + rotationCenterX * Math.abs(scaleX);
      const centerInSceneY = objY + rotationCenterY * Math.abs(scaleY);
      
      // 2. Create transformation: translate to center, rotate, scale, translate back
      const cos = Math.cos(gdjs.toRad(angle));
      const sin = Math.sin(gdjs.toRad(angle));
      
      // Matrix for: point in drawing coords -> scene coords
      // Transform = Translate(center) * Rotate * Scale * Translate(-rotationCenter)
      this._matrix.set(
        scaleX * cos, -scaleY * sin, 0, centerInSceneX - rotationCenterX * scaleX * cos + rotationCenterY * scaleY * sin,
        scaleX * sin, scaleY * cos, 0, centerInSceneY - rotationCenterX * scaleX * sin - rotationCenterY * scaleY * cos,
        0, 0, 1, 0,
        0, 0, 0, 1
      );
      
      this._inverseMatrix.copy(this._matrix).invert();
      this._transformationIsUpToDate = true;
    }

    private _ensureTransformUpToDate() {
      if (!this._transformationIsUpToDate) {
        this._updateTransformMatrices();
      }
    }

    private _renderCommands() {
      const ctx = this._context;
      const padding = this._getPadding();
      const canvasWidth = Math.max(1, Math.ceil(this._localBounds.width + padding * 2));
      const canvasHeight = Math.max(1, Math.ceil(this._localBounds.height + padding * 2));
      this._canvas.width = canvasWidth;
      this._canvas.height = canvasHeight;

      ctx.clearRect(0, 0, this._canvas.width, this._canvas.height);
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.translate(
        padding - this._localBounds.left,
        padding - this._localBounds.top
      );
      ctx.lineJoin = 'round';
      ctx.lineCap = 'round';

      for (const command of this._commands) {
        command(ctx);
      }

      this._texture.needsUpdate = true;
      this._material.needsUpdate = true;
      this._sprite.scale.set(this._canvas.width, this._canvas.height, 1);
      this.updatePositionIfNeeded();
    }

    private _rerender() {
      this._renderCommands();
      this.invalidateBounds();
    }

    private _pushCommand(command: ShapePainterCommand, points: FloatPoint[]) {
      const nextBounds = boundsFromPoints(points);
      
      // If this is the first shape (width and height are 0), just use the new bounds
      if (this._localBounds.width === 0 && this._localBounds.height === 0) {
        this._localBounds = nextBounds;
      } else {
        // Merge with existing bounds
        const currentRight = this._localBounds.left + this._localBounds.width;
        const currentBottom = this._localBounds.top + this._localBounds.height;
        const nextRight = nextBounds.left + nextBounds.width;
        const nextBottom = nextBounds.top + nextBounds.height;
        this._localBounds = {
          left: Math.min(this._localBounds.left, nextBounds.left),
          top: Math.min(this._localBounds.top, nextBounds.top),
          width:
            Math.max(currentRight, nextRight) -
            Math.min(this._localBounds.left, nextBounds.left),
          height:
            Math.max(currentBottom, nextBottom) -
            Math.min(this._localBounds.top, nextBounds.top),
        };
      }
      this._commands.push(command);
      this._rerender();
    }

    clear() {
      this._commands = [];
      this._pathOpen = false;
      this._localBounds = { left: 0, top: 0, width: 0, height: 0 };
      this._rerender();
    }

    private _applyOutline(ctx: CanvasRenderingContext2D) {
      ctx.lineWidth = this._object._outlineSize;
      ctx.strokeStyle = numberToRgba(
        this._object._outlineColor,
        this._object._outlineOpacity
      );
      ctx.fillStyle = numberToRgba(
        this._object._fillColor,
        this._object._fillOpacity
      );
    }

    updateOutline(): void {
      this._rerender();
    }

    drawRectangle(x1: float, y1: float, x2: float, y2: float) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          const width = x2 - x1;
          const height = y2 - y1;
          ctx.beginPath();
          ctx.rect(x1, y1, width, height);
          ctx.fill();
          if (this._object._outlineSize > 0) ctx.stroke();
        },
        [
          [x1, y1],
          [x2, y2],
        ]
      );
    }

    drawCircle(x: float, y: float, radius: float) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
          if (this._object._outlineSize > 0) ctx.stroke();
        },
        [
          [x - radius, y - radius],
          [x + radius, y + radius],
        ]
      );
    }

    drawLine(x1: float, y1: float, x2: float, y2: float, thickness: float) {
      // Calculate proper bounds for a line with round caps
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const radius = thickness / 2;
      
      let bounds: FloatPoint[];
      if (length === 0) {
        // Point - just a circle
        bounds = [
          [x1 - radius, y1 - radius],
          [x1 + radius, y1 + radius],
        ];
      } else {
        // Normalized perpendicular vector
        const perpX = -dy / length;
        const perpY = dx / length;
        
        // Four corners of the line with round caps
        const offsetX = perpX * radius;
        const offsetY = perpY * radius;
        
        bounds = [
          [x1 + offsetX, y1 + offsetY],
          [x1 - offsetX, y1 - offsetY],
          [x2 + offsetX, y2 + offsetY],
          [x2 - offsetX, y2 - offsetY],
        ];
      }
      
      this._pushCommand(
        (ctx) => {
          ctx.fillStyle = numberToRgba(
            this._object._fillColor,
            this._object._fillOpacity
          );
          ctx.strokeStyle = ctx.fillStyle;
          ctx.lineWidth = thickness;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        },
        bounds
      );
    }

    drawLineV2(x1: float, y1: float, x2: float, y2: float, thickness: float) {
      // Calculate proper bounds for a line with round caps
      const dx = x2 - x1;
      const dy = y2 - y1;
      const length = Math.sqrt(dx * dx + dy * dy);
      const radius = thickness / 2;
      
      let bounds: FloatPoint[];
      if (length === 0) {
        // Point - just a circle
        bounds = [
          [x1 - radius, y1 - radius],
          [x1 + radius, y1 + radius],
        ];
      } else {
        // Normalized perpendicular vector
        const perpX = -dy / length;
        const perpY = dx / length;
        
        // Four corners of the line with round caps
        const offsetX = perpX * radius;
        const offsetY = perpY * radius;
        
        bounds = [
          [x1 + offsetX, y1 + offsetY],
          [x1 - offsetX, y1 - offsetY],
          [x2 + offsetX, y2 + offsetY],
          [x2 - offsetX, y2 - offsetY],
        ];
      }
      
      this._pushCommand(
        (ctx) => {
          ctx.strokeStyle = numberToRgba(
            this._object._outlineColor,
            this._object._outlineOpacity
          );
          ctx.lineWidth = thickness;
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.lineTo(x2, y2);
          ctx.stroke();
        },
        bounds
      );
    }

    drawEllipse(x1: float, y1: float, width: float, height: float) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          ctx.beginPath();
          ctx.ellipse(x1, y1, width / 2, height / 2, 0, 0, Math.PI * 2);
          ctx.fill();
          if (this._object._outlineSize > 0) ctx.stroke();
        },
        [
          [x1 - width / 2, y1 - height / 2],
          [x1 + width / 2, y1 + height / 2],
        ]
      );
    }

    drawRoundedRectangle(
      x1: float,
      y1: float,
      x2: float,
      y2: float,
      radius: float
    ) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          const width = x2 - x1;
          const height = y2 - y1;
          ctx.beginPath();
          ctx.roundRect(x1, y1, width, height, radius);
          ctx.fill();
          if (this._object._outlineSize > 0) ctx.stroke();
        },
        [
          [x1, y1],
          [x2, y2],
        ]
      );
    }

    drawFilletRectangle(
      x1: float,
      y1: float,
      x2: float,
      y2: float,
      fillet: float
    ) {
      this.drawRoundedRectangle(x1, y1, x2, y2, fillet);
    }

    drawChamferRectangle(
      x1: float,
      y1: float,
      x2: float,
      y2: float,
      chamfer: float
    ) {
      this.drawRoundedRectangle(x1, y1, x2, y2, chamfer);
    }

    drawTorus(
      x1: float,
      y1: float,
      innerRadius: float,
      outerRadius: float,
      startArc: float,
      endArc: float
    ) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          ctx.beginPath();
          ctx.arc(
            x1,
            y1,
            outerRadius,
            gdjs.toRad(startArc),
            gdjs.toRad(endArc || 360)
          );
          ctx.arc(
            x1,
            y1,
            innerRadius,
            gdjs.toRad(endArc || 360),
            gdjs.toRad(startArc),
            true
          );
          ctx.closePath();
          ctx.fill();
          if (this._object._outlineSize > 0) ctx.stroke();
        },
        [
          [x1 - outerRadius, y1 - outerRadius],
          [x1 + outerRadius, y1 + outerRadius],
        ]
      );
    }

    drawRegularPolygon(
      x1: float,
      y1: float,
      sides: float,
      radius: float,
      rotation: float
    ) {
      this.drawStar(x1, y1, sides, radius, radius, rotation);
    }

    drawStar(
      x1: float,
      y1: float,
      points: float,
      radius: float,
      innerRadius: float,
      rotation: float
    ) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          ctx.beginPath();
          const count = Math.max(2, Math.floor(points));
          const start = gdjs.toRad(rotation || 0);
          for (let i = 0; i < count * 2; i++) {
            const currentRadius =
              i % 2 === 0 ? radius : innerRadius || radius / 2;
            const angle = start + (Math.PI * i) / count;
            const px = x1 + Math.cos(angle) * currentRadius;
            const py = y1 + Math.sin(angle) * currentRadius;
            if (i === 0) ctx.moveTo(px, py);
            else ctx.lineTo(px, py);
          }
          ctx.closePath();
          ctx.fill();
          if (this._object._outlineSize > 0) ctx.stroke();
        },
        [
          [x1 - radius, y1 - radius],
          [x1 + radius, y1 + radius],
        ]
      );
    }

    drawArc(
      x1: float,
      y1: float,
      radius: float,
      startAngle: float,
      endAngle: float,
      anticlockwise: boolean,
      closePath: boolean
    ) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          ctx.beginPath();
          ctx.moveTo(
            x1 + radius * Math.cos(gdjs.toRad(startAngle)),
            y1 + radius * Math.sin(gdjs.toRad(startAngle))
          );
          ctx.arc(
            x1,
            y1,
            radius,
            gdjs.toRad(startAngle),
            gdjs.toRad(endAngle),
            !!anticlockwise
          );
          if (closePath) ctx.closePath();
          ctx.fill();
          if (this._object._outlineSize > 0) ctx.stroke();
        },
        [
          [x1 - radius, y1 - radius],
          [x1 + radius, y1 + radius],
        ]
      );
    }

    drawBezierCurve(
      x1: float,
      y1: float,
      cpX: float,
      cpY: float,
      cpX2: float,
      cpY2: float,
      x2: float,
      y2: float
    ) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.bezierCurveTo(cpX, cpY, cpX2, cpY2, x2, y2);
          ctx.stroke();
        },
        [
          [Math.min(x1, cpX, cpX2, x2), Math.min(y1, cpY, cpY2, y2)],
          [Math.max(x1, cpX, cpX2, x2), Math.max(y1, cpY, cpY2, y2)],
        ]
      );
    }

    drawQuadraticCurve(
      x1: float,
      y1: float,
      cpX: float,
      cpY: float,
      x2: float,
      y2: float
    ) {
      this._pushCommand(
        (ctx) => {
          this._applyOutline(ctx);
          ctx.beginPath();
          ctx.moveTo(x1, y1);
          ctx.quadraticCurveTo(cpX, cpY, x2, y2);
          ctx.stroke();
        },
        [
          [Math.min(x1, cpX, x2), Math.min(y1, cpY, y2)],
          [Math.max(x1, cpX, x2), Math.max(y1, cpY, y2)],
        ]
      );
    }

    beginFillPath() {
      this._pathOpen = true;
      this._commands.push((ctx) => {
        this._applyOutline(ctx);
        ctx.beginPath();
      });
    }

    endFillPath() {
      if (!this._pathOpen) return;
      this._pathOpen = false;
      this._commands.push((ctx) => {
        ctx.fill();
        if (this._object._outlineSize > 0) ctx.stroke();
      });
      this._rerender();
    }

    drawPathMoveTo(x1: float, y1: float) {
      this._commands.push((ctx) => ctx.moveTo(x1, y1));
      this._rerender();
    }

    drawPathLineTo(x1: float, y1: float) {
      this._commands.push((ctx) => ctx.lineTo(x1, y1));
      this._pushCommand(() => {}, [[x1, y1]]);
    }

    drawPathBezierCurveTo(
      cpX: float,
      cpY: float,
      cpX2: float,
      cpY2: float,
      toX: float,
      toY: float
    ) {
      this._commands.push((ctx) =>
        ctx.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY)
      );
      this._pushCommand(() => {}, [
        [cpX, cpY],
        [cpX2, cpY2],
        [toX, toY],
      ]);
    }

    drawPathArc(
      x1: float,
      y1: float,
      radius: float,
      startAngle: float,
      endAngle: float,
      anticlockwise: boolean
    ) {
      this._commands.push((ctx) =>
        ctx.arc(
          x1,
          y1,
          radius,
          gdjs.toRad(startAngle),
          gdjs.toRad(endAngle),
          !!anticlockwise
        )
      );
      this._pushCommand(() => {}, [
        [x1 - radius, y1 - radius],
        [x1 + radius, y1 + radius],
      ]);
    }

    drawPathQuadraticCurveTo(cpX: float, cpY: float, toX: float, toY: float) {
      this._commands.push((ctx) => ctx.quadraticCurveTo(cpX, cpY, toX, toY));
      this._pushCommand(() => {}, [
        [cpX, cpY],
        [toX, toY],
      ]);
    }

    closePath() {
      this._commands.push((ctx) => ctx.closePath());
      this._rerender();
    }

    invalidateBounds() {
      this._object.invalidateBounds();
      this._positionXIsUpToDate = false;
      this._positionYIsUpToDate = false;
      this._transformationIsUpToDate = false;
    }

    updatePreRender(): void {
      this.updatePositionIfNeeded();
      const game = this._object.getRuntimeScene().getGame();
      if (game.isInGameEdition() && this._commands.length === 0) {
        if (!this._placeholder) {
          this._placeholderTexture = game
            .getImageManager()
            .getThreeTexture('InGameEditor-ShapePainterIcon');
          this._placeholderMaterial = new THREE.SpriteMaterial({
            map: this._placeholderTexture,
            transparent: true,
            depthTest: false,
            depthWrite: false,
          });
          this._placeholder = new THREE.Sprite(this._placeholderMaterial);
          this._sprite.add(this._placeholder);
        }
      } else if (this._placeholder) {
        this._sprite.remove(this._placeholder);
        this._placeholderMaterial?.dispose();
        this._placeholder = null;
        this._placeholderMaterial = null;
        this._placeholderTexture = null;
      }
    }

    updatePositionX(): void {
      if (this._object._useAbsoluteCoordinates) {
        this._sprite.center.x = 0;
        this._sprite.position.x = 0;
      } else {
        this._sprite.position.x =
          this.getDrawableX() + this.getFrameRelativeOriginX();
      }
      this._transformationIsUpToDate = false;
    }

    updatePositionY(): void {
      if (this._object._useAbsoluteCoordinates) {
        this._sprite.center.y = 1;
        this._sprite.position.y = 0;
      } else {
        this._sprite.position.y =
          this.getDrawableY() + this.getFrameRelativeOriginY();
      }
      this._transformationIsUpToDate = false;
    }

    updatePositionIfNeeded() {
      if (!this._positionXIsUpToDate) {
        this.updatePositionX();
        this._positionXIsUpToDate = true;
      }
      if (!this._positionYIsUpToDate) {
        this.updatePositionY();
        this._positionYIsUpToDate = true;
      }
    }

    updateRotationCenter(): void {
      this._positionXIsUpToDate = false;
      this._positionYIsUpToDate = false;
      this._transformationIsUpToDate = false;
    }

    updateAngle(): void {
      this._material.rotation = this._object._useAbsoluteCoordinates
        ? 0
        : gdjs.toRad(this._object.angle);
      this._transformationIsUpToDate = false;
    }

    updateScaleX(): void {
      this._sprite.scale.x = this._object._useAbsoluteCoordinates
        ? this._canvas.width
        : this._canvas.width * this._object._scaleX;
      this._positionXIsUpToDate = false;
      this._transformationIsUpToDate = false;
    }

    updateScaleY(): void {
      this._sprite.scale.y = this._object._useAbsoluteCoordinates
        ? this._canvas.height
        : this._canvas.height * this._object._scaleY;
      this._positionYIsUpToDate = false;
      this._transformationIsUpToDate = false;
    }

    getDrawableX(): float {
      if (this._object._useAbsoluteCoordinates) {
        return this._localBounds.left;
      }
      let localBound = this._localBounds.left;
      if (this._object._flippedX) {
        const rotationCenterX = this._object.getRotationCenterX();
        localBound = 2 * rotationCenterX - localBound;
      }
      return this._object.getX() + localBound * Math.abs(this._object._scaleX);
    }

    getDrawableY(): float {
      if (this._object._useAbsoluteCoordinates) {
        return this._localBounds.top;
      }
      let localBound = this._localBounds.top;
      if (this._object._flippedY) {
        const rotationCenterY = this._object.getRotationCenterY();
        localBound = 2 * rotationCenterY - localBound;
      }
      return this._object.getY() + localBound * Math.abs(this._object._scaleY);
    }

    getWidth(): float {
      return this._localBounds.width * Math.abs(this._object._scaleX);
    }

    getHeight(): float {
      return this._localBounds.height * Math.abs(this._object._scaleY);
    }

    getUnscaledWidth(): float {
      return this._localBounds.width;
    }

    getUnscaledHeight(): float {
      return this._localBounds.height;
    }

    getFrameRelativeOriginX() {
      return -this._localBounds.left + this._getPadding();
    }

    getFrameRelativeOriginY() {
      return -this._localBounds.top + this._getPadding();
    }

    transformToDrawing(point: FloatPoint): FloatPoint {
      this._ensureTransformUpToDate();
      const vector = new THREE.Vector3(point[0], point[1], 0).applyMatrix4(
        this._inverseMatrix
      );
      point[0] = vector.x;
      point[1] = vector.y;
      return point;
    }

    transformToScene(point: FloatPoint): FloatPoint {
      this._ensureTransformUpToDate();
      const vector = new THREE.Vector3(point[0], point[1], 0).applyMatrix4(
        this._matrix
      );
      point[0] = vector.x;
      point[1] = vector.y;
      return point;
    }

    updateAntialiasing(): void {
      this._texture.minFilter =
        this._object.getAntialiasing() === 'none'
          ? THREE.NearestFilter
          : THREE.LinearFilter;
      this._texture.magFilter =
        this._object.getAntialiasing() === 'none'
          ? THREE.NearestFilter
          : THREE.LinearFilter;
      this._texture.needsUpdate = true;
    }

    destroy(): void {
      this._material.dispose();
      this._texture.dispose();
      this._placeholderMaterial?.dispose();
    }
  }
}
