namespace gdjs {
  const logger = new gdjs.Logger('Effects tools');
  const additiveBlendMode = 1;
  type EffectHandle = {
    enabled?: boolean;
    blendMode?: any;
  };
  type FilterHost = {
    filters?: any[];
  };

  /**
   * @category Core Engine > Effects
   */
  export namespace EffectsTools {
    export const clampValue = function (value, min, max) {
      return Math.max(min, Math.min(max, value));
    };

    export const clampKernelSize = function (value, min, max) {
      const len = Math.round((max - min) / 2 + 1);
      const arr = new Array(len);
      for (let i = 0; i < len; i++) {
        arr[i] = min + 2 * i;
      }
      return arr.indexOf(value) !== -1 ? value : min;
    };

    const _filterCreators: {
      [filterName: string]: FilterCreator;
    } = {};

    /**
     * Return the creator for the filter with the given name, if any.
     * @param filterName The name of the filter to get
     * @return The filter creator, if any (null otherwise).
     * @category Core Engine > Effects
     */
    export const getFilterCreator = function (
      filterName: string
    ): FilterCreator | null {
      if (_filterCreators.hasOwnProperty(filterName)) {
        return _filterCreators[filterName];
      }
      return null;
    };

    /**
     * Register a new filter creator, to be used by GDJS.
     * @param filterName The name of the filter to get
     * @param filterCreator The object used to create the filter.
     * @category Core Engine > Effects
     */
    export const registerFilterCreator = function (
      filterName: string,
      filterCreator: FilterCreator
    ) {
      if (_filterCreators.hasOwnProperty(filterName)) {
        logger.warn(
          'Filter "' +
            filterName +
            '" was already registered in gdjs.EffectsTools. Replacing it with the new one.'
        );
      }
      _filterCreators[filterName] = filterCreator;
    };

    /** A wrapper allowing to create an effect. */
    export interface FilterCreator {
      /** Function to call to create the filter */
      makeFilter(target: EffectsTarget, effectData: EffectData): Filter;
    }

    /**
     * An effect.
     * @category Core Engine > Effects
     */
    export interface Filter {
      /**
       * Check if an effect is enabled.
       * @return true if the filter is enabled
       */
      isEnabled(target: EffectsTarget): boolean;
      /**
       * Enable an effect.
       * @param enabled Set to true to enable, false to disable
       */
      setEnabled(target: EffectsTarget, enabled: boolean): boolean;
      /**
       * Apply the effect on the renderer object.
       * Called after the effect is initialized.
       */
      applyEffect(target: EffectsTarget): boolean;
      removeEffect(target: EffectsTarget): boolean;
      /** The function to be called to update the filter at every frame before the rendering. */
      updatePreRender(target: gdjs.EffectsTarget): any;
      /** The function to be called to update a parameter (with a number) */
      updateDoubleParameter(parameterName: string, value: number): void;
      /** The function to be called to update a parameter (with a string) */
      updateStringParameter(parameterName: string, value: string): void;
      /** The function to be called to update a parameter (with a boolean) */
      updateBooleanParameter(parameterName: string, value: boolean): void;
      updateColorParameter(parameterName: string, value: number): void;
      getDoubleParameter(parameterName: string): number;
      getColorParameter(parameterName: string): number;
      getNetworkSyncData(): any;
      updateFromNetworkSyncData(syncData: any): void;
    }

    /**
     * A wrapper allowing to create a filter and update it using a common interface
     * @category Effects > Filters
     */
    export abstract class EffectCreator implements FilterCreator {
      /** Function to call to create the filter */
      makeFilter(target: EffectsTarget, effectData: EffectData): Filter {
        const effectHandle = this.makeEffectHandle(target, effectData);
        if (
          target.isLightingLayer &&
          target.isLightingLayer() &&
          effectHandle
        ) {
          effectHandle.blendMode = additiveBlendMode;
        }
        return new EffectFilter(effectHandle, this);
      }
      /** Function to call to create the effect handle */
      abstract makeEffectHandle(
        target: EffectsTarget,
        effectData: EffectData
      ): EffectHandle;
      /** The function to be called to update the filter at every frame before the rendering. */
      abstract updatePreRender(
        filter: EffectHandle,
        target: gdjs.EffectsTarget
      ): any;
      /** The function to be called to update a parameter (with a number) */
      abstract updateDoubleParameter(
        filter: EffectHandle,
        parameterName: string,
        value: number
      ): void;
      /** The function to be called to update a parameter (with a string) */
      abstract updateStringParameter(
        filter: EffectHandle,
        parameterName: string,
        value: string
      ): void;
      /** The function to be called to update a parameter (with a boolean) */
      abstract updateBooleanParameter(
        filter: EffectHandle,
        parameterName: string,
        value: boolean
      ): void;
      abstract updateColorParameter(
        filter: EffectHandle,
        parameterName: string,
        value: number
      ): void;
      abstract getDoubleParameter(
        filter: EffectHandle,
        parameterName: string
      ): number;
      abstract getColorParameter(
        filter: EffectHandle,
        parameterName: string
      ): number;
      abstract getNetworkSyncData(filter: EffectHandle): any;
      abstract updateFromNetworkSyncData(
        filter: EffectHandle,
        syncData: any
      ): void;
    }

