namespace gdjs {
  /**
   * A renderer for debug instances location of a container.
   *
   * @see gdjs.CustomRuntimeObject2DRenderer
   * @category Debugging > Debugger Renderer
   */
  export class DebuggerRendererImpl {
    _instanceContainer: gdjs.RuntimeInstanceContainer;
    _debugCanvas: HTMLCanvasElement | null = null;
    _debugContext: CanvasRenderingContext2D | null = null;

    constructor(instanceContainer: gdjs.RuntimeInstanceContainer) {
      this._instanceContainer = instanceContainer;
    }

    getRendererObject() {
      return this._debugCanvas;
    }

    private _ensureCanvas(): CanvasRenderingContext2D | null {
      if (this._debugContext && this._debugCanvas) {
        return this._debugContext;
      }

      const domContainer = this._instanceContainer
        .getGame()
        .getRenderer()
        .getDomElementContainer();
      if (!domContainer) {
        return null;
      }

      const canvas = document.createElement('canvas');
      canvas.style.position = 'absolute';
      canvas.style.left = '0';
      canvas.style.top = '0';
      canvas.style.width = '100%';
      canvas.style.height = '100%';
      canvas.style.pointerEvents = 'none';
      canvas.style.zIndex = '9999';

      const context = canvas.getContext('2d');
      if (!context) {
        return null;
      }

      domContainer.appendChild(canvas);
      this._debugCanvas = canvas;
      this._debugContext = context;
      return context;
    }

    private _syncCanvasSize(): void {
      if (!this._debugCanvas) {
        return;
      }

      const domContainer = this._instanceContainer
        .getGame()
        .getRenderer()
        .getDomElementContainer();
      if (!domContainer) {
        return;
      }

      const width = Math.max(1, domContainer.clientWidth);
      const height = Math.max(1, domContainer.clientHeight);
      if (
        this._debugCanvas.width !== width ||
        this._debugCanvas.height !== height
      ) {
        this._debugCanvas.width = width;
        this._debugCanvas.height = height;
      }
    }

    private _drawPointLabel(
      context: CanvasRenderingContext2D,
      name: string,
      color: string,
      x: number,
      y: number,
      showPointsNames: boolean
    ): void {
      context.fillStyle = color;
      context.beginPath();
      context.arc(x, y, 3, 0, Math.PI * 2);
      context.fill();

      if (!showPointsNames) {
        return;
      }

      context.font = '12px sans-serif';
      context.fillStyle = color;
      context.fillText(name, x + 4, y - 4);
    }

