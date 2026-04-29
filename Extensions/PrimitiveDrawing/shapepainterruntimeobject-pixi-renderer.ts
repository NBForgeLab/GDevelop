namespace gdjs {
  /** @category Renderers > Shape Painter */
  class ShapePainterRuntimeObjectPixiRenderer {
    _object: gdjs.ShapePainterRuntimeObject;
    _rendererObject: PIXI.Container;
    _graphics: PIXI.Graphics;
    /**
     * Graphics positions can need updates when shapes are added,
     * this avoids to do it each time.
     */
    _positionXIsUpToDate = false;
    /**
     * Graphics positions can need updates when shapes are added,
     * this avoids to do it each time.
     */
    _positionYIsUpToDate = false;
    /**
     * This allows to use the transformation of the renderer
     * and compute it only when necessary.
     */
    _transformationIsUpToDate = false;

    _antialiasingFilter: null | PIXI.Filter = null;

    _placeholder: PIXI.Sprite | null = null;

    private static readonly _positionForTransformation: PIXI.PointData = {
      x: 0,
      y: 0,
    };

    constructor(
      runtimeObject: gdjs.ShapePainterRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._rendererObject = new PIXI.Container();
      this._graphics = new PIXI.Graphics();
      this._rendererObject.addChild(this._graphics);
      instanceContainer
        .getLayer('')
        .getRenderer()
        .addRendererObject(this._rendererObject, runtimeObject.getZOrder());
      this.updateAntialiasing();
    }

    getRendererObject() {
      return this._rendererObject;
    }

    clear() {
      this._graphics.clear();
      this.invalidateBounds();
    }

    private _getFillStyle() {
      return {
        color: this._object._fillColor,
        alpha: this._object._fillOpacity / 255,
      };
    }

    private _fillAndStrokeCurrentPath(): void {
      this._graphics.fill(this._getFillStyle());
      this.updateOutline();
    }

    drawRectangle(x1: float, y1: float, x2: float, y2: float) {
      this._graphics.rect(x1, y1, x2 - x1, y2 - y1);
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawCircle(x: float, y: float, radius: float) {
      this._graphics.circle(x, y, radius);
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawLine(x1: float, y1: float, x2: float, y2: float, thickness: float) {
      if (y2 === y1) {
        this._graphics
          .rect(x1, y1 - thickness / 2, x2 - x1, thickness)
          .fill(this._getFillStyle());
      } else {
        const angle = Math.atan2(y2 - y1, x2 - x1);
        const xIncrement = Math.sin(angle) * thickness;
        const yIncrement = Math.cos(angle) * thickness;
        this._graphics
          .poly([
            x1 + xIncrement,
            y1 - yIncrement,
            x1 - xIncrement,
            y1 + yIncrement,
            x2 - xIncrement,
            y2 + yIncrement,
            x2 + xIncrement,
            y2 - yIncrement,
          ])
          .fill(this._getFillStyle());
      }
      this.invalidateBounds();
    }

    drawLineV2(x1: float, y1: float, x2: float, y2: float, thickness: float) {
      this._graphics
        .beginPath()
        .moveTo(x1, y1)
        .lineTo(x2, y2)
        .stroke({
          width: thickness,
          color: this._object._outlineColor,
          alpha: this._object._outlineOpacity / 255,
        });
      this.invalidateBounds();
    }

    drawEllipse(x1: float, y1: float, width: float, height: float) {
      this._graphics.ellipse(x1, y1, width / 2, height / 2);
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawRoundedRectangle(
      x1: float,
      y1: float,
      x2: float,
      y2: float,
      radius: float
    ) {
      this._graphics.roundRect(x1, y1, x2 - x1, y2 - y1, radius);
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawFilletRectangle(
      x1: float,
      y1: float,
      x2: float,
      y2: float,
      fillet: float
    ) {
      this._graphics.filletRect(x1, y1, x2 - x1, y2 - y1, fillet);
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawChamferRectangle(
      x1: float,
      y1: float,
      x2: float,
      y2: float,
      chamfer: float
    ) {
      this._graphics.chamferRect(x1, y1, x2 - x1, y2 - y1, chamfer);
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawTorus(
      x1: float,
      y1: float,
      innerRadius: float,
      outerRadius: float,
      startArc: float,
      endArc: float
    ) {
      const startArcInRadians = startArc ? gdjs.toRad(startArc) : 0;
      const endArcInRadians = endArc ? gdjs.toRad(endArc) : Math.PI * 2;

      if (Math.abs(endArcInRadians - startArcInRadians) >= Math.PI * 2) {
        this._graphics.circle(x1, y1, outerRadius).fill(this._getFillStyle());
        this._graphics.circle(x1, y1, innerRadius).cut();
        this._graphics.beginPath().circle(x1, y1, outerRadius);
        this.updateOutline();
        this._graphics.beginPath().circle(x1, y1, innerRadius);
        this.updateOutline();
      } else {
        this._graphics
          .beginPath()
          .arc(x1, y1, innerRadius, endArcInRadians, startArcInRadians, true)
          .lineTo(
            x1 + outerRadius * Math.cos(startArcInRadians),
            y1 + outerRadius * Math.sin(startArcInRadians)
          )
          .arc(x1, y1, outerRadius, startArcInRadians, endArcInRadians, false)
          .closePath();
        this._fillAndStrokeCurrentPath();
      }
      this.invalidateBounds();
    }

    drawRegularPolygon(
      x1: float,
      y1: float,
      sides: float,
      radius: float,
      rotation: float
    ) {
      this._graphics.regularPoly(
        x1,
        y1,
        radius,
        sides,
        rotation ? gdjs.toRad(rotation) : 0
      );
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawStar(
      x1: float,
      y1: float,
      points: float,
      radius: float,
      innerRadius: float,
      rotation: float
    ) {
      this._graphics.star(
        x1,
        y1,
        points,
        radius,
        innerRadius ? innerRadius : radius / 2,
        rotation ? gdjs.toRad(rotation) : 0
      );
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
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
      this._graphics
        .beginPath()
        .moveTo(
          x1 + radius * Math.cos(gdjs.toRad(startAngle)),
          y1 + radius * Math.sin(gdjs.toRad(startAngle))
        )
        .arc(
          x1,
          y1,
          radius,
          gdjs.toRad(startAngle),
          gdjs.toRad(endAngle),
          anticlockwise ? true : false
        );
      if (closePath) {
        this._graphics.closePath();
      }
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
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
      this._graphics
        .beginPath()
        .moveTo(x1, y1)
        .bezierCurveTo(cpX, cpY, cpX2, cpY2, x2, y2);
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawQuadraticCurve(
      x1: float,
      y1: float,
      cpX: float,
      cpY: float,
      x2: float,
      y2: float
    ) {
      this._graphics
        .beginPath()
        .moveTo(x1, y1)
        .quadraticCurveTo(cpX, cpY, x2, y2);
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    beginFillPath() {
      this._graphics.beginPath();
    }

    endFillPath() {
      this._fillAndStrokeCurrentPath();
      this.invalidateBounds();
    }

    drawPathMoveTo(x1: float, y1: float) {
      this._graphics.moveTo(x1, y1);
    }

    drawPathLineTo(x1: float, y1: float) {
      this._graphics.lineTo(x1, y1);
      this.invalidateBounds();
    }

    drawPathBezierCurveTo(
      cpX: float,
      cpY: float,
      cpX2: float,
      cpY2: float,
      toX: float,
      toY: float
    ) {
      this._graphics.bezierCurveTo(cpX, cpY, cpX2, cpY2, toX, toY);
      this.invalidateBounds();
    }

    drawPathArc(
      x1: float,
      y1: float,
      radius: float,
      startAngle: float,
      endAngle: float,
      anticlockwise: boolean
    ) {
      this._graphics.arc(
        x1,
        y1,
        radius,
        gdjs.toRad(startAngle),
        gdjs.toRad(endAngle),
        anticlockwise ? true : false
      );
      this.invalidateBounds();
    }

    drawPathQuadraticCurveTo(cpX: float, cpY: float, toX: float, toY: float) {
      this._graphics.quadraticCurveTo(cpX, cpY, toX, toY);
      this.invalidateBounds();
    }

    closePath() {
      this._graphics.closePath();
      this.invalidateBounds();
    }

    updateOutline(): void {
      if (this._object._outlineSize <= 0 || this._object._outlineOpacity <= 0) {
        return;
      }
      this._graphics.stroke({
        width: this._object._outlineSize,
        color: this._object._outlineColor,
        alpha: this._object._outlineOpacity / 255,
      });
    }

    invalidateBounds() {
      this._object.invalidateBounds();
      this._positionXIsUpToDate = false;
      this._positionYIsUpToDate = false;
    }

    updatePreRender(): void {
      this.updatePositionIfNeeded();

      const game = this._object.getRuntimeScene().getGame();
      if (
        game.isInGameEdition() &&
        this._graphics.context.instructions.length === 0
      ) {
        if (!this._placeholder) {
          const texture = game
            .getImageManager()
            .getPIXITexture('InGameEditor-ShapePainterIcon');
          this._placeholder = new PIXI.Sprite({ texture });
          this._rendererObject.addChild(this._placeholder);
        }
        this._placeholder.position.copyFrom(this._graphics.position);
        this._placeholder.pivot.copyFrom(this._graphics.pivot);
        this._placeholder.scale.copyFrom(this._graphics.scale);
        this._placeholder.angle = this._graphics.angle;
      } else if (this._placeholder) {
        this._placeholder.removeFromParent();
        this._placeholder.destroy();
        this._placeholder = null;
      }
    }

    updatePositionX(): void {
      if (this._object._useAbsoluteCoordinates) {
        this._graphics.pivot.x = 0;
        this._graphics.position.x = 0;
      } else {
        // Make the drawing rotate around the rotation center.
        this._graphics.pivot.x = this._object.getRotationCenterX();
        // Multiply by the scale to have the scale anchor
        // at the object position instead of the center.
        this._graphics.position.x =
          this._object.x +
          this._graphics.pivot.x * Math.abs(this._graphics.scale.x);
      }
      this._transformationIsUpToDate = false;
    }

    updatePositionY(): void {
      if (this._object._useAbsoluteCoordinates) {
        this._graphics.pivot.y = 0;
        this._graphics.position.y = 0;
      } else {
        this._graphics.pivot.y = this._object.getRotationCenterY();
        this._graphics.position.y =
          this._object.y +
          this._graphics.pivot.y * Math.abs(this._graphics.scale.y);
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

    updateTransformationIfNeeded() {
      if (!this._transformationIsUpToDate) {
        this.updatePositionIfNeeded();
        this._graphics.updateLocalTransform();
      }
      this._transformationIsUpToDate = true;
    }

    updateRotationCenter(): void {
      // The pivot and position depends on the rotation center point.
      this._positionXIsUpToDate = false;
      this._positionYIsUpToDate = false;
      // The whole transformation changes based on the rotation center point.
      this._transformationIsUpToDate = false;
    }

    updateAngle(): void {
      if (this._object._useAbsoluteCoordinates) {
        this._graphics.angle = 0;
      } else {
        this._graphics.angle = this._object.angle;
      }
      this._transformationIsUpToDate = false;
    }

    updateScaleX(): void {
      if (this._object._useAbsoluteCoordinates) {
        this._graphics.scale.x = 1;
      } else {
        this._graphics.scale.x = this._object._scaleX;
      }
      // updatePositionX() uses scale.x
      this._positionXIsUpToDate = false;
      this._transformationIsUpToDate = false;
    }

    updateScaleY(): void {
      if (this._object._useAbsoluteCoordinates) {
        this._graphics.scale.y = 1;
      } else {
        this._graphics.scale.y = this._object._scaleY;
      }
      // updatePositionY() uses scale.y
      this._positionYIsUpToDate = false;
      this._transformationIsUpToDate = false;
    }

    getDrawableX(): float {
      if (this._object._useAbsoluteCoordinates) {
        return this._graphics.getLocalBounds().left;
      }
      let localBound = this._graphics.getLocalBounds().left;
      if (this._object._flippedX) {
        const rotationCenterX = this._object.getRotationCenterX();
        localBound = 2 * rotationCenterX - localBound;
      }
      // When new shape are drawn, the bounds of the object can extend.
      // The object position stays the same but (drawableX; drawableY) can change.
      return (
        this._object.getX() + localBound * Math.abs(this._graphics.scale.x)
      );
    }

    getDrawableY(): float {
      if (this._object._useAbsoluteCoordinates) {
        return this._graphics.getLocalBounds().top;
      }
      let localBound = this._graphics.getLocalBounds().top;
      if (this._object._flippedY) {
        const rotationCenterY = this._object.getRotationCenterY();
        localBound = 2 * rotationCenterY - localBound;
      }
      return (
        this._object.getY() + localBound * Math.abs(this._graphics.scale.y)
      );
    }

    getWidth(): float {
      return this._graphics.width;
    }

    getHeight(): float {
      return this._graphics.height;
    }

    getUnscaledWidth(): float {
      return this._graphics.getLocalBounds().width;
    }

    getUnscaledHeight(): float {
      return this._graphics.getLocalBounds().height;
    }

    /**
     * @returns The drawing origin relatively to the drawable top left corner.
     */
    getFrameRelativeOriginX() {
      return -this._graphics.getLocalBounds().left;
    }

    /**
     * @returns The drawing origin relatively to the drawable top left corner.
     */
    getFrameRelativeOriginY() {
      return -this._graphics.getLocalBounds().top;
    }

    transformToDrawing(point: FloatPoint): FloatPoint {
      this.updateTransformationIfNeeded();
      const position =
        ShapePainterRuntimeObjectPixiRenderer._positionForTransformation;
      position.x = point[0];
      position.y = point[1];
      this._graphics.localTransform.applyInverse(position, position);
      point[0] = position.x;
      point[1] = position.y;
      return point;
    }

    transformToScene(point: FloatPoint): FloatPoint {
      this.updateTransformationIfNeeded();
      const position =
        ShapePainterRuntimeObjectPixiRenderer._positionForTransformation;
      position.x = point[0];
      position.y = point[1];
      this._graphics.localTransform.apply(position, position);
      point[0] = position.x;
      point[1] = position.y;
      return point;
    }

    updateAntialiasing(): void {
      if (this._object.getAntialiasing() !== 'none') {
        if (!this._antialiasingFilter) {
          this._antialiasingFilter = new PIXI.PassthroughFilter();
        }

        const antialiasingFilter = this._antialiasingFilter;
        antialiasingFilter.enabled = true;
        antialiasingFilter.antialias = 'on';

        const filters = this._graphics.filters
          ? [...this._graphics.filters]
          : [];
        // Do not apply the filter if it is already present on the object.
        if (filters.indexOf(antialiasingFilter) === -1) {
          this._graphics.filters = [...filters, antialiasingFilter];
        }
      } else if (this._antialiasingFilter !== null) {
        if (!this._graphics.filters) {
          return;
        }
        const antialiasingFilter = this._antialiasingFilter;
        const antialiasingFilterIndex =
          this._graphics.filters.indexOf(antialiasingFilter);

        if (antialiasingFilterIndex !== -1) {
          this._graphics.filters = this._graphics.filters.filter(
            (filter) => filter !== antialiasingFilter
          );
        }
      }
    }

    destroy(): void {
      this._rendererObject.destroy({ children: true });
      this._placeholder = null;
    }
  }

  /** @category Renderers > Shape Painter */
  export const ShapePainterRuntimeObjectRenderer =
    ShapePainterRuntimeObjectPixiRenderer;
  /** @category Renderers > Shape Painter */
  export type ShapePainterRuntimeObjectRenderer =
    ShapePainterRuntimeObjectPixiRenderer;
}
