namespace gdjs {
  export class TextRuntimeObjectRenderer {
    private _renderer: gdjs.TextRuntimeObjectPixiRenderer;

    constructor(
      runtimeObject: gdjs.TextRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._renderer = TextRuntimeObjectRenderer._createRenderer(
        runtimeObject,
        instanceContainer
      );
    }

    private static _createRenderer(
      runtimeObject: gdjs.TextRuntimeObject,
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
      return new gdjs.TextRuntimeObjectPixiRenderer(
        runtimeObject,
        instanceContainer
      );
    }

    onMovedToLayer(
      oldLayer: gdjs.RuntimeLayer,
      newLayer: gdjs.RuntimeLayer,
      runtimeObject: gdjs.TextRuntimeObject
    ): boolean {
      if (
        newLayer.getRenderingType() !== gdjs.RuntimeLayerRenderingType.TWO_D
      ) {
        throw new Error(
          `Text object "${runtimeObject.getName()}" can only live on a 2D layer.`
        );
      }
      const rendererObject = this.getRendererObject();
      if (rendererObject) {
        oldLayer.getRenderer().removeRendererObject(rendererObject);
      }
      this.destroy();
      this._renderer = TextRuntimeObjectRenderer._createRenderer(
        runtimeObject,
        runtimeObject.getInstanceContainer()
      );
      return true;
    }

    getRendererObject() {
      return this._renderer.getRendererObject();
    }

    ensureUpToDate() {
      (this._renderer as any).ensureUpToDate();
    }

    destroy() {
      (this._renderer as any).destroy();
    }

    updatePosition() {
      (this._renderer as any).updatePosition();
    }

    updateAngle() {
      (this._renderer as any).updateAngle();
    }

    updateOpacity() {
      (this._renderer as any).updateOpacity();
    }

    updateString() {
      (this._renderer as any).updateString();
    }

    updateStyle() {
      (this._renderer as any).updateStyle();
    }

    getWidth() {
      return (this._renderer as any).getWidth();
    }

    getHeight() {
      return (this._renderer as any).getHeight();
    }

    setScale(newScale: float) {
      (this._renderer as any).setScale(newScale);
    }

    setScaleX(newScale: float) {
      (this._renderer as any).setScaleX(newScale);
    }

    setScaleY(newScale: float) {
      (this._renderer as any).setScaleY(newScale);
    }
  }
}
