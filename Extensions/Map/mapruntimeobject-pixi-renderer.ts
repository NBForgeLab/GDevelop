namespace gdjs {
  export class MapRuntimeObjectPixiRenderer {
    _object: gdjs.MapRuntimeObject;
    _instanceContainer: gdjs.RuntimeInstanceContainer;
    _canvas: HTMLCanvasElement;
    _context: CanvasRenderingContext2D;
    _texture: PIXI.Texture;
    _sprite: PIXI.Sprite;

    constructor(
      runtimeObject: gdjs.MapRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._instanceContainer = instanceContainer;
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

      this.update();
      this.updateVisibility();
    }

    getRendererObject() {
      return this._sprite;
    }

    destroy(): void {
      this._sprite.destroy();
      this._texture.destroy(true);
    }

    update(): void {
      this.updatePosition();
      this.render();
    }

    updatePosition(): void {
      this._sprite.position.set(this._object.getX(), this._object.getY());
      this._sprite.zIndex = this._object.getZOrder();
    }

    updateVisibility(): void {
      this._sprite.visible = this._object.isVisible();
    }

    render(): void {
      const width = Math.max(1, Math.ceil(this._object.getWidth()));
      const height = Math.max(1, Math.ceil(this._object.getHeight()));
      if (this._canvas.width !== width || this._canvas.height !== height) {
        this._canvas.width = width;
        this._canvas.height = height;
        this._sprite.width = width;
        this._sprite.height = height;
      }

      const context = this._context;
      context.clearRect(0, 0, width, height);
      const [r, g, b] = this._object
        .getBackgroundColor()
        .split(';')
        .map((c) => parseInt(c, 10) || 0);
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${this._object.getBackgroundOpacity()})`;
      if (this._object.getShape() === 'Circle') {
        context.beginPath();
        context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
        context.fill();
      } else {
        context.fillRect(0, 0, width, height);
      }

      const trackedObjects = this._object.getTrackedObjects();
      for (const obj of trackedObjects) {
        const behavior = this._object._getMapMarkerBehavior(obj);
        if (!behavior || typeof behavior.getMarkerType !== 'function') {
          continue;
        }

        const [mapX, mapY] = this._object.worldToMap(
          obj.getCenterXInScene(),
          obj.getCenterYInScene()
        );
        let color = this._object.getPlayerColor();
        let size = this._object.getPlayerSize();
        const markerType = behavior.getMarkerType();
        if (markerType === 'Enemy') {
          color = this._object.getEnemyColor();
          size = this._object.getEnemySize();
        } else if (markerType === 'Item') {
          color = this._object.getItemColor();
          size = this._object.getItemSize();
        } else if (markerType === 'Obstacle') {
          color = this._object.getObstacleColor();
          size = 4;
        }
        const [mr, mg, mb] = color.split(';').map((c) => parseInt(c, 10) || 0);
        context.fillStyle = `rgb(${mr}, ${mg}, ${mb})`;
        context.beginPath();
        context.arc(mapX, mapY, Math.max(2, size / 2), 0, Math.PI * 2);
        context.fill();
      }

      if (this._object.getBorderWidth() > 0) {
        const [br, bg, bb] = this._object
          .getBorderColor()
          .split(';')
          .map((c) => parseInt(c, 10) || 0);
        context.strokeStyle = `rgb(${br}, ${bg}, ${bb})`;
        context.lineWidth = this._object.getBorderWidth();
        if (this._object.getShape() === 'Circle') {
          context.beginPath();
          context.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
          context.stroke();
        } else {
          context.strokeRect(0, 0, width, height);
        }
      }

      this._texture.update();
    }
  }
}
