namespace gdjs {
  export class MinimapMarkerRuntimeBehavior extends gdjs.RuntimeBehavior {
    _markerType: string;
    _customColor: string;
    _customSize: number;
    _customIcon: string;
    _showRotation: boolean;
    _visibleOnMinimap: boolean;
    
    // Flash effect state
    _isFlashing: boolean = false;
    _flashStartTime: number = 0;
    _flashDuration: number = 0;
    _flashInterval: number = 0.5; // Flash on/off every 0.5 seconds

    constructor(
      instanceContainer: gdjs.RuntimeInstanceContainer,
      behaviorData: any,
      owner: gdjs.RuntimeObject
    ) {
      super(instanceContainer, behaviorData, owner);
      
      this._markerType = behaviorData.markerType || 'Neutral';
      this._customColor = behaviorData.customColor || '255;255;255';
      this._customSize = behaviorData.customSize || 0;
      this._customIcon = behaviorData.customIcon || '';
      this._showRotation = behaviorData.showRotation || false;
      this._visibleOnMinimap = behaviorData.visibleOnMinimap !== false;
    }

    updateFromBehaviorData(
      oldBehaviorData: any,
      newBehaviorData: any
    ): boolean {
      if (oldBehaviorData.markerType !== newBehaviorData.markerType) {
        this._markerType = newBehaviorData.markerType;
      }
      if (oldBehaviorData.customColor !== newBehaviorData.customColor) {
        this._customColor = newBehaviorData.customColor;
      }
      if (oldBehaviorData.customSize !== newBehaviorData.customSize) {
        this._customSize = newBehaviorData.customSize;
      }
      if (oldBehaviorData.customIcon !== newBehaviorData.customIcon) {
        this._customIcon = newBehaviorData.customIcon;
      }
      if (oldBehaviorData.showRotation !== newBehaviorData.showRotation) {
        this._showRotation = newBehaviorData.showRotation;
      }
      if (oldBehaviorData.visibleOnMinimap !== newBehaviorData.visibleOnMinimap) {
        this._visibleOnMinimap = newBehaviorData.visibleOnMinimap;
      }
      
      return true;
    }

    onActivate(): void {
      // Behavior activated
    }

    onDeActivate(): void {
      // Behavior deactivated
    }

    doStepPreEvents(instanceContainer: gdjs.RuntimeInstanceContainer): void {
      // Update flash state
      if (this._isFlashing) {
        const currentTime = instanceContainer.getElapsedTime() / 1000;
        const elapsed = currentTime - this._flashStartTime;
        
        if (elapsed >= this._flashDuration) {
          this._isFlashing = false;
        }
      }
    }

    doStepPostEvents(instanceContainer: gdjs.RuntimeInstanceContainer): void {
      // Nothing to do
    }

    // ===== PUBLIC API =====

    showOnMinimap(): void {
      this._visibleOnMinimap = true;
    }

    hideOnMinimap(): void {
      this._visibleOnMinimap = false;
    }

    isVisibleOnMinimap(): boolean {
      return this._visibleOnMinimap;
    }

    setMarkerType(type: string): void {
      this._markerType = type;
    }

    getMarkerType(): string {
      return this._markerType;
    }

    markerTypeIs(type: string): boolean {
      return this._markerType === type;
    }

    setCustomColor(color: string): void {
      this._customColor = color;
    }

    getCustomColor(): string {
      return this._customColor;
    }

    setCustomSize(size: number): void {
      this._customSize = Math.max(0, size);
    }

    getCustomSize(): number {
      return this._customSize;
    }

    setCustomIcon(icon: string): void {
      this._customIcon = icon;
    }

    getCustomIcon(): string {
      return this._customIcon;
    }

    setShowRotation(show: boolean): void {
      this._showRotation = show;
    }

    getShowRotation(): boolean {
      return this._showRotation;
    }

    flash(duration: number): void {
      this._isFlashing = true;
      this._flashStartTime = this.owner.getInstanceContainer().getElapsedTime() / 1000;
      this._flashDuration = duration;
    }

    isFlashing(): boolean {
      return this._isFlashing;
    }

    shouldShowFlash(): boolean {
      if (!this._isFlashing) return true;
      
      const currentTime = this.owner.getInstanceContainer().getElapsedTime() / 1000;
      const elapsed = currentTime - this._flashStartTime;
      const cycle = Math.floor(elapsed / this._flashInterval);
      
      return cycle % 2 === 0;
    }
  }

  gdjs.registerBehavior(
    'Minimap::MinimapMarker',
    gdjs.MinimapMarkerRuntimeBehavior
  );
}
