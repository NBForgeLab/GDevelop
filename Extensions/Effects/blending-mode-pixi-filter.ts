namespace gdjs {
  interface BlendingModeFilterNetworkSyncData {
    a: number;
    bm: number;
  }
  gdjs.PixiFiltersTools.registerFilterCreator(
    'BlendingMode',
    new (class extends gdjs.PixiFiltersTools.PixiFilterCreator {
      makePIXIFilter(target: EffectsTarget, effectData) {
        const blendingModeFilter = new PIXI.AlphaFilter();
        return blendingModeFilter;
      }
      updatePreRender(filter: PIXI.Filter, target: EffectsTarget) {}
      updateDoubleParameter(
        filter: PIXI.Filter,
        parameterName: string,
        value: number
      ) {
        const blendingModeFilter = filter as unknown as PIXI.AlphaFilter;
        if (parameterName === 'alpha') {
          blendingModeFilter.alpha = value;
        } else if (parameterName === 'blendmode') {
          blendingModeFilter.blendMode =
            gdjs.PixiFiltersTools.toPixiBlendMode(value);
        }
      }
      getDoubleParameter(filter: PIXI.Filter, parameterName: string): number {
        const blendingModeFilter = filter as unknown as PIXI.AlphaFilter;
        if (parameterName === 'alpha') {
          return blendingModeFilter.alpha;
        }
        if (parameterName === 'blendmode') {
          return gdjs.PixiFiltersTools.toGDevelopBlendMode(
            blendingModeFilter.blendMode
          );
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
      getNetworkSyncData(
        filter: PIXI.Filter
      ): BlendingModeFilterNetworkSyncData {
        const blendingModeFilter = filter as unknown as PIXI.AlphaFilter;
        return {
          a: blendingModeFilter.alpha,
          bm: gdjs.PixiFiltersTools.toGDevelopBlendMode(
            blendingModeFilter.blendMode
          ),
        };
      }
      updateFromNetworkSyncData(
        filter: PIXI.Filter,
        data: BlendingModeFilterNetworkSyncData
      ) {
        const blendingModeFilter = filter as unknown as PIXI.AlphaFilter;
        blendingModeFilter.alpha = data.a;
        blendingModeFilter.blendMode =
          gdjs.PixiFiltersTools.toPixiBlendMode(data.bm);
      }
    })()
  );
}
