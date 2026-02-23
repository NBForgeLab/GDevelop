/**
 * Minimap Runtime Object
 * Handles the core logic for the minimap system
 */

namespace gdjs {
  export type MinimapObjectDataType = {
    content: {
      size: number;
      zoom: number;
      stayOnScreen: boolean;
      backgroundImage: string;
      frameImage: string;
      backgroundColor: string;
      backgroundOpacity: number;
      borderColor: string;
      borderWidth: number;
      playerMarkerImage: string;
      playerColor: string;
      playerSize: number;
      enemyMarkerImage: string;
      enemyColor: string;
      enemySize: number;
      itemMarkerImage: string;
      itemColor: string;
      itemSize: number;
      showObstacles: boolean;
      obstacleColor: string;
      obstacleOpacity: number;
      useObjectShape: boolean;
      autoDetectBounds: boolean;
      updateRate: number;
    };
  };

  export type MinimapObjectData = ObjectData & MinimapObjectDataType;

  export class MinimapRuntimeObject extends gdjs.RuntimeObject {
    _size: number;
    _zoom: number;
    _stayOnScreen: boolean;
    _backgroundImage: string;
    _frameImage: string;
    _backgroundColor: string;
    _backgroundOpacity: number;
    _borderColor: string;
    _borderWidth: number;
    _playerMarkerImage: string;
    _playerColor: string;
    _playerSize: number;
    _enemyMarkerImage: string;
    _enemyColor: string;
    _enemySize: number;
    _itemMarkerImage: string;
    _itemColor: string;
    _itemSize: number;
    _showObstacles: boolean;
    _obstacleColor: string;
    _obstacleOpacity: number;
    _useObjectShape: boolean;
    _autoDetectBounds: boolean;
    _updateRate: number;

    _visible: boolean = true;
    _renderer: MinimapRuntimeObjectRenderer;

    // Tracking bounds
    _boundsMinX: number = 0;
    _boundsMinY: number = 0;
    _boundsMaxX: number = 0;
    _boundsMaxY: number = 0;
    _boundsDetected: boolean = false;

    // Update throttling
    _lastUpdateTime: number = 0;
    _updateInterval: number = 0;
    _elapsedAccumulator: number = 0;

    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      objectData: MinimapObjectData
    ) {
      super(instanceContainer, objectData, undefined);

      const defaultContent = {
        size: 200,
        zoom: 0.1,
        stayOnScreen: true,
        backgroundImage: '',
        frameImage: '',
        backgroundColor: '0;0;0',
        backgroundOpacity: 0.7,
        borderColor: '255;255;255',
        borderWidth: 2,
        playerMarkerImage: '',
        playerColor: '0;255;0',
        playerSize: 12,
        enemyMarkerImage: '',
        enemyColor: '255;0;0',
        enemySize: 8,
        itemMarkerImage: '',
        itemColor: '255;255;0',
        itemSize: 6,
        showObstacles: true,
        obstacleColor: '128;128;128',
        obstacleOpacity: 0.5,
        useObjectShape: true,
        autoDetectBounds: true,
        updateRate: 30,
      };
      const content = { ...defaultContent, ...(objectData.content || {}) };
      this._size = content.size;
      this._zoom = content.zoom;
      this._stayOnScreen = content.stayOnScreen;
      this._backgroundImage = content.backgroundImage;
      this._frameImage = content.frameImage;
      this._backgroundColor = content.backgroundColor;
      this._backgroundOpacity = content.backgroundOpacity;
      this._borderColor = content.borderColor;
      this._borderWidth = content.borderWidth;
      this._playerMarkerImage = content.playerMarkerImage;
      this._playerColor = content.playerColor;
      this._playerSize = content.playerSize;
      this._enemyMarkerImage = content.enemyMarkerImage;
      this._enemyColor = content.enemyColor;
      this._enemySize = content.enemySize;
      this._itemMarkerImage = content.itemMarkerImage;
      this._itemColor = content.itemColor;
      this._itemSize = content.itemSize;
      this._showObstacles = content.showObstacles;
      this._obstacleColor = content.obstacleColor;
      this._obstacleOpacity = content.obstacleOpacity;
      this._useObjectShape = content.useObjectShape;
      this._autoDetectBounds = content.autoDetectBounds;
      this._updateRate = content.updateRate > 0 ? content.updateRate : 30;

      this._updateInterval = this._updateRate > 0 ? 1000 / this._updateRate : 0;

      this._renderer = new gdjs.MinimapRuntimeObjectRenderer(
        this,
        instanceContainer
      );

      this.onCreated();
    }

    getRendererObject() {
      return this._renderer.getRendererObject();
    }