    /**
     * Render graphics for debugging purpose. Activate this in `gdjs.RuntimeScene`,
     * in the `renderAndStep` method.
     * @see gdjs.RuntimeInstanceContainer#enableDebugDraw
     */
    renderDebugDraw(
      instances: gdjs.RuntimeObject[],
      showHiddenInstances: boolean,
      showPointsNames: boolean,
      showCustomPoints: boolean
    ) {
      const context = this._ensureCanvas();
      if (!context) {
        return;
      }

      this._syncCanvasSize();
      context.clearRect(0, 0, context.canvas.width, context.canvas.height);
      context.globalAlpha = 0.8;

      const workingPoint: FloatPoint = [0, 0];

      for (let i = 0; i < instances.length; i++) {
        const object = instances[i];
        const layer = this._instanceContainer.getLayer(object.getLayer());

        if (
          (!object.isVisible() || !layer.isVisible()) &&
          !showHiddenInstances
        ) {
          continue;
        }

        const rendererObject = object.getRendererObject();
        if (!rendererObject) {
          continue;
        }

        const aabb = object.getAABB();
        const polygon: float[] = [];
        polygon.push.apply(
          polygon,
          layer.applyLayerTransformation(
            aabb.min[0],
            aabb.min[1],
            0,
            workingPoint
          )
        );
        polygon.push.apply(
          polygon,
          layer.applyLayerTransformation(
            aabb.max[0],
            aabb.min[1],
            0,
            workingPoint
          )
        );
        polygon.push.apply(
          polygon,
          layer.applyLayerTransformation(
            aabb.max[0],
            aabb.max[1],
            0,
            workingPoint
          )
        );
        polygon.push.apply(
          polygon,
          layer.applyLayerTransformation(
            aabb.min[0],
            aabb.max[1],
            0,
            workingPoint
          )
        );

        context.beginPath();
        context.moveTo(polygon[0], polygon[1]);
        for (let p = 2; p < polygon.length; p += 2) {
          context.lineTo(polygon[p], polygon[p + 1]);
        }
        context.closePath();
        context.fillStyle = 'rgba(119, 142, 232, 0.2)';
        context.strokeStyle = 'rgba(119, 142, 232, 1)';
        context.lineWidth = 2;
        context.fill();
        context.stroke();
      }

      for (let i = 0; i < instances.length; i++) {
        const object = instances[i];
        const layer = this._instanceContainer.getLayer(object.getLayer());

        if (
          (!object.isVisible() || !layer.isVisible()) &&
          !showHiddenInstances
        ) {
          continue;
        }

        const rendererObject = object.getRendererObject();
        if (!rendererObject) {
          continue;
        }

        const cameraX = layer.getCameraX();
        const cameraY = layer.getCameraY();
        let cameraHalfWidth = layer.getCameraWidth() / 2;
        let cameraHalfHeight = layer.getCameraHeight() / 2;
        if (layer.getCameraRotation() !== 0) {
          const hypot = cameraHalfWidth + cameraHalfHeight;
          cameraHalfWidth = hypot;
          cameraHalfHeight = hypot;
        }

        for (const hitBox of object.getHitBoxesAround(
          cameraX - cameraHalfWidth,
          cameraY - cameraHalfHeight,
          cameraX + cameraHalfWidth,
          cameraY + cameraHalfHeight
        )) {
          const polygon: float[] = [];
          hitBox.vertices.forEach((point) => {
            point = layer.applyLayerTransformation(
              point[0],
              point[1],
              0,
              workingPoint
            );
            polygon.push(point[0], point[1]);
          });

          if (polygon.length >= 2) {
            context.beginPath();
            context.moveTo(polygon[0], polygon[1]);
            for (let p = 2; p < polygon.length; p += 2) {
              context.lineTo(polygon[p], polygon[p + 1]);
            }
            context.closePath();
            context.strokeStyle = 'rgba(255, 0, 0, 0.5)';
            context.lineWidth = 1;
            context.stroke();
          }
        }

        const centerPoint = layer.applyLayerTransformation(
          object.getCenterXInScene(),
          object.getCenterYInScene(),
          0,
          workingPoint
        );
        this._drawPointLabel(
          context,
          'Center',
          '#ffff00',
          centerPoint[0],
          centerPoint[1],
          showPointsNames
        );

        const positionPoint = layer.applyLayerTransformation(
          object.getX(),
          object.getY(),
          0,
          workingPoint
        );
        this._drawPointLabel(
          context,
          'Position',
          '#ff0000',
          positionPoint[0],
          positionPoint[1],
          showPointsNames
        );

        if (object instanceof gdjs.SpriteRuntimeObject) {
          let originPoint = object.getPointPosition('origin');
          if (
            Math.abs(originPoint[0] - positionPoint[0]) >= 1 ||
            Math.abs(originPoint[1] - positionPoint[1]) >= 1
          ) {
            originPoint = layer.applyLayerTransformation(
              originPoint[0],
              originPoint[1],
              0,
              workingPoint
            );
            this._drawPointLabel(
              context,
              'Origin',
              '#ff0000',
              originPoint[0],
              originPoint[1],
              showPointsNames
            );
          }
        }

        if (showCustomPoints && object instanceof gdjs.SpriteRuntimeObject) {
          const animationFrame = object._animator.getCurrentFrame();
          if (!animationFrame) continue;

          for (const customPointName in animationFrame.points.items) {
            let customPoint = object.getPointPosition(customPointName);
            customPoint = layer.applyLayerTransformation(
              customPoint[0],
              customPoint[1],
              0,
              workingPoint
            );

            this._drawPointLabel(
              context,
              customPointName,
              '#0000ff',
              customPoint[0],
              customPoint[1],
              showPointsNames
            );
          }
        }
      }
    }

    clearDebugDraw(): void {
      if (this._debugContext) {
        this._debugContext.clearRect(
          0,
          0,
          this._debugContext.canvas.width,
          this._debugContext.canvas.height
        );
      }

      if (this._debugCanvas) {
        this._debugCanvas.parentNode?.removeChild(this._debugCanvas);
      }

      this._debugCanvas = null;
      this._debugContext = null;
    }
  }

  export type DebuggerRenderer = gdjs.DebuggerRendererImpl;
  export const DebuggerRenderer = gdjs.DebuggerRendererImpl;
}
