namespace gdjs {
  export class BitmapTextRuntimeObjectRenderer {
    private _renderer: gdjs.BitmapTextRuntimeObjectPixiRenderer;

    constructor(
      runtimeObject: gdjs.BitmapTextRuntimeObject,
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
      this._renderer = new gdjs.BitmapTextRuntimeObjectPixiRenderer(
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
      runtimeObject: gdjs.BitmapTextRuntimeObject
    ): boolean {
      if (
        newLayer.getRenderingType() !== gdjs.RuntimeLayerRenderingType.TWO_D
      ) {
        throw new Error(
          `BitmapText object "${runtimeObject.getName()}" can only live on a 2D layer.`
        );
      }
      const rendererObject = this.getRendererObject();
      if (rendererObject) {
        oldLayer.getRenderer().removeRendererObject(rendererObject);
      }
      this.onDestroy();
      this._renderer = new gdjs.BitmapTextRuntimeObjectPixiRenderer(
        runtimeObject,
        runtimeObject.getInstanceContainer()
      );
      return true;
    }

    onDestroy() {
      this._renderer.onDestroy();
    }
    updateTint() {
      this._renderer.updateTint();
    }
    updateTextContent() {
      this._renderer.updateTextContent();
    }
    getFontName() {
      return this._renderer.getFontName();
    }
    updateScale() {
      this._renderer.updateScale();
    }
    getFontSize() {
      return this._renderer.getFontSize();
    }
    updateFont() {
      this._renderer.updateFont();
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
    getWidth() {
      return this._renderer.getWidth();
    }
    getHeight() {
      return this._renderer.getHeight();
    }
  }
}
