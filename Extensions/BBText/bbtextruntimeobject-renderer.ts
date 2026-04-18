namespace gdjs {
  export class BBTextRuntimeObjectRenderer {
    private _renderer: gdjs.BBTextRuntimeObjectPixiRenderer;

    constructor(
      runtimeObject: gdjs.BBTextRuntimeObject,
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
      this._renderer = new gdjs.BBTextRuntimeObjectPixiRenderer(
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
      runtimeObject: gdjs.BBTextRuntimeObject
    ): boolean {
      if (
        newLayer.getRenderingType() !== gdjs.RuntimeLayerRenderingType.TWO_D
      ) {
        throw new Error(
          `BBText object "${runtimeObject.getName()}" can only live on a 2D layer.`
        );
      }
      const rendererObject = this.getRendererObject();
      if (rendererObject) {
        oldLayer.getRenderer().removeRendererObject(rendererObject);
      }
      this.destroy();
      this._renderer = new gdjs.BBTextRuntimeObjectPixiRenderer(
        runtimeObject,
        runtimeObject.getInstanceContainer()
      );
      return true;
    }

    updateColor() {
      this._renderer.updateColor();
    }
    destroy() {
      this._renderer.destroy();
    }
    updateText() {
      this._renderer.updateText();
    }
    updateFontSize() {
      this._renderer.updateFontSize();
    }
    updateFontFamily() {
      this._renderer.updateFontFamily();
    }
    updateAlignment() {
      this._renderer.updateAlignment();
    }
    updatePosition() {
      this._renderer.updatePosition();
    }
    updateAngle() {
      this._renderer.updateAngle();
    }
    updateOpacity() {
      this._renderer.updateOpacity();
    }
    updateWrappingWidth() {
      this._renderer.updateWrappingWidth();
    }
    updateWordWrap() {
      this._renderer.updateWordWrap();
    }
    getWidth() {
      return this._renderer.getWidth();
    }
    getHeight() {
      return this._renderer.getHeight();
    }
  }
}
