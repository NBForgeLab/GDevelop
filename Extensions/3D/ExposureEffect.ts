namespace gdjs {
  const getPostProcessingBridgeForExposure = (): any | null => {
    const scene3dAny = (gdjs as any).scene3d;
    if (!scene3dAny) {
      return null;
    }
    const bridge = scene3dAny.postprocessing;
    if (
      !bridge ||
      typeof bridge.isAvailable !== 'function' ||
      typeof bridge.getApi !== 'function' ||
      typeof bridge.createEffectPassAdapter !== 'function'
    ) {
      return null;
    }
    return bridge;
  };

  const exposureFragmentShader = `
uniform float exposure;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(inputColor.rgb * exposure, inputColor.a);
}
`;

  interface ExposureFilterNetworkSyncData {
    e: number;
  }

  gdjs.PixiFiltersTools.registerFilterCreator(
    'Scene3D::Exposure',
    new (class implements gdjs.PixiFiltersTools.FilterCreator {
      makeFilter(
        target: EffectsTarget,
        effectData: EffectData
      ): gdjs.PixiFiltersTools.Filter {
        if (
          typeof THREE === 'undefined' ||
          !getPostProcessingBridgeForExposure() ||
          !getPostProcessingBridgeForExposure()!.isAvailable()
        ) {
          return new gdjs.PixiFiltersTools.EmptyFilter();
        }

        return new (class implements gdjs.PixiFiltersTools.Filter {
          private _effectPass: THREE_ADDONS.Pass | null = null;
          private _effect: any | null = null;
          private _effectUniform: THREE.Uniform | null = null;
          private _isEnabled = false;
          private _exposure = 1;

          private _createEffect(): any | null {
            const bridge = getPostProcessingBridgeForExposure();
            if (!bridge) {
              return null;
            }
            const postprocessing = bridge.getApi();
            if (
              !postprocessing ||
              typeof postprocessing.Effect !== 'function' ||
              !postprocessing.BlendFunction
            ) {
              return null;
            }
            this._effectUniform = new THREE.Uniform(this._exposure);
            return new postprocessing.Effect(
              'GDevelopExposureEffect',
              exposureFragmentShader,
              {
                blendFunction: postprocessing.BlendFunction.SRC,
                uniforms: new Map([['exposure', this._effectUniform]]),
              }
            );
          }

          private _syncEffectParameters(): void {
            if (!this._effectUniform) {
              return;
            }
            this._effectUniform.value = this._exposure;
          }

          private _ensureEffectPass(target: EffectsTarget): boolean {
            const bridge = getPostProcessingBridgeForExposure();
            if (!bridge) {
              return false;
            }
            if (this._effectPass) {
              this._syncEffectParameters();
              return true;
            }
            if (!this._effect) {
              this._effect = this._createEffect();
            }
            if (!this._effect) {
              return false;
            }
            this._syncEffectParameters();
            this._effectPass = bridge.createEffectPassAdapter(target, [
              this._effect,
            ]);
            return !!this._effectPass;
          }

          isEnabled(target: EffectsTarget): boolean {
            return this._isEnabled;
          }

          setEnabled(target: EffectsTarget, enabled: boolean): boolean {
            if (this._isEnabled === enabled) {
              return true;
            }
            return enabled ? this.applyEffect(target) : this.removeEffect(target);
          }

          applyEffect(target: EffectsTarget): boolean {
            if (!(target instanceof gdjs.Layer)) {
              return false;
            }
            if (!this._ensureEffectPass(target) || !this._effectPass) {
              return false;
            }
            target.getRenderer().addPostProcessingPass(this._effectPass);
            this._isEnabled = true;
            return true;
          }

          removeEffect(target: EffectsTarget): boolean {
            if (!(target instanceof gdjs.Layer)) {
              return false;
            }
            if (this._effectPass) {
              target.getRenderer().removePostProcessingPass(this._effectPass);
            }
            this._isEnabled = false;
            return true;
          }

          updatePreRender(target: gdjs.EffectsTarget): any {
            if (!this._isEnabled || !(target instanceof gdjs.Layer)) {
              return;
            }
            if (this._ensureEffectPass(target)) {
              this._syncEffectParameters();
            }
          }

          updateDoubleParameter(parameterName: string, value: number): void {
            if (parameterName === 'exposure') {
              this._exposure = value;
            }
            this._syncEffectParameters();
          }

          getDoubleParameter(parameterName: string): number {
            if (parameterName === 'exposure') {
              return this._exposure;
            }
            return 0;
          }

          updateStringParameter(parameterName: string, value: string): void {}
          updateColorParameter(parameterName: string, value: number): void {}
          getColorParameter(parameterName: string): number {
            return 0;
          }
          updateBooleanParameter(parameterName: string, value: boolean): void {}

          getNetworkSyncData(): ExposureFilterNetworkSyncData {
            return { e: this._exposure };
          }

          updateFromNetworkSyncData(
            syncData: ExposureFilterNetworkSyncData
          ): void {
            this._exposure = syncData.e;
            this._syncEffectParameters();
          }
        })();
      }
    })()
  );
}
