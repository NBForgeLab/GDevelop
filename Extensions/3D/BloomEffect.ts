namespace gdjs {
  const getPostProcessingBridge = (): any | null => {
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

  const defaultBloomStrength = 0.35;
  const defaultBloomRadius = 0.4;
  const defaultBloomThreshold = 0.85;
  const defaultBloomThresholdSmoothing = 0.03;
  const maximumBloomStrength = 3;
  const minimumBloomStrength = 0;
  const maximumBloomRadius = 1;
  const minimumBloomRadius = 0;
  const maximumBloomThreshold = 1;
  const minimumBloomThreshold = 0;

  const sanitizeBloomStrength = (value: number): number => {
    if (!Number.isFinite(value)) {
      return defaultBloomStrength;
    }
    return Math.max(minimumBloomStrength, Math.min(maximumBloomStrength, value));
  };

  const sanitizeBloomRadius = (value: number): number => {
    if (!Number.isFinite(value)) {
      return defaultBloomRadius;
    }
    return Math.max(minimumBloomRadius, Math.min(maximumBloomRadius, value));
  };

  const sanitizeBloomThreshold = (value: number): number => {
    if (!Number.isFinite(value)) {
      return defaultBloomThreshold;
    }
    return Math.max(
      minimumBloomThreshold,
      Math.min(maximumBloomThreshold, value)
    );
  };

  interface BloomFilterNetworkSyncData {
    s: number;
    r: number;
    t: number;
  }

  gdjs.PixiFiltersTools.registerFilterCreator(
    'Scene3D::Bloom',
    new (class implements gdjs.PixiFiltersTools.FilterCreator {
      makeFilter(
        target: EffectsTarget,
        effectData: EffectData
      ): gdjs.PixiFiltersTools.Filter {
        if (
          typeof THREE === 'undefined' ||
          !getPostProcessingBridge() ||
          !getPostProcessingBridge()!.isAvailable()
        ) {
          return new gdjs.PixiFiltersTools.EmptyFilter();
        }

        return new (class implements gdjs.PixiFiltersTools.Filter {
          private _bloomEffect: any | null = null;
          private _effectPass: THREE_ADDONS.Pass | null = null;
          private _isEnabled = false;

          constructor() {
            this._bloomEffect = this._createBloomEffect();
          }

          private _createBloomEffect(): any | null {
            const bridge = getPostProcessingBridge();
            if (!bridge) {
              return null;
            }
            const postprocessing = bridge.getApi();
            if (
              !postprocessing ||
              typeof postprocessing.BloomEffect !== 'function'
            ) {
              return null;
            }
            const bloomEffect = new postprocessing.BloomEffect({
              intensity: defaultBloomStrength,
              luminanceThreshold: defaultBloomThreshold,
              luminanceSmoothing: defaultBloomThresholdSmoothing,
              mipmapBlur: true,
            });
            this._setBloomRadiusOnEffect(bloomEffect, defaultBloomRadius);
            return bloomEffect;
          }

          private _setBloomRadiusOnEffect(
            bloomEffect: any,
            radiusValue: number
          ): void {
            if (
              bloomEffect.mipmapBlurPass &&
              typeof bloomEffect.mipmapBlurPass.radius === 'number'
            ) {
              bloomEffect.mipmapBlurPass.radius = radiusValue;
              return;
            }
            if (typeof bloomEffect.radius === 'number') {
              bloomEffect.radius = radiusValue;
            }
          }

          private _setBloomThresholdOnEffect(
            bloomEffect: any,
            thresholdValue: number
          ): void {
            if (
              bloomEffect.luminanceMaterial &&
              typeof bloomEffect.luminanceMaterial.threshold === 'number'
            ) {
              bloomEffect.luminanceMaterial.threshold = thresholdValue;
              return;
            }
            if (typeof bloomEffect.luminanceThreshold === 'number') {
              bloomEffect.luminanceThreshold = thresholdValue;
            }
          }

          private _getBloomRadiusFromEffect(): number {
            const bloomEffect = this._bloomEffect;
            if (!bloomEffect) {
              return defaultBloomRadius;
            }
            if (
              bloomEffect.mipmapBlurPass &&
              typeof bloomEffect.mipmapBlurPass.radius === 'number'
            ) {
              return bloomEffect.mipmapBlurPass.radius;
            }
            if (typeof bloomEffect.radius === 'number') {
              return bloomEffect.radius;
            }
            return defaultBloomRadius;
          }

          private _getBloomThresholdFromEffect(): number {
            const bloomEffect = this._bloomEffect;
            if (!bloomEffect) {
              return defaultBloomThreshold;
            }
            if (
              bloomEffect.luminanceMaterial &&
              typeof bloomEffect.luminanceMaterial.threshold === 'number'
            ) {
              return bloomEffect.luminanceMaterial.threshold;
            }
            if (typeof bloomEffect.luminanceThreshold === 'number') {
              return bloomEffect.luminanceThreshold;
            }
            return defaultBloomThreshold;
          }

          private _ensureEffectPass(target: EffectsTarget): boolean {
            const bridge = getPostProcessingBridge();
            if (!bridge) {
              return false;
            }
            if (this._effectPass) {
              return true;
            }
            if (!this._bloomEffect) {
              this._bloomEffect = this._createBloomEffect();
            }
            if (!this._bloomEffect) {
              return false;
            }
            this._effectPass = bridge.createEffectPassAdapter(target, [
              this._bloomEffect,
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

          updatePreRender(target: gdjs.EffectsTarget): any {}

          updateDoubleParameter(parameterName: string, value: number): void {
            if (!this._bloomEffect) {
              return;
            }
            if (parameterName === 'strength') {
              this._bloomEffect.intensity = sanitizeBloomStrength(value);
            }
            if (parameterName === 'radius') {
              this._setBloomRadiusOnEffect(
                this._bloomEffect,
                sanitizeBloomRadius(value)
              );
            }
            if (parameterName === 'threshold') {
              this._setBloomThresholdOnEffect(
                this._bloomEffect,
                sanitizeBloomThreshold(value)
              );
            }
          }

          getDoubleParameter(parameterName: string): number {
            if (!this._bloomEffect) {
              return 0;
            }
            if (parameterName === 'strength') {
              return this._bloomEffect.intensity;
            }
            if (parameterName === 'radius') {
              return this._getBloomRadiusFromEffect();
            }
            if (parameterName === 'threshold') {
              return this._getBloomThresholdFromEffect();
            }
            return 0;
          }

          updateStringParameter(parameterName: string, value: string): void {}
          updateColorParameter(parameterName: string, value: number): void {}
          getColorParameter(parameterName: string): number {
            return 0;
          }
          updateBooleanParameter(parameterName: string, value: boolean): void {}

          getNetworkSyncData(): BloomFilterNetworkSyncData {
            return {
              s: this._bloomEffect ? this._bloomEffect.intensity : defaultBloomStrength,
              r: this._getBloomRadiusFromEffect(),
              t: this._getBloomThresholdFromEffect(),
            };
          }

          updateFromNetworkSyncData(data: BloomFilterNetworkSyncData) {
            if (!this._bloomEffect) {
              this._bloomEffect = this._createBloomEffect();
              if (!this._bloomEffect) {
                return;
              }
            }
            this._bloomEffect.intensity = sanitizeBloomStrength(data.s);
            this._setBloomRadiusOnEffect(
              this._bloomEffect,
              sanitizeBloomRadius(data.r)
            );
            this._setBloomThresholdOnEffect(
              this._bloomEffect,
              sanitizeBloomThreshold(data.t)
            );
          }
        })();
      }
    })()
  );
}
