namespace gdjs {
  const getPostProcessingBridgeForDof = (): any | null => {
    const scene3dAny = (gdjs as any).scene3d;
    if (!scene3dAny) {
      return null;
    }
    const bridge = scene3dAny.postprocessing;
    if (
      !bridge ||
      typeof bridge.isAvailable !== 'function' ||
      typeof bridge.getApi !== 'function' ||
      typeof bridge.createEffectPassAdapter !== 'function' ||
      typeof bridge.getLayerThreeCamera !== 'function'
    ) {
      return null;
    }
    return bridge;
  };

  const defaultDofFocusDistance = 0.02;
  const defaultDofFocalLength = 0.05;
  const defaultDofBokehScale = 2;
  const minimumDofFocusDistance = 0;
  const maximumDofFocusDistance = 1;
  const minimumDofFocalLength = 0;
  const maximumDofFocalLength = 1;
  const minimumDofBokehScale = 0;
  const maximumDofBokehScale = 20;
  const defaultDofHeight = 480;

  const sanitizeDofFocusDistance = (value: number): number => {
    if (!Number.isFinite(value)) {
      return defaultDofFocusDistance;
    }
    return Math.max(
      minimumDofFocusDistance,
      Math.min(maximumDofFocusDistance, value)
    );
  };

  const sanitizeDofFocalLength = (value: number): number => {
    if (!Number.isFinite(value)) {
      return defaultDofFocalLength;
    }
    return Math.max(minimumDofFocalLength, Math.min(maximumDofFocalLength, value));
  };

  const sanitizeDofBokehScale = (value: number): number => {
    if (!Number.isFinite(value)) {
      return defaultDofBokehScale;
    }
    return Math.max(minimumDofBokehScale, Math.min(maximumDofBokehScale, value));
  };

  interface DepthOfFieldFilterNetworkSyncData {
    fd: number;
    fl: number;
    bs: number;
  }

  gdjs.PixiFiltersTools.registerFilterCreator(
    'Scene3D::DepthOfField',
    new (class implements gdjs.PixiFiltersTools.FilterCreator {
      makeFilter(
        target: EffectsTarget,
        effectData: EffectData
      ): gdjs.PixiFiltersTools.Filter {
        if (
          typeof THREE === 'undefined' ||
          !getPostProcessingBridgeForDof() ||
          !getPostProcessingBridgeForDof()!.isAvailable()
        ) {
          return new gdjs.PixiFiltersTools.EmptyFilter();
        }

        return new (class implements gdjs.PixiFiltersTools.Filter {
          private _effectPass: THREE_ADDONS.Pass | null = null;
          private _dofEffect: any | null = null;
          private _isEnabled = false;
          private _threeCamera: THREE.PerspectiveCamera | null = null;

          private _focusDistance = defaultDofFocusDistance;
          private _focalLength = defaultDofFocalLength;
          private _bokehScale = defaultDofBokehScale;

          private _disposeCurrentEffect(): void {
            this._dofEffect = null;
            this._effectPass = null;
            this._threeCamera = null;
          }

          private _syncEffectParameters(): void {
            if (!this._dofEffect) {
              return;
            }
            this._dofEffect.focusDistance = this._focusDistance;
            this._dofEffect.focalLength = this._focalLength;
            this._dofEffect.bokehScale = this._bokehScale;
          }

          private _ensureEffectPass(target: EffectsTarget): boolean {
            const bridge = getPostProcessingBridgeForDof();
            if (!bridge) {
              return false;
            }
            const postprocessing = bridge.getApi();
            if (!postprocessing) {
              return false;
            }
            const layerCamera = bridge.getLayerThreeCamera(target);
            if (!(layerCamera instanceof THREE.PerspectiveCamera)) {
              return false;
            }

            if (this._effectPass && this._dofEffect && this._threeCamera === layerCamera) {
              this._syncEffectParameters();
              return true;
            }

            this._disposeCurrentEffect();
            this._threeCamera = layerCamera;
            this._dofEffect = new postprocessing.DepthOfFieldEffect(layerCamera, {
              focusDistance: this._focusDistance,
              focalLength: this._focalLength,
              bokehScale: this._bokehScale,
              height: defaultDofHeight,
            });
            this._effectPass = bridge.createEffectPassAdapter(target, [
              this._dofEffect,
            ]);
            this._syncEffectParameters();
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
            if (parameterName === 'focusDistance') {
              this._focusDistance = sanitizeDofFocusDistance(value);
            }
            if (parameterName === 'focalLength') {
              this._focalLength = sanitizeDofFocalLength(value);
            }
            if (parameterName === 'bokehScale') {
              this._bokehScale = sanitizeDofBokehScale(value);
            }
            this._syncEffectParameters();
          }

          getDoubleParameter(parameterName: string): number {
            if (parameterName === 'focusDistance') {
              return this._focusDistance;
            }
            if (parameterName === 'focalLength') {
              return this._focalLength;
            }
            if (parameterName === 'bokehScale') {
              return this._bokehScale;
            }
            return 0;
          }

          updateStringParameter(parameterName: string, value: string): void {}
          updateColorParameter(parameterName: string, value: number): void {}
          getColorParameter(parameterName: string): number {
            return 0;
          }
          updateBooleanParameter(parameterName: string, value: boolean): void {}

          getNetworkSyncData(): DepthOfFieldFilterNetworkSyncData {
            return {
              fd: this._focusDistance,
              fl: this._focalLength,
              bs: this._bokehScale,
            };
          }

          updateFromNetworkSyncData(data: DepthOfFieldFilterNetworkSyncData): void {
            this._focusDistance = sanitizeDofFocusDistance(data.fd);
            this._focalLength = sanitizeDofFocalLength(data.fl);
            this._bokehScale = sanitizeDofBokehScale(data.bs);
            this._syncEffectParameters();
          }
        })();
      }
    })()
  );
}
