namespace gdjs {
  const getPostProcessingBridgeForToneMapping = (): any | null => {
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

  type ToneMappingName =
    | 'none'
    | 'linear'
    | 'reinhard'
    | 'cineon'
    | 'acesFilmic';

  interface ToneMappingFilterNetworkSyncData {
    t: ToneMappingName;
    e: number;
  }

  const minimumToneMappingExposure = 0;
  const maximumToneMappingExposure = 10;
  const defaultToneMappingExposure = 1;
  const defaultToneMappingName: ToneMappingName = 'acesFilmic';

  const toneMappingExposureFragmentShader = `
uniform float exposure;
void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = vec4(inputColor.rgb * exposure, inputColor.a);
}
`;

  const sanitizeToneMappingName = (value: string): ToneMappingName => {
    if (
      value === 'none' ||
      value === 'linear' ||
      value === 'reinhard' ||
      value === 'cineon' ||
      value === 'acesFilmic'
    ) {
      return value;
    }
    return defaultToneMappingName;
  };

  const sanitizeExposure = (value: number): number => {
    if (!Number.isFinite(value)) {
      return defaultToneMappingExposure;
    }
    return Math.max(
      minimumToneMappingExposure,
      Math.min(maximumToneMappingExposure, value)
    );
  };

  const getPostProcessingToneMappingMode = (
    postprocessing: any,
    toneMappingName: ToneMappingName
  ): number => {
    const toneMappingModes = postprocessing.ToneMappingMode;
    if (!toneMappingModes) {
      return 0;
    }
    if (toneMappingName === 'linear') {
      return toneMappingModes.LINEAR;
    }
    if (toneMappingName === 'reinhard') {
      return toneMappingModes.REINHARD;
    }
    if (toneMappingName === 'cineon') {
      return toneMappingModes.CINEON;
    }
    return toneMappingModes.ACES_FILMIC;
  };

  gdjs.PixiFiltersTools.registerFilterCreator(
    'Scene3D::ToneMapping',
    new (class implements gdjs.PixiFiltersTools.FilterCreator {
      makeFilter(
        target: EffectsTarget,
        effectData: EffectData
      ): gdjs.PixiFiltersTools.Filter {
        if (
          typeof THREE === 'undefined' ||
          !getPostProcessingBridgeForToneMapping() ||
          !getPostProcessingBridgeForToneMapping()!.isAvailable()
        ) {
          return new gdjs.PixiFiltersTools.EmptyFilter();
        }

        return new (class implements gdjs.PixiFiltersTools.Filter {
          private _isEnabled = false;
          private _toneMapping: ToneMappingName = defaultToneMappingName;
          private _exposure = defaultToneMappingExposure;
          private _effectPass: THREE_ADDONS.Pass | null = null;
          private _toneMappingEffect: any | null = null;
          private _exposureEffect: any | null = null;
          private _exposureUniform: THREE.Uniform | null = null;

          private _createEffects(postprocessing: any): boolean {
            if (!postprocessing || typeof postprocessing.ToneMappingEffect !== 'function') {
              return false;
            }
            if (
              typeof postprocessing.Effect !== 'function' ||
              !postprocessing.BlendFunction
            ) {
              return false;
            }
            this._toneMappingEffect = new postprocessing.ToneMappingEffect({
              mode: getPostProcessingToneMappingMode(
                postprocessing,
                this._toneMapping
              ),
            });
            this._exposureUniform = new THREE.Uniform(this._exposure);
            this._exposureEffect = new postprocessing.Effect(
              'GDevelopToneMappingExposureEffect',
              toneMappingExposureFragmentShader,
              {
                blendFunction: postprocessing.BlendFunction.SRC,
                uniforms: new Map([['exposure', this._exposureUniform]]),
              }
            );
            return true;
          }

          private _syncEffects(postprocessing: any): void {
            if (!this._effectPass || !this._toneMappingEffect || !this._exposureUniform) {
              return;
            }
            if (this._toneMapping === 'none') {
              this._effectPass.enabled = false;
              return;
            }
            this._effectPass.enabled = true;
            this._toneMappingEffect.mode = getPostProcessingToneMappingMode(
              postprocessing,
              this._toneMapping
            );
            this._exposureUniform.value = this._exposure;
          }

          private _ensureEffectPass(target: EffectsTarget): boolean {
            const bridge = getPostProcessingBridgeForToneMapping();
            if (!bridge) {
              return false;
            }
            const postprocessing = bridge.getApi();
            if (!postprocessing) {
              return false;
            }
            if (this._effectPass) {
              this._syncEffects(postprocessing);
              return true;
            }
            if (!this._toneMappingEffect || !this._exposureEffect) {
              if (!this._createEffects(postprocessing)) {
                return false;
              }
            }
            this._effectPass = bridge.createEffectPassAdapter(target, [
              this._toneMappingEffect,
              this._exposureEffect,
            ]);
            if (!this._effectPass) {
              return false;
            }
            this._syncEffects(postprocessing);
            return true;
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
            this._ensureEffectPass(target);
          }

          updateDoubleParameter(parameterName: string, value: number): void {
            if (parameterName === 'exposure') {
              this._exposure = sanitizeExposure(value);
            }
          }

          getDoubleParameter(parameterName: string): number {
            if (parameterName === 'exposure') {
              return this._exposure;
            }
            return 0;
          }

          updateStringParameter(parameterName: string, value: string): void {
            if (parameterName !== 'toneMapping') {
              return;
            }
            this._toneMapping = sanitizeToneMappingName(value);
          }

          updateColorParameter(parameterName: string, value: number): void {}

          getColorParameter(parameterName: string): number {
            return 0;
          }

          updateBooleanParameter(parameterName: string, value: boolean): void {}

          getNetworkSyncData(): ToneMappingFilterNetworkSyncData {
            return {
              t: this._toneMapping,
              e: this._exposure,
            };
          }

          updateFromNetworkSyncData(
            syncData: ToneMappingFilterNetworkSyncData
          ): void {
            this._toneMapping = sanitizeToneMappingName(syncData.t);
            this._exposure = sanitizeExposure(syncData.e);
          }
        })();
      }
    })()
  );
}
