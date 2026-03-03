namespace gdjs {
  const getPostProcessingBridgeForHueSaturation = (): any | null => {
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

  interface HueAndSaturationFilterExtra {
    h: number;
    s: number;
  }

  gdjs.PixiFiltersTools.registerFilterCreator(
    'Scene3D::HueAndSaturation',
    new (class implements gdjs.PixiFiltersTools.FilterCreator {
      makeFilter(
        target: EffectsTarget,
        effectData: EffectData
      ): gdjs.PixiFiltersTools.Filter {
        if (
          typeof THREE === 'undefined' ||
          !getPostProcessingBridgeForHueSaturation() ||
          !getPostProcessingBridgeForHueSaturation()!.isAvailable()
        ) {
          return new gdjs.PixiFiltersTools.EmptyFilter();
        }

        return new (class implements gdjs.PixiFiltersTools.Filter {
          private _effectPass: THREE_ADDONS.Pass | null = null;
          private _effect: any | null = null;
          private _isEnabled = false;
          private _hueDegrees = 0;
          private _saturation = 0;

          private _createEffect(): any | null {
            const bridge = getPostProcessingBridgeForHueSaturation();
            if (!bridge) {
              return null;
            }
            const postprocessing = bridge.getApi();
            if (
              !postprocessing ||
              typeof postprocessing.HueSaturationEffect !== 'function'
            ) {
              return null;
            }
            return new postprocessing.HueSaturationEffect({
              hue: gdjs.toRad(this._hueDegrees),
              saturation: this._saturation,
            });
          }

          private _syncEffectParameters(): void {
            if (!this._effect) {
              return;
            }
            this._effect.hue = gdjs.toRad(this._hueDegrees);
            this._effect.saturation = this._saturation;
          }

          private _ensureEffectPass(target: EffectsTarget): boolean {
            const bridge = getPostProcessingBridgeForHueSaturation();
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
            if (parameterName === 'hue') {
              this._hueDegrees = value;
            }
            if (parameterName === 'saturation') {
              this._saturation = value;
            }
            this._syncEffectParameters();
          }

          getDoubleParameter(parameterName: string): number {
            if (parameterName === 'hue') {
              return this._hueDegrees;
            }
            if (parameterName === 'saturation') {
              return this._saturation;
            }
            return 0;
          }

          updateStringParameter(parameterName: string, value: string): void {}
          updateColorParameter(parameterName: string, value: number): void {}
          getColorParameter(parameterName: string): number {
            return 0;
          }
          updateBooleanParameter(parameterName: string, value: boolean): void {}

          getNetworkSyncData(): HueAndSaturationFilterExtra {
            return {
              h: this._hueDegrees,
              s: this._saturation,
            };
          }

          updateFromNetworkSyncData(
            syncData: HueAndSaturationFilterExtra
          ): void {
            this._hueDegrees = syncData.h;
            this._saturation = syncData.s;
            this._syncEffectParameters();
          }
        })();
      }
    })()
  );
}
