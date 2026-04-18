namespace gdjs {
  export class MapRuntimeObjectRenderer {
    private _renderer: gdjs.MapRuntimeObjectPixiRenderer;

    constructor(
      runtimeObject: gdjs.MapRuntimeObject,
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
      this._renderer = new gdjs.MapRuntimeObjectPixiRenderer(
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
      runtimeObject: gdjs.MapRuntimeObject
    ): boolean {
      if (
        newLayer.getRenderingType() !== gdjs.RuntimeLayerRenderingType.TWO_D
      ) {
        throw new Error(
          `Map object "${runtimeObject.getName()}" can only live on a 2D layer.`
        );
      }
      const rendererObject = this.getRendererObject();
      if (rendererObject) oldLayer.getRenderer().removeRendererObject(rendererObject);
      this.destroy();
      this._renderer = new gdjs.MapRuntimeObjectPixiRenderer(
        runtimeObject,
        runtimeObject.getInstanceContainer()
      );
      return true;
    }
    destroy() { this._renderer.destroy(); }
    update() { this._renderer.update(); }
    updateVisibility() { this._renderer.updateVisibility(); }
  }
}