    updateFromObjectData(
      oldObjectData: MinimapObjectData,
      newObjectData: MinimapObjectData
    ): boolean {
      const defaultContent = {
        size: 200,
        zoom: 0.1,
        stayOnScreen: true,
        backgroundImage: '',
        frameImage: '',
        backgroundColor: '0;0;0',
        backgroundOpacity: 0.7,
        borderColor: '255;255;255',
        borderWidth: 2,
        playerMarkerImage: '',
        playerColor: '0;255;0',
        playerSize: 12,
        enemyMarkerImage: '',
        enemyColor: '255;0;0',
        enemySize: 8,
        itemMarkerImage: '',
        itemColor: '255;255;0',
        itemSize: 6,
        showObstacles: true,
        obstacleColor: '128;128;128',
        obstacleOpacity: 0.5,
        useObjectShape: true,
        autoDetectBounds: true,
        updateRate: 30,
      };
      const oldContent = { ...defaultContent, ...(oldObjectData.content || {}) };
      const content = { ...defaultContent, ...(newObjectData.content || {}) };
      
      if (oldContent.size !== content.size) {
        this._size = content.size;
      }
      if (oldContent.zoom !== content.zoom) {
        this._zoom = content.zoom;
      }
      if (oldContent.stayOnScreen !== content.stayOnScreen) {
        this._stayOnScreen = content.stayOnScreen;
      }
      if (oldContent.backgroundImage !== content.backgroundImage) {
        this._backgroundImage = content.backgroundImage;
      }
      if (oldContent.frameImage !== content.frameImage) {
        this._frameImage = content.frameImage;
      }
      if (oldContent.backgroundColor !== content.backgroundColor) {
        this._backgroundColor = content.backgroundColor;
      }
      if (oldContent.backgroundOpacity !== content.backgroundOpacity) {
        this._backgroundOpacity = content.backgroundOpacity;
      }
      if (oldContent.borderColor !== content.borderColor) {
        this._borderColor = content.borderColor;
      }
      if (oldContent.borderWidth !== content.borderWidth) {
        this._borderWidth = content.borderWidth;
      }
      if (oldContent.playerMarkerImage !== content.playerMarkerImage) {
        this._playerMarkerImage = content.playerMarkerImage;
      }
      if (oldContent.playerColor !== content.playerColor) {
        this._playerColor = content.playerColor;
      }
      if (oldContent.playerSize !== content.playerSize) {
        this._playerSize = content.playerSize;
      }
      if (oldContent.enemyMarkerImage !== content.enemyMarkerImage) {
        this._enemyMarkerImage = content.enemyMarkerImage;
      }
      if (oldContent.enemyColor !== content.enemyColor) {
        this._enemyColor = content.enemyColor;
      }
      if (oldContent.enemySize !== content.enemySize) {
        this._enemySize = content.enemySize;
      }
      if (oldContent.itemMarkerImage !== content.itemMarkerImage) {
        this._itemMarkerImage = content.itemMarkerImage;
      }
      if (oldContent.itemColor !== content.itemColor) {
        this._itemColor = content.itemColor;
      }
      if (oldContent.itemSize !== content.itemSize) {
        this._itemSize = content.itemSize;
      }
      if (oldContent.showObstacles !== content.showObstacles) {
        this._showObstacles = content.showObstacles;
      }
      if (oldContent.obstacleColor !== content.obstacleColor) {
        this._obstacleColor = content.obstacleColor;
      }
      if (oldContent.obstacleOpacity !== content.obstacleOpacity) {
        this._obstacleOpacity = content.obstacleOpacity;
      }
      if (oldContent.useObjectShape !== content.useObjectShape) {
        this._useObjectShape = content.useObjectShape;
      }
      if (oldContent.autoDetectBounds !== content.autoDetectBounds) {
        this._autoDetectBounds = content.autoDetectBounds;
      }
      if (oldContent.updateRate !== content.updateRate) {
        this._updateRate = content.updateRate > 0 ? content.updateRate : 30;
        this._updateInterval =
          this._updateRate > 0 ? 1000 / this._updateRate : 0;
      }

      return true;
    }

    onDestroy(instanceContainer: gdjs.RuntimeInstanceContainer): void {
      this._renderer.onDestroy();
    }

    onCreated(): void {
      if (this._autoDetectBounds) {
        this._detectBounds();
      }
    }

    update(instanceContainer: gdjs.RuntimeInstanceContainer): void {
      // Throttle updates based on accumulated elapsed time
      const elapsed = instanceContainer.getElapsedTime();
      this._elapsedAccumulator += elapsed;
      if (this._elapsedAccumulator < this._updateInterval) {
        return;
      }
      this._elapsedAccumulator -= this._updateInterval;

      // Auto-detect bounds if needed
      if (this._autoDetectBounds && !this._boundsDetected) {
        this._detectBounds();
      }

      // Update renderer
      this._renderer.update();
    }

    /**
     * Detect level bounds automatically from layer size
     */
    _detectBounds(): void {
      const layer = this.getInstanceContainer().getLayer(this.getLayer());
      
      // Get camera bounds as a starting point
      const cameraMinX = layer.getCameraX() - layer.getCameraWidth() / 2;
      const cameraMinY = layer.getCameraY() - layer.getCameraHeight() / 2;
      const cameraMaxX = layer.getCameraX() + layer.getCameraWidth() / 2;
      const cameraMaxY = layer.getCameraY() + layer.getCameraHeight() / 2;

      // Expand bounds to include all objects with markers
      let minX = cameraMinX;
      let minY = cameraMinY;
      let maxX = cameraMaxX;
      let maxY = cameraMaxY;

      const allObjects = this.getInstanceContainer().getAdhocListOfAllInstances();
      for (let i = 0; i < allObjects.length; i++) {
        const obj = allObjects[i];
        const behavior = obj.getBehavior('MinimapMarker');
        
        if (behavior) {
          const x = obj.getX();
          const y = obj.getY();
          const width = obj.getWidth();
          const height = obj.getHeight();
          
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x + width);
          maxY = Math.max(maxY, y + height);
        }
      }

