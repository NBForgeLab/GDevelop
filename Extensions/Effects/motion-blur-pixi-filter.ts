namespace gdjs {
  interface MotionBlurFilterNetworkSyncData {
    vx: number;
    vy: number;
    ks: number;
    o: number;
  }
  gdjs.PixiFiltersTools.registerFilterCreator(
    'MotionBlur',
    new (class extends gdjs.PixiFiltersTools.PixiFilterCreator {
      makePIXIFilter(target: EffectsTarget, effectData) {
        const motionBlurFilter = new PIXI.filters.MotionBlurFilter({
          velocity: { x: 0, y: 0 },
        });
        return motionBlurFilter;
      }
      updatePreRender(filter: PIXI.Filter, target: EffectsTarget) {}
      updateDoubleParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: number
      ) {
        const motionBlurFilter = filter as PIXI.filters.MotionBlurFilter;
        if (parameterName === 'velocityX') {
          motionBlurFilter.velocityX = value;
        } else if (parameterName === 'velocityY') {
          motionBlurFilter.velocityY = value;
        } else if (parameterName === 'kernelSize') {
          motionBlurFilter.kernelSize = value;
        } else if (parameterName === 'offset') {
          motionBlurFilter.offset = value;
        }
      }
      getDoubleParameter(filter: PIXI.Filter, parameterName: string): number {
        const motionBlurFilter = filter as PIXI.filters.MotionBlurFilter;
        if (parameterName === 'velocityX') {
          return motionBlurFilter.velocityX;
        }
        if (parameterName === 'velocityY') {
          return motionBlurFilter.velocityY;
        }
        if (parameterName === 'kernelSize') {
          return motionBlurFilter.kernelSize;
        }
        if (parameterName === 'offset') {
          return motionBlurFilter.offset;
        }
        return 0;
      }
      updateStringParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: string
      ) {}
      updateColorParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: number
      ): void {}
      getColorParameter(filter: PIXI.Filter, parameterName: string): number {
        return 0;
      }
      updateBooleanParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: boolean
      ) {}
      getNetworkSyncData(filter: PIXI.Filter): MotionBlurFilterNetworkSyncData {
        const motionBlurFilter = filter as PIXI.filters.MotionBlurFilter;
        return {
          vx: motionBlurFilter.velocityX,
          vy: motionBlurFilter.velocityY,
          ks: motionBlurFilter.kernelSize,
          o: motionBlurFilter.offset,
        };
      }
      updateFromNetworkSyncData(
        filter: PIXI.Filter,
        data: MotionBlurFilterNetworkSyncData
      ) {
        const motionBlurFilter = filter as PIXI.filters.MotionBlurFilter;
        motionBlurFilter.velocityX = data.vx;
        motionBlurFilter.velocityY = data.vy;
        motionBlurFilter.kernelSize = data.ks;
        motionBlurFilter.offset = data.o;
      }
    })()
  );
}
