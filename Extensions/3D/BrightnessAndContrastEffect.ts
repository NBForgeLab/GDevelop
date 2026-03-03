namespace gdjs {
  const getPostProcessingBridgeForBrightnessContrast = (): any | null => {
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

  interface BrightnessAndContrastFilterNetworkSyncData {
    b: number;
    c: number;
  }

  gdjs.PixiFiltersTools.registerFilterCreator(
    'Scene3D::BrightnessAndContrast',
    new (class implements gdjs.PixiFiltersTools.FilterCreator {
      makeFilter(
        target: EffectsTarget,
        effectData: EffectData
      ): gdjs.PixiFiltersTools.Filter {
        if (
          typeof THREE === 'undefined' ||
          !getPostProcessingBridgeForBrightnessContrast() ||
          !getPostProcessingBridgeForBrightnessContrast()!.isAvailable()
        ) {
          return new gdjs.PixiFiltersTools.EmptyFilter();
        }

        return new (class implements gdjs.PixiFiltersTools.Filter {
          private _effectPass: THREE_ADDONS.Pass | null = null;
          private _effect: any | null = null;
          private _isEnabled = false;
          private _brightness = 0;
          private _contrast = 0;

          private _createEffect(): any | null {
            const bridge = getPostProcessingBridgeForBrightnessContrast();
            if (!bridge) {
              return null;
            }
            const postprocessing = bridge.getApi();
            if (
              !postprocessing ||
              typeof postprocessing.BrightnessContrastEffect !== 'function'
            ) {
              return null;
            }
            return new postprocessing.BrightnessContrastEffect({
              brightness: this._brightness,
              contrast: this._contrast,
            });
          }

          private _syncEffectParameters(): void {
            if (!this._effect) {
              return;
            }
            this._effect.brightness = this._brightness;
            this._effect.contrast = this._contrast;
          }

          private _ensureEffectPass(target: EffectsTarget): boolean {
            const bridge = getPostProcessingBridgeForBrightnessContrast();
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
            if (parameterName === 'brightness') {
              this._brightness = value;
            }
            if (parameterName === 'contrast') {
              this._contrast = value;
            }
            this._syncEffectParameters();
          }

          getDoubleParameter(parameterName: string): number {
            if (parameterName === 'brightness') {
              return this._brightness;
            }
            if (parameterName === 'contrast') {
              return this._contrast;
            }
            return 0;
          }

          updateStringParameter(parameterName: string, value: string): void {}
          updateColorParameter(parameterName: string, value: number): void {}
          getColorParameter(parameterName: string): number {
            return 0;
          }
          updateBooleanParameter(parameterName: string, value: boolean): void {}

          getNetworkSyncData(): BrightnessAndContrastFilterNetworkSyncData {
            return {
              b: this._brightness,
              c: this._contrast,
            };
          }

          updateFromNetworkSyncData(
            data: BrightnessAndContrastFilterNetworkSyncData
          ) {
            this._brightness = data.b;
            this._contrast = data.c;
            this._syncEffectParameters();
          }
        })();
      }
    })()
  );
}