      // Add some padding
      const padding = 100;
      this._boundsMinX = minX - padding;
      this._boundsMinY = minY - padding;
      this._boundsMaxX = maxX + padding;
      this._boundsMaxY = maxY + padding;
      
      this._boundsDetected = true;
    }

    /**
     * Convert world coordinates to minimap coordinates
     */
    worldToMinimap(worldX: number, worldY: number): [number, number] {
      const worldWidth = this._boundsMaxX - this._boundsMinX;
      const worldHeight = this._boundsMaxY - this._boundsMinY;
      if (worldWidth <= 0 || worldHeight <= 0) {
        return [0, 0];
      }
      
      const normalizedX = (worldX - this._boundsMinX) / worldWidth;
      const normalizedY = (worldY - this._boundsMinY) / worldHeight;
      
      const minimapX = normalizedX * this._size;
      const minimapY = normalizedY * this._size;
      
      return [minimapX, minimapY];
    }

    /**
     * Get all tracked objects
     */
    getTrackedObjects(): gdjs.RuntimeObject[] {
      const tracked: gdjs.RuntimeObject[] = [];
      const allObjects = this.getInstanceContainer().getAdhocListOfAllInstances();
      
      for (let i = 0; i < allObjects.length; i++) {
        const obj = allObjects[i];
        const behavior = obj.getBehavior('MinimapMarker');
        
        if (behavior) {
          const markerBehavior = behavior as any;
          if (markerBehavior.isVisibleOnMinimap && markerBehavior.isVisibleOnMinimap()) {
            tracked.push(obj);
          }
        }
      }
      
      return tracked;
    }

    // ===== PUBLIC API =====

    show(): void {
      this._visible = true;
      this._renderer.updateVisibility();
    }

    hide(): void {
      this._visible = false;
      this._renderer.updateVisibility();
    }

    toggleVisibility(): void {
      this._visible = !this._visible;
      this._renderer.updateVisibility();
    }

    isVisible(): boolean {
      return this._visible;
    }

    zoomIn(): void {
      this._zoom = Math.min(1.0, this._zoom + 0.05);
    }

    zoomOut(): void {
      this._zoom = Math.max(0.01, this._zoom - 0.05);
    }

    setZoom(zoom: number): void {
      this._zoom = Math.max(0.01, Math.min(1.0, zoom));
    }

    getZoomLevel(): number {
      return this._zoom;
    }

    setPosition(x: number, y: number): void {
      this.setX(x);
      this.setY(y);
    }

    setSize(size: number): void {
      this._size = Math.max(50, size);
    }

    getTrackedCount(markerType?: string): number {
      const tracked = this.getTrackedObjects();
      
      if (!markerType) {
        return tracked.length;
      }
      
      let count = 0;
      for (const obj of tracked) {
        const behavior = obj.getBehavior('MinimapMarker');
        if (behavior) {
          const markerBehavior = behavior as any;
          if (markerBehavior.getMarkerType && markerBehavior.getMarkerType() === markerType) {
            count++;
          }
        }
      }
      
      return count;
    }

    // Getters for renderer
    getSize(): number { return this._size; }
    getZoom(): number { return this._zoom; }
    getStayOnScreen(): boolean { return this._stayOnScreen; }
    getBackgroundImage(): string { return this._backgroundImage; }
    getFrameImage(): string { return this._frameImage; }
    getBackgroundColor(): string { return this._backgroundColor; }
    getBackgroundOpacity(): number { return this._backgroundOpacity; }
    getBorderColor(): string { return this._borderColor; }
    getBorderWidth(): number { return this._borderWidth; }
    getPlayerMarkerImage(): string { return this._playerMarkerImage; }
    getPlayerColor(): string { return this._playerColor; }
    getPlayerSize(): number { return this._playerSize; }
    getEnemyMarkerImage(): string { return this._enemyMarkerImage; }
    getEnemyColor(): string { return this._enemyColor; }
    getEnemySize(): number { return this._enemySize; }
    getItemMarkerImage(): string { return this._itemMarkerImage; }
    getItemColor(): string { return this._itemColor; }
    getItemSize(): number { return this._itemSize; }
    getShowObstacles(): boolean { return this._showObstacles; }
    getObstacleColor(): string { return this._obstacleColor; }
    getObstacleOpacity(): number { return this._obstacleOpacity; }
    getUseObjectShape(): boolean { return this._useObjectShape; }
  }

  gdjs.registerObject('Minimap::Minimap', gdjs.MinimapRuntimeObject);
}
