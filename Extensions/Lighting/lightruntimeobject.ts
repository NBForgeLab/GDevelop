namespace gdjs {
  export type LightObjectDataType = {
    content: {
      radius: number;
      color: string;
      intensity: number;
      debugMode: boolean;
    };
  };

  export type LightObjectData = ObjectData & LightObjectDataType;

  export type LightNetworkSyncDataType = {
    rad: number;
    col: string;
    i: number;
    z: number;
  };

  export type LightNetworkSyncData = ObjectNetworkSyncData &
    LightNetworkSyncDataType;

  export class LightRuntimeObject extends gdjs.RuntimeObject {
    _radius: number;
    _color: integer[];
    _intensity: number;
    _debugMode: boolean;
    _z: float = 0;
    _renderer: gdjs.LightRuntimeObjectRenderer;

    constructor(
      runtimeScene: gdjs.RuntimeScene,
      lightObjectData: LightObjectData,
      instanceData?: InstanceData
    ) {
      super(runtimeScene, lightObjectData, instanceData);
      this._radius =
        lightObjectData.content.radius > 0 ? lightObjectData.content.radius : 1;
      this._color = gdjs.rgbOrHexToRGBColor(lightObjectData.content.color);
      this._intensity = Math.max(
        0,
        lightObjectData.content.intensity === undefined
          ? 1
          : lightObjectData.content.intensity
      );
      this._debugMode = lightObjectData.content.debugMode;
      this._renderer = new gdjs.LightRuntimeObjectRenderer(this, runtimeScene);

      this.onCreated();
    }

    override getRendererObject() {
      return null;
    }

    override get3DRendererObject() {
      return this._renderer.get3DRendererObject();
    }

    override updateFromObjectData(
      oldObjectData: LightObjectData,
      newObjectData: LightObjectData
    ): boolean {
      if (oldObjectData.content.radius !== newObjectData.content.radius) {
        this.setRadius(newObjectData.content.radius);
      }
      if (oldObjectData.content.color !== newObjectData.content.color) {
        this._color = gdjs.rgbOrHexToRGBColor(newObjectData.content.color);
        this._renderer.updateColor();
      }
      if (oldObjectData.content.intensity !== newObjectData.content.intensity) {
        this.setIntensity(
          newObjectData.content.intensity === undefined
            ? 1
            : newObjectData.content.intensity
        );
      }
      if (oldObjectData.content.debugMode !== newObjectData.content.debugMode) {
        this._debugMode = newObjectData.content.debugMode;
        this._renderer.updateDebugMode();
      }
      return true;
    }

    override getNetworkSyncData(
      syncOptions: GetNetworkSyncDataOptions
    ): LightNetworkSyncData {
      return {
        ...super.getNetworkSyncData(syncOptions),
        rad: this.getRadius(),
        col: this.getColor(),
        i: this.getIntensity(),
        z: this.getZ(),
      };
    }

    override updateFromNetworkSyncData(
      networkSyncData: LightNetworkSyncData,
      options: UpdateFromNetworkSyncDataOptions
    ): void {
      super.updateFromNetworkSyncData(networkSyncData, options);

      if (networkSyncData.rad !== undefined) {
        this.setRadius(networkSyncData.rad);
      }
      if (networkSyncData.col !== undefined) {
        this.setColor(networkSyncData.col);
      }
      if (networkSyncData.i !== undefined) {
        this.setIntensity(networkSyncData.i);
      }
      if (networkSyncData.z !== undefined) {
        this.setZ(networkSyncData.z);
      }
    }

    override updatePreRender(): void {
      this._renderer.ensureUpToDate();
    }

    override onDestroyed(): void {
      super.onDestroyed();
      this._renderer.destroy();
    }

    override setX(x: float): void {
      super.setX(x);
      this._renderer.updatePosition();
    }

    override setY(y: float): void {
      super.setY(y);
      this._renderer.updatePosition();
    }

    getZ(): float {
      return this._z;
    }

    setZ(z: float): void {
      if (z === this._z) {
        return;
      }
      this._z = z;
      this._renderer.updatePosition();
    }

    getRadius(): number {
      return this._radius;
    }

    setRadius(radius: number): void {
      this._radius = radius > 0 ? radius : 1;
      this._renderer.updateRadius();
    }

    getIntensity(): number {
      return this._intensity;
    }

    setIntensity(intensity: number): void {
      this._intensity = Math.max(0, intensity);
      this._renderer.updateIntensity();
    }

    override getHeight(): float {
      return 2 * this._radius;
    }

    override getWidth(): float {
      return 2 * this._radius;
    }

    getDrawableX(): float {
      return this.x - this._radius;
    }

    getDrawableY(): float {
      return this.y - this._radius;
    }

    getDrawableZ(): float {
      return this._z - this._radius;
    }

    getColor(): string {
      return this._color[0] + ';' + this._color[1] + ';' + this._color[2];
    }

    setColor(color: string): void {
      this._color = gdjs.rgbOrHexToRGBColor(color);
      this._renderer.updateColor();
    }

    getDebugMode(): boolean {
      return this._debugMode;
    }
  }
  gdjs.registerObject('Lighting::LightObject', gdjs.LightRuntimeObject);
}
