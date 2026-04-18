namespace gdjs {
  export class SpriteRuntimeObjectRenderer {
    private _renderer: gdjs.SpriteRuntimeObjectPixiRenderer;

    constructor(
      runtimeObject: gdjs.SpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      this._renderer = SpriteRuntimeObjectRenderer._createRenderer(
        runtimeObject,
        instanceContainer
      );
    }

    private static _createRenderer(
      runtimeObject: gdjs.SpriteRuntimeObject,
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
      return new gdjs.SpriteRuntimeObjectPixiRenderer(
        runtimeObject,
        instanceContainer
      );
    }

    static getAnimationFrameTextureManager(
      imageManager: gdjs.ThreeTextureImageManager
    ) {
      return gdjs.SpriteRuntimeObjectThreeRenderer.getAnimationFrameTextureManager(
        imageManager
      );
    }

    reinitialize(
      runtimeObject: gdjs.SpriteRuntimeObject,
      instanceContainer: gdjs.RuntimeInstanceContainer
    ) {
      if ((this._renderer as any).reinitialize) {
        (this._renderer as any).reinitialize(runtimeObject, instanceContainer);
        return;
      }

      this._renderer = SpriteRuntimeObjectRenderer._createRenderer(
        runtimeObject,
        instanceContainer
      );
    }

    onMovedToLayer(
      oldLayer: gdjs.RuntimeLayer,
      newLayer: gdjs.RuntimeLayer,
      runtimeObject: gdjs.SpriteRuntimeObject
    ): boolean {
      if (
        newLayer.getRenderingType() !== gdjs.RuntimeLayerRenderingType.TWO_D
      ) {
        throw new Error(
          `Sprite object "${runtimeObject.getName()}" can only live on a 2D layer.`
        );
      }
      const currentRendererObject = this.getRendererObject();
      if (currentRendererObject) {
        oldLayer.getRenderer().removeRendererObject(currentRendererObject);
      }
      this.destroy();
      this._renderer = SpriteRuntimeObjectRenderer._createRenderer(
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

    updateFrame(animationFrame: gdjs.SpriteAnimationFrame<THREE.Texture>) {
      void animationFrame;
      (this._renderer as any).updateFrame(animationFrame);
    }

    update() {
      (this._renderer as any).update();
    }

    updateX() {
      (this._renderer as any).updateX();
    }

    updateY() {
      (this._renderer as any).updateY();
    }

    updateAngle() {
      (this._renderer as any).updateAngle();
    }

    updateOpacity() {
      (this._renderer as any).updateOpacity();
    }

    updateVisibility() {
      (this._renderer as any).updateVisibility();
    }

    setColor(rgbOrHexColor: string) {
      (this._renderer as any).setColor(rgbOrHexColor);
    }

    getColor() {
      return (this._renderer as any).getColor();
    }

    getWidth() {
      return (this._renderer as any).getWidth();
    }

    getHeight() {
      return (this._renderer as any).getHeight();
    }

    getUnscaledWidth() {
      return (this._renderer as any).getUnscaledWidth();
    }

    getUnscaledHeight() {
      return (this._renderer as any).getUnscaledHeight();
    }

    destroy() {
      if ((this._renderer as any).destroy) {
        (this._renderer as any).destroy();
      }
    }
  }
}
