namespace gdjs {
  export class VideoRuntimeObjectRenderer {
    private _renderer: gdjs.VideoRuntimeObjectPixiRenderer;

    constructor(
      runtimeObject: gdjs.VideoRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      const layerName = instanceContainer.resolveLayerNameForObject(
        runtimeObject,
        runtimeObject.getLayer(),
        {
          allowImplicitFallback: true,
        }
      );
      runtimeObject.layer = layerName;
      this._renderer = new gdjs.VideoRuntimeObjectPixiRenderer(
        runtimeObject,
        instanceContainer
      );
    }

    getRendererObject() {
      return this._renderer.getRendererObject();
    }
    onMovedToLayer(
      oldLayer: gdjs.RuntimeLayer,
      newLayer: gdjs.RuntimeLayer,
      runtimeObject: gdjs.VideoRuntimeObject
    ): boolean {
      if (
        newLayer.getRenderingType() !== gdjs.RuntimeLayerRenderingType.TWO_D
      ) {
        throw new Error(
          `Video object "${runtimeObject.getName()}" can only live on a 2D layer.`
        );
      }
      const rendererObject = this.getRendererObject();
      if (rendererObject) oldLayer.getRenderer().removeRendererObject(rendererObject);
      this.onDestroy();
      this._renderer = new gdjs.VideoRuntimeObjectPixiRenderer(
        runtimeObject,
        runtimeObject.getInstanceContainer()
      );
      return true;
    }
    onDestroy() { this._renderer.onDestroy(); }
    ensureUpToDate() { this._renderer.ensureUpToDate(); }
    updatePosition() { this._renderer.updatePosition(); }
    updateAngle() { this._renderer.updateAngle(); }
    updateOpacity() { this._renderer.updateOpacity(); }
    getWidth() { return this._renderer.getWidth(); }
    setWidth(width: float) { this._renderer.setWidth(width); }
    getHeight() { return this._renderer.getHeight(); }
    setHeight(height: float) { this._renderer.setHeight(height); }
    play() { this._renderer.play(); }
    pause() { this._renderer.pause(); }
    setLoop(enable: boolean) { this._renderer.setLoop(enable); }
    setMute(enable: boolean) { this._renderer.setMute(enable); }
    isMuted() { return this._renderer.isMuted(); }
    updateVolume() { this._renderer.updateVolume(); }
    getVolume() { return this._renderer.getVolume(); }
    isPlayed() { return this._renderer.isPlayed(); }
    isLooped() { return this._renderer.isLooped(); }
    getDuration() { return this._renderer.getDuration(); }
    isEnded() { return this._renderer.isEnded(); }
    setCurrentTime(time: float) { this._renderer.setCurrentTime(time); }
    getCurrentTime() { return this._renderer.getCurrentTime(); }
    setPlaybackSpeed(speed: number) { this._renderer.setPlaybackSpeed(speed); }
    getPlaybackSpeed() { return this._renderer.getPlaybackSpeed(); }
  }
}