    /**
     * An effect used to manipulate a filter.
     * @category Core Engine > Effects
     */
    export class EffectFilter implements Filter {
      /** The wrapped effect handle */
      effectHandle: EffectHandle;
      filterCreator: gdjs.EffectsTools.EffectCreator;

      constructor(
        effectHandle: EffectHandle,
        filterCreator: gdjs.EffectsTools.EffectCreator
      ) {
        this.effectHandle = effectHandle;
        this.filterCreator = filterCreator;
      }

      isEnabled(target: EffectsTarget): boolean {
        return !!this.effectHandle.enabled;
      }

      setEnabled(target: EffectsTarget, enabled: boolean): boolean {
        this.effectHandle.enabled = enabled;
        return enabled;
      }

      applyEffect(target: EffectsTarget): boolean {
        const rendererObject = target.getRendererObject() as FilterHost | null;
        if (!rendererObject) {
          return false;
        }
        rendererObject.filters = (rendererObject.filters || []).concat(
          this.effectHandle
        );
        return true;
      }

      removeEffect(target: EffectsTarget): boolean {
        const rendererObject = target.getRendererObject() as FilterHost | null;
        if (!rendererObject) {
          return false;
        }
        rendererObject.filters = (rendererObject.filters || []).filter(
          (filter) => filter !== this.effectHandle
        );
        return true;
      }

      updatePreRender(target: gdjs.EffectsTarget): any {
        this.filterCreator.updatePreRender(this.effectHandle, target);
      }

      updateDoubleParameter(parameterName: string, value: number): void {
        this.filterCreator.updateDoubleParameter(
          this.effectHandle,
          parameterName,
          value
        );
      }

      updateStringParameter(parameterName: string, value: string): void {
        this.filterCreator.updateStringParameter(
          this.effectHandle,
          parameterName,
          value
        );
      }

      updateBooleanParameter(parameterName: string, value: boolean): void {
        this.filterCreator.updateBooleanParameter(
          this.effectHandle,
          parameterName,
          value
        );
      }

      updateColorParameter(parameterName: string, value: number): void {
        this.filterCreator.updateColorParameter(
          this.effectHandle,
          parameterName,
          value
        );
      }

      getDoubleParameter(parameterName: string): number {
        return this.filterCreator.getDoubleParameter(
          this.effectHandle,
          parameterName
        );
      }

      getColorParameter(parameterName: string): number {
        return this.filterCreator.getColorParameter(
          this.effectHandle,
          parameterName
        );
      }

      getNetworkSyncData(): any {
        return {
          ena: !!this.effectHandle.enabled,
          fc: this.filterCreator.getNetworkSyncData(this.effectHandle),
        };
      }

      updateFromNetworkSyncData(syncData: any): void {
        this.effectHandle.enabled = syncData.ena;
        this.filterCreator.updateFromNetworkSyncData(
          this.effectHandle,
          syncData.fc
        );
      }
    }

    /**
     * @category Core Engine > Effects
     */
    export class EmptyFilter implements Filter {
      isEnabled(target: EffectsTarget): boolean {
        return false;
      }
      setEnabled(target: EffectsTarget, enabled: boolean): boolean {
        return false;
      }
      applyEffect(target: EffectsTarget): boolean {
        return false;
      }
      removeEffect(target: EffectsTarget): boolean {
        return false;
      }
      updatePreRender(target: gdjs.EffectsTarget): any {}
      updateDoubleParameter(parameterName: string, value: number): void {}
      updateStringParameter(parameterName: string, value: string): void {}
      updateBooleanParameter(parameterName: string, value: boolean): void {}
      updateColorParameter(parameterName: string, value: number): void {}
      getDoubleParameter(parameterName: string): number {
        return 0;
      }
      getColorParameter(parameterName: string): number {
        return 0;
      }
      getNetworkSyncData(): any {
        return {};
      }
      updateFromNetworkSyncData(syncData: any): void {}
    }
  }
}
