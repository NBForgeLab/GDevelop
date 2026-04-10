namespace gdjs {
  const logger = new gdjs.Logger('Three.js scene renderer');

  /**
   * The renderer for a gdjs.RuntimeScene using Three.js only.
   * @category Renderers > Scene
   */
  export class RuntimeSceneThreeRenderer {
    private _runtimeScene: gdjs.RuntimeScene;
    private _runtimeGameRenderer: gdjs.RuntimeGameRenderer | null;
    private _threeRenderer: THREE.WebGLRenderer | null;
    private _showCursorAtNextRender: boolean = false;

    constructor(
      runtimeScene: gdjs.RuntimeScene,
      runtimeGameRenderer: gdjs.RuntimeGameRenderer | null
    ) {
      this._runtimeScene = runtimeScene;
      this._runtimeGameRenderer = runtimeGameRenderer;
      this._threeRenderer = runtimeGameRenderer
        ? runtimeGameRenderer.getThreeRenderer()
        : null;

      if (!this._threeRenderer) {
        logger.error(
          'The 3D-first renderer requires a Three.js WebGLRenderer.'
        );
      }
    }

    onGameResolutionResized() {
      const runtimeGame = this._runtimeScene.getGame();
      const threeRenderer = this._threeRenderer;
      if (threeRenderer) {
        threeRenderer.setPixelRatio(window.devicePixelRatio || 1);
        threeRenderer.setSize(
          runtimeGame.getGameResolutionWidth(),
          runtimeGame.getGameResolutionHeight(),
          false
        );
      }

      for (const runtimeLayer of this._runtimeScene._orderedLayers) {
        runtimeLayer.getRenderer().onGameResolutionResized();
      }
    }

    onSceneUnloaded() {
      for (const runtimeLayer of this._runtimeScene._orderedLayers) {
        const renderer = runtimeLayer.getRenderer();
        if ((renderer as any).dispose) {
          (renderer as any).dispose();
        }
      }
    }

    render() {
      const threeRenderer = this._threeRenderer;
      if (!threeRenderer) {
        return;
      }

      if (threeRenderer.xr.isPresenting) {
        return;
      }

      threeRenderer.resetState();

      let isFirstRender = true;

      for (const runtimeLayer of this._runtimeScene._orderedLayers) {
        if (!runtimeLayer.isVisible()) {
          continue;
        }

        const layerRenderer = runtimeLayer.getRenderer();
        const threeScene = layerRenderer.getThreeScene();
        const threeCamera = layerRenderer.getThreeCamera();
        const threeEffectComposer = layerRenderer.getThreeEffectComposer();

        if (!threeScene || !threeCamera) {
          continue;
        }

        if (isFirstRender) {
          threeRenderer.setClearColor(this._runtimeScene.getBackgroundColor());
          if (this._runtimeScene.getClearCanvas()) {
            threeRenderer.clear(true, true, true);
          }
          isFirstRender = false;
        } else {
          threeRenderer.clearDepth();
        }

        const shadowManager = (gdjs as any).scene3d
          ? (gdjs as any).scene3d.shadows
          : null;
        if (
          shadowManager &&
          typeof shadowManager.applyToThreeRenderer === 'function'
        ) {
          shadowManager.applyToThreeRenderer(runtimeLayer, threeRenderer);
        }

        if (layerRenderer.hasPostProcessingPass() && threeEffectComposer) {
          threeEffectComposer.render();
        } else {
          threeRenderer.render(threeScene, threeCamera);
        }
      }

      if (isFirstRender && this._runtimeScene.getClearCanvas()) {
        threeRenderer.setClearColor(this._runtimeScene.getBackgroundColor());
        threeRenderer.clear(true, true, true);
      }

      if (this._showCursorAtNextRender) {
        const canvas = this._runtimeGameRenderer
          ? this._runtimeGameRenderer.getCanvas()
          : null;
        if (canvas) {
          canvas.style.cursor = '';
        }
        this._showCursorAtNextRender = false;
      }
    }

    hideCursor(): void {
      this._showCursorAtNextRender = false;
      const canvas = this._runtimeGameRenderer
        ? this._runtimeGameRenderer.getCanvas()
        : null;
      if (canvas) {
        canvas.style.cursor = 'none';
      }
    }

    showCursor(): void {
      this._showCursorAtNextRender = true;
    }

    getRendererObject() {
      return null;
    }

    get3DRendererObject() {
      return null;
    }

    getThreeRenderer(): THREE.WebGLRenderer | null {
      return this._threeRenderer;
    }

    setLayerIndex(layer: gdjs.RuntimeLayer, index: float): void {
      const layerRenderer = layer.getRenderer();
      if ((layerRenderer as any).setLayerIndex) {
        (layerRenderer as any).setLayerIndex(index);
      }
    }
  }
}
