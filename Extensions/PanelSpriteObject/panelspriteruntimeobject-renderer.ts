namespace gdjs {
  export class PanelSpriteRuntimeObjectRenderer {
    private _renderer: gdjs.PanelSpriteRuntimeObjectPixiRenderer;

    constructor(
      runtimeObject: gdjs.PanelSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string,
      tiled: boolean
    ) {
      this._renderer = PanelSpriteRuntimeObjectRenderer._createRenderer(
        runtimeObject,
        instanceContainer,
        textureName,
        tiled
      );
    }

    private static _createRenderer(
      runtimeObject: gdjs.PanelSpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer,
      textureName: string,
      tiled: boolean
    ) {
      const layerName = instanceContainer.resolveLayerNameForObject(
        runtimeObject,
        runtimeObject.getLayer(),
        {
          allowImplicitFallback: true,
        }
      );
      runtimeObject.layer = layerName;
      return new gdjs.PanelSpriteRuntimeObjectPixiRenderer(
        runtimeObject,
        instanceContainer,
        textureName,
        tiled
      );
    }

    onMovedToLayer(
      oldLayer: gdjs.RuntimeLayer,
      newLayer: gdjs.RuntimeLayer,
      runtimeObject: gdjs.PanelSpriteRuntimeObject
    ): boolean {
      if (
        newLayer.getRenderingType() !== gdjs.RuntimeLayerRenderingType.TWO_D
      ) {
        throw new Error(
          `Panel sprite object "${runtimeObject.getName()}" can only live on a 2D layer.`
        );
      }
      const rendererObject = this.getRendererObject();
      if (rendererObject) {
        oldLayer.getRenderer().removeRendererObject(rendererObject);
      }
      const textureName = runtimeObject._objectData.texture;
      const tiled = runtimeObject._objectData.tiled;
      this.destroy();
      this._renderer = PanelSpriteRuntimeObjectRenderer._createRenderer(
        runtimeObject,
        runtimeObject.getInstanceContainer(),
        textureName,
        tiled
      );
      return true;
    }

    getRendererObject() {
      return this._renderer.getRendererObject();
    }

    destroy() {
      (this._renderer as any).destroy();
    }

    ensureUpToDate() {
      if ((this._renderer as any).ensureUpToDate) {
        (this._renderer as any).ensureUpToDate();
      }
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

    updateWidth() {
      (this._renderer as any).updateWidth();
    }

    updateHeight() {
      (this._renderer as any).updateHeight();
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
