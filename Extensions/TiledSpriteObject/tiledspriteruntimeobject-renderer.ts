namespace gdjs {
  export class TiledSpriteRuntimeObjectRenderer {
    private _renderer: gdjs.TiledSpriteRuntimeObjectPixiRenderer;

    constructor(
      runtimeObject: gdjs.TiledSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string
    ) {
      this._renderer = TiledSpriteRuntimeObjectRenderer._createRenderer(
        runtimeObject,
        instanceContainer,
        textureName
      );
    }

    private static _createRenderer(
      runtimeObject: gdjs.TiledSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string
    ) {
      const layerName = instanceContainer.resolveLayerNameForObject(
        runtimeObject,
        runtimeObject.getLayer(),
        {
          allowImplicitFallback: true,
        }
      );
      runtimeObject.layer = layerName;
      return new gdjs.TiledSpriteRuntimeObjectPixiRenderer(
        runtimeObject,
        instanceContainer,
        textureName
      );
    }

    onMovedToLayer(
      oldLayer: gdjs.RuntimeLayer,
      newLayer: gdjs.RuntimeLayer,
      runtimeObject: gdjs.TiledSpriteRuntimeObject
    ): boolean {
      if (
        newLayer.getRenderingType() !== gdjs.RuntimeLayerRenderingType.TWO_D
      ) {
        throw new Error(
          `Tiled sprite object "${runtimeObject.getName()}" can only live on a 2D layer.`
        );
      }
      const rendererObject = this.getRendererObject();
      if (rendererObject) {
        oldLayer.getRenderer().removeRendererObject(rendererObject);
      }
      const textureName = runtimeObject._objectData.texture;
      this.destroy();
      this._renderer = TiledSpriteRuntimeObjectRenderer._createRenderer(
        runtimeObject,
        runtimeObject.getInstanceContainer(),
        textureName
      );
      return true;
    }

    getRendererObject() {
      return this._renderer.getRendererObject();
    }

    destroy() {
      (this._renderer as any).destroy();
    }

    updatePosition() {
      (this._renderer as any).updatePosition();
    }

    setTexture(
      textureName: string,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      (this._renderer as any).setTexture(textureName, instanceContainer);
    }

    updateAngle() {
      (this._renderer as any).updateAngle();
    }

    setWidth(width: float) {
      (this._renderer as any).setWidth(width);
    }

    setHeight(height: float) {
      (this._renderer as any).setHeight(height);
    }

    updateXOffset() {
      (this._renderer as any).updateXOffset();
    }

    updateYOffset() {
      (this._renderer as any).updateYOffset();
    }

    updateOpacity() {
      (this._renderer as any).updateOpacity();
    }

    setColor(rgbColor: string) {
      (this._renderer as any).setColor(rgbColor);
    }

    getColor() {
      return (this._renderer as any).getColor();
    }

    getTextureWidth() {
      return (this._renderer as any).getTextureWidth();
    }

    getTextureHeight() {
      return (this._renderer as any).getTextureHeight();
    }
  }
}
