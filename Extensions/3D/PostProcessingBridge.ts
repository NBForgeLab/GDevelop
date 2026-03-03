namespace gdjs {
  export namespace scene3d {
    export namespace postprocessing {
      type PostProcessingPass = any;
      type PostProcessingEffect = any;

      export const getApi = (): any | null => {
        const postProcessing = (globalThis as any).POSTPROCESSING;
        if (!postProcessing || typeof postProcessing.EffectPass !== 'function') {
          return null;
        }
        return postProcessing;
      };

      export const isAvailable = (): boolean => getApi() !== null;

      export const getLayerThreeCamera = (
        target: EffectsTarget
      ):
        | THREE.PerspectiveCamera
        | THREE.OrthographicCamera
        | null => {
        if (!(target instanceof gdjs.Layer)) {
          return null;
        }
        const layerRenderer = target.getRenderer() as any;
        if (
          !layerRenderer ||
          typeof layerRenderer.getThreeCamera !== 'function'
        ) {
          return null;
        }
        return layerRenderer.getThreeCamera();
      };

      class PostProcessingPassAdapter {
        private _postProcessingPass: PostProcessingPass;
        private _isInitialized = false;
        enabled = true;
        needsSwap = true;
        clear = false;
        renderToScreen = false;

        constructor(postProcessingPass: PostProcessingPass) {
          this._postProcessingPass = postProcessingPass;
          this.enabled = postProcessingPass.enabled !== false;
          this.needsSwap = postProcessingPass.needsSwap !== false;
          this.clear = postProcessingPass.clear === true;
        }

        private _initialize(renderer: THREE.WebGLRenderer): void {
          if (this._isInitialized) {
            return;
          }

          if (typeof this._postProcessingPass.setRenderer === 'function') {
            this._postProcessingPass.setRenderer(renderer);
          }
          if (typeof this._postProcessingPass.initialize === 'function') {
            const contextAttributes = renderer.getContext().getContextAttributes();
            this._postProcessingPass.initialize(
              renderer,
              !!(contextAttributes && contextAttributes.alpha),
              THREE.UnsignedByteType
            );
          }
          this._isInitialized = true;
        }

        render(
          renderer: THREE.WebGLRenderer,
          writeBuffer: THREE.WebGLRenderTarget,
          readBuffer: THREE.WebGLRenderTarget,
          deltaTime: number,
          maskActive: boolean
        ): void {
          this._initialize(renderer);
          this._postProcessingPass.enabled = this.enabled;
          this._postProcessingPass.needsSwap = this.needsSwap;
          this._postProcessingPass.clear = this.clear;
          this._postProcessingPass.renderToScreen = this.renderToScreen;
          // Three.js examples composer uses (write, read), while pmndrs pass uses (input, output).
          this._postProcessingPass.render(
            renderer,
            readBuffer,
            writeBuffer,
            deltaTime,
            maskActive
          );
        }

        setSize(width: number, height: number): void {
          if (typeof this._postProcessingPass.setSize === 'function') {
            this._postProcessingPass.setSize(width, height);
          }
        }

        dispose(): void {
          if (typeof this._postProcessingPass.dispose === 'function') {
            this._postProcessingPass.dispose();
          }
          this._isInitialized = false;
        }
      }

      export const createEffectPassAdapter = (
        target: EffectsTarget,
        effects: PostProcessingEffect[]
      ): THREE_ADDONS.Pass | null => {
        const postprocessing = getApi();
        if (!postprocessing || effects.length === 0) {
          return null;
        }
        const threeCamera = getLayerThreeCamera(target);
        if (!threeCamera) {
          return null;
        }
        const effectPass = new postprocessing.EffectPass(threeCamera, ...effects);
        return new PostProcessingPassAdapter(effectPass) as unknown as THREE_ADDONS.Pass;
      };
    }
  }
}
