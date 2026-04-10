namespace gdjs {
  type MapCanvasImage =
    | HTMLImageElement
    | HTMLCanvasElement
    | ImageBitmap
    | SVGImageElement;

  type MapMarkerRenderCommand = {
    priority: number;
    draw: (context: CanvasRenderingContext2D) => void;
  };

  const clampChannel = (value: number) =>
    Math.max(0, Math.min(255, Math.round(value)));

  export class MapRuntimeObjectThreeRenderer {
    _object: gdjs.MapRuntimeObject;
    _instanceContainer: gdjs.RuntimeInstanceContainer;
    _imageManager: gdjs.ThreeTextureImageManager;
    _canvas: HTMLCanvasElement;
    _context: CanvasRenderingContext2D;
    _texture: THREE.CanvasTexture;
    _material: THREE.SpriteMaterial;
    _sprite: THREE.Sprite;
    _prevWorldPositions: Map<string, { x: number; y: number }> = new Map();
    _warnedImageFailures: Set<string> = new Set();

    constructor(
      runtimeObject: gdjs.MapRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._object = runtimeObject;
      this._instanceContainer = instanceContainer;
      this._imageManager =
        instanceContainer.getGame().getImageManager() as gdjs.ThreeTextureImageManager;
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
        .getLayer(runtimeObject.getLayer())
        .getRenderer()
        .addRendererObject(this._sprite, runtimeObject.getZOrder());

      this.update();
      this.updateVisibility();
    }

    getRendererObject(): THREE.Sprite {
      return this._sprite;
    }

    destroy(): void {
      this._instanceContainer
        .getLayer(this._object.getLayer())
        .getRenderer()
        .removeRendererObject(this._sprite);
      this._material.dispose();
      this._texture.dispose();
    }

    update(): void {
      this.updatePosition();
      this.render();
    }

    updatePosition(): void {
      this._sprite.position.x = this._object.getX();
      this._sprite.position.y = this._object.getY();
      this._sprite.position.z = this._object.getZOrder();
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
        this._sprite.scale.set(width, height, 1);
      }

      const context = this._context;
      context.clearRect(0, 0, width, height);

      context.save();
      this._drawMaskPath(context, width, height);
      context.clip();

      this._renderBackground(context, width, height);
      this._renderMarkers(context, width, height);
      this._renderFrame(context, width, height);

      context.restore();

      this._renderBorder(context, width, height);

      this._texture.needsUpdate = true;
    }

    _drawMaskPath(
      context: CanvasRenderingContext2D,
      width: number,
      height: number
    ): void {
      context.beginPath();
      if (this._object.getShape() === 'Circle') {
        context.arc(
          width / 2,
          height / 2,
          Math.min(width, height) / 2,
          0,
          Math.PI * 2
        );
      } else {
        context.rect(0, 0, width, height);
      }
      context.closePath();
    }

    _renderBackground(
      context: CanvasRenderingContext2D,
      width: number,
      height: number
    ): void {
      const centerX = width / 2;
      const centerY = height / 2;
      const isMap = this._object.getMode() === 'Minimap';
      const rotation = isMap ? -this._getCameraAngle() - Math.PI / 2 : 0;

      context.save();
      if (isMap) {
        context.translate(centerX, centerY);
        context.rotate(rotation);
      }

      const backgroundImage = this._object.getBackgroundImage();
      if (backgroundImage) {
        const background = this._getResourceImage(backgroundImage);
        if (background) {
          context.globalAlpha = this._object.getBackgroundOpacity();
          if (isMap) {
            context.drawImage(background, -centerX, -centerY, width, height);
          } else {
            context.drawImage(background, 0, 0, width, height);
          }
          context.restore();
          return;
        }
      }

      const [r, g, b] = this._parseColorToRgb(this._object.getBackgroundColor());
      context.fillStyle = `rgba(${r}, ${g}, ${b}, ${this._object.getBackgroundOpacity()})`;
      context.beginPath();
      if (this._object.getShape() === 'Circle') {
        context.arc(
          isMap ? 0 : centerX,
          isMap ? 0 : centerY,
          Math.min(width, height) / 2,
          0,
          Math.PI * 2
        );
      } else if (isMap) {
        context.rect(-centerX, -centerY, width, height);
      } else {
        context.rect(0, 0, width, height);
      }
      context.fill();
      context.restore();
    }

    _renderMarkers(
      context: CanvasRenderingContext2D,
      width: number,
      height: number
    ): void {
      const centerX = width / 2;
      const centerY = height / 2;
      const isMap = this._object.getMode() === 'Minimap';
      const rotation = isMap ? -this._getCameraAngle() - Math.PI / 2 : 0;
      const commands: MapMarkerRenderCommand[] = [];

      for (const obj of this._object.getTrackedObjects()) {
        const markerBehavior = this._object._getMapMarkerBehavior(obj);
        if (!markerBehavior || typeof markerBehavior.getMarkerType !== 'function') {
          continue;
        }

        const command = this._buildMarkerCommand(
          obj,
          markerBehavior,
          centerX,
          centerY,
          isMap
        );
        if (command) {
          commands.push(command);
        }
      }

      commands.sort((a, b) => a.priority - b.priority);

      context.save();
      if (isMap) {
        context.translate(centerX, centerY);
        context.rotate(rotation);
      }
      for (const command of commands) {
        command.draw(context);
      }
      context.restore();
    }

    _buildMarkerCommand(
      obj: gdjs.RuntimeObject,
      markerBehavior: gdjs.MapMarkerRuntimeBehavior,
      centerX: number,
      centerY: number,
      isMap: boolean
    ): MapMarkerRenderCommand | null {
      const markerType = markerBehavior.getMarkerType();
      const worldX = obj.getCenterXInScene();
      const worldY = obj.getCenterYInScene();
      let [mapX, mapY] = this._object.worldToMap(worldX, worldY);

      if (isMap) {
        mapX -= centerX;
        mapY -= centerY;
      }

      let color = this._parseColor(this._object.getPlayerColor());
      let size = 8;
      let customIcon = '';
      let angleDeg = 0;
      const priority = this._getMarkerPriorityFromType(markerType);
      const showRotation =
        markerBehavior.getShowRotation() ||
        (isMap && markerType === 'Player');

      if (showRotation) {
        const maybeGetAngle = (obj as any).getAngle;
        if (typeof maybeGetAngle === 'function') {
          angleDeg = maybeGetAngle.call(obj);
        } else {
          const key = `${obj.name}_${obj.id}`;
          const previousPosition = this._prevWorldPositions.get(key);
          if (previousPosition) {
            const dx = worldX - previousPosition.x;
            const dy = worldY - previousPosition.y;
            if (dx !== 0 || dy !== 0) {
              angleDeg = (Math.atan2(dy, dx) * 180) / Math.PI;
            }
          }
          this._prevWorldPositions.set(key, { x: worldX, y: worldY });
        }
      }

      switch (markerType) {
        case 'Player':
          color = this._parseColor(
            markerBehavior.getCustomColor() || this._object.getPlayerColor()
          );
          size = this._object.getPlayerSize();
          customIcon =
            markerBehavior.getCustomIcon() || this._object.getPlayerMarkerImage();
          break;
        case 'Enemy':
          color = this._parseColor(
            markerBehavior.getCustomColor() || this._object.getEnemyColor()
          );
          size = this._object.getEnemySize();
          customIcon =
            markerBehavior.getCustomIcon() || this._object.getEnemyMarkerImage();
          break;
        case 'Ally':
          color = this._parseColor(markerBehavior.getCustomColor() || '0;128;255');
          size = this._object.getPlayerSize();
          customIcon = markerBehavior.getCustomIcon() || '';
          break;
        case 'Item':
          color = this._parseColor(
            markerBehavior.getCustomColor() || this._object.getItemColor()
          );
          size = this._object.getItemSize();
          customIcon =
            markerBehavior.getCustomIcon() || this._object.getItemMarkerImage();
          break;
        case 'Obstacle':
          if (!this._object.getShowObstacles()) {
            return null;
          }
          color = this._parseColor(
            markerBehavior.getCustomColor() || this._object.getObstacleColor()
          );
          if (this._object.getUseObjectShape()) {
            return {
              priority,
              draw: (markerContext) => {
                markerContext.fillStyle = this._numberToRgba(
                  color,
                  this._object.getObstacleOpacity()
                );
                markerContext.fillRect(
                  mapX - (obj.getWidth() * this._object.getZoom()) / 2,
                  mapY - (obj.getHeight() * this._object.getZoom()) / 2,
                  obj.getWidth() * this._object.getZoom(),
                  obj.getHeight() * this._object.getZoom()
                );
              },
            };
          }
          break;
        case 'Custom':
          color = this._parseColor(markerBehavior.getCustomColor() || '255;255;255');
          size = markerBehavior.getCustomSize() || 8;
          customIcon = markerBehavior.getCustomIcon() || '';
          break;
        default:
          color = this._parseColor(markerBehavior.getCustomColor() || '255;255;255');
          customIcon = markerBehavior.getCustomIcon() || '';
      }

      const customSize = markerBehavior.getCustomSize();
      if (customSize > 0) {
        size = customSize;
      }

      if (markerBehavior.isFlashing() && !markerBehavior.shouldShowFlash()) {
        return null;
      }

      if (customIcon) {
        return {
          priority,
          draw: (markerContext) =>
            this._drawCustomIcon(
              markerContext,
              mapX,
              mapY,
              size,
              customIcon,
              angleDeg,
              showRotation
            ),
        };
      }

      if (markerType === 'Player') {
        return {
          priority,
          draw: (markerContext) =>
            this._drawTriangleMarker(
              markerContext,
              mapX,
              mapY,
              size,
              color,
              angleDeg + 90
            ),
        };
      }

      if (markerType === 'Item') {
        return {
          priority,
          draw: (markerContext) =>
            this._drawStarMarker(markerContext, mapX, mapY, size, color),
        };
      }

      return {
        priority,
        draw: (markerContext) =>
          this._drawCircleMarker(markerContext, mapX, mapY, size, color),
      };
    }

    _drawCircleMarker(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: number
    ): void {
      context.fillStyle = this._numberToRgba(color, 1);
      context.beginPath();
      context.arc(x, y, size / 2, 0, Math.PI * 2);
      context.fill();
    }

    _drawTriangleMarker(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: number,
      angle: number
    ): void {
      const radians = (angle * Math.PI) / 180;
      const markerHeight = size;
      const markerWidth = size * 0.8;
      const points = [
        { x: 0, y: -markerHeight / 2 },
        { x: -markerWidth / 2, y: markerHeight / 2 },
        { x: markerWidth / 2, y: markerHeight / 2 },
      ];
      context.fillStyle = this._numberToRgba(color, 1);
      context.beginPath();
      for (let i = 0; i < points.length; i++) {
        const point = points[i];
        const rotatedX = x + point.x * Math.cos(radians) - point.y * Math.sin(radians);
        const rotatedY = y + point.x * Math.sin(radians) + point.y * Math.cos(radians);
        if (i === 0) {
          context.moveTo(rotatedX, rotatedY);
        } else {
          context.lineTo(rotatedX, rotatedY);
        }
      }
      context.closePath();
      context.fill();
    }

    _drawStarMarker(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      color: number
    ): void {
      const outerRadius = size / 2;
      const innerRadius = size / 4;
      context.fillStyle = this._numberToRgba(color, 1);
      context.beginPath();
      for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = (i * Math.PI) / 5 - Math.PI / 2;
        const pointX = x + Math.cos(angle) * radius;
        const pointY = y + Math.sin(angle) * radius;
        if (i === 0) {
          context.moveTo(pointX, pointY);
        } else {
          context.lineTo(pointX, pointY);
        }
      }
      context.closePath();
      context.fill();
    }

    _drawCustomIcon(
      context: CanvasRenderingContext2D,
      x: number,
      y: number,
      size: number,
      iconName: string,
      angleDeg: number,
      showRotation: boolean
    ): void {
      const image = this._getResourceImage(iconName);
      if (!image) {
        this._drawCircleMarker(context, x, y, size, 0xffffff);
        return;
      }

      context.save();
      context.translate(x, y);
      if (showRotation) {
        context.rotate(((angleDeg + 90) * Math.PI) / 180);
      }
      context.drawImage(image, -size / 2, -size / 2, size, size);
      context.restore();
    }

    _renderFrame(
      context: CanvasRenderingContext2D,
      width: number,
      height: number
    ): void {
      const frameImage = this._object.getFrameImage();
      if (!frameImage) {
        return;
      }

      const frame = this._getResourceImage(frameImage);
      if (!frame) {
        return;
      }

      context.drawImage(frame, 0, 0, width, height);
    }

    _renderBorder(
      context: CanvasRenderingContext2D,
      width: number,
      height: number
    ): void {
      const borderWidth = this._object.getBorderWidth();
      if (borderWidth <= 0) {
        return;
      }

      const [r, g, b] = this._parseColorToRgb(this._object.getBorderColor());
      const inset = borderWidth / 2;
      context.strokeStyle = `rgba(${r}, ${g}, ${b}, 1)`;
      context.lineWidth = borderWidth;
      context.beginPath();
      if (this._object.getShape() === 'Circle') {
        context.arc(
          width / 2,
          height / 2,
          Math.max(0, Math.min(width, height) / 2 - inset),
          0,
          Math.PI * 2
        );
      } else {
        context.rect(
          inset,
          inset,
          Math.max(0, width - borderWidth),
          Math.max(0, height - borderWidth)
        );
      }
      context.stroke();
    }

    _getResourceImage(resourceName: string): MapCanvasImage | null {
      try {
        const texture = this._imageManager.getThreeTexture(resourceName);
        const image = texture?.image as MapCanvasImage | undefined;
        if (image) {
          this._warnedImageFailures.delete(resourceName);
          return image;
        }
      } catch (error) {
        if (!this._warnedImageFailures.has(resourceName)) {
          this._warnedImageFailures.add(resourceName);
          console.warn(`Failed to load map image: ${resourceName}`, error);
        }
        return null;
      }

      if (!this._warnedImageFailures.has(resourceName)) {
        this._warnedImageFailures.add(resourceName);
        console.warn(`Failed to load map image: ${resourceName}`);
      }
      return null;
    }

    _getCameraAngle(): number {
      let layerNameToUse = this._object.getLayer();
      for (const obj of this._object.getTrackedObjects()) {
        const markerBehavior = this._object._getMapMarkerBehavior(obj);
        if (markerBehavior && markerBehavior.getMarkerType() === 'Player') {
          layerNameToUse = obj.getLayer();
          break;
        }
      }

      const layer = this._instanceContainer.getLayer(layerNameToUse);
      const layerRenderer: any = layer.getRenderer();
      const threeCamera =
        layerRenderer && typeof layerRenderer.getThreeCamera === 'function'
          ? layerRenderer.getThreeCamera()
          : null;
      const three: any = (globalThis as any).THREE;

      if (threeCamera && three && typeof three.Vector3 === 'function') {
        const projectNDCToZ0 = (ndcX: number, ndcY: number) => {
          threeCamera.updateMatrixWorld();
          if (threeCamera instanceof three.OrthographicCamera) {
            const vector = new three.Vector3(ndcX, ndcY, 0);
            vector.unproject(threeCamera);
            const direction = new three.Vector3();
            threeCamera.getWorldDirection(direction);
            if (!direction.z) {
              return null;
            }
            const distance = (0 - vector.z) / direction.z;
            vector.x += distance * direction.x;
            vector.y += distance * direction.y;
            return vector;
          }

          const vector = new three.Vector3(ndcX, ndcY, 0.5);
          vector.unproject(threeCamera);
          vector.sub(threeCamera.position).normalize();
          if (!vector.z) {
            return null;
          }
          const distance = (0 - threeCamera.position.z) / vector.z;
          return new three.Vector3(
            distance * vector.x + threeCamera.position.x,
            distance * vector.y + threeCamera.position.y,
            0
          );
        };

        const center = projectNDCToZ0(0, 0);
        const candidateA = projectNDCToZ0(0, -0.5);
        const candidateB = projectNDCToZ0(0, 0.5);
        if (center && candidateA && candidateB) {
          const aInCamera = candidateA.clone();
          const bInCamera = candidateB.clone();
          if (typeof threeCamera.worldToLocal === 'function') {
            threeCamera.worldToLocal(aInCamera);
            threeCamera.worldToLocal(bInCamera);
          }
          const inScreen = aInCamera.z < bInCamera.z ? candidateA : candidateB;
          const dx = inScreen.x - center.x;
          const dy = inScreen.y - center.y;
          if (dx !== 0 || dy !== 0) {
            return Math.atan2(-dy, dx);
          }
        }
      }

      return (layer.getCameraRotation() * Math.PI) / 180;
    }

    _parseColor(colorString: string): number {
      const [r, g, b] = this._parseColorToRgb(colorString);
      return (r << 16) | (g << 8) | b;
    }

    _parseColorToRgb(colorString: string): [number, number, number] {
      const parts = colorString.split(';');
      if (parts.length !== 3) {
        return [255, 255, 255];
      }

      return [
        clampChannel(parseInt(parts[0], 10)),
        clampChannel(parseInt(parts[1], 10)),
        clampChannel(parseInt(parts[2], 10)),
      ];
    }

    _numberToRgba(color: number, opacity: number): string {
      return `rgba(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255}, ${opacity})`;
    }

    _getMarkerPriorityFromType(markerType: string): number {
      switch (markerType) {
        case 'Obstacle':
          return 100;
        case 'Custom':
          return 200;
        case 'Item':
          return 300;
        case 'Ally':
          return 400;
        case 'Enemy':
          return 500;
        case 'Player':
          return 1000;
        default:
          return 200;
      }
    }
  }

  export const MapRuntimeObjectRenderer = MapRuntimeObjectThreeRenderer;
  export type MapRuntimeObjectRenderer = MapRuntimeObjectThreeRenderer;
}
