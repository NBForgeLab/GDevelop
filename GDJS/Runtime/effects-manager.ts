/*
 * GDevelop JS Platform
 * Copyright 2013-2021 Florian Rival (Florian.Rival@gmail.com). All rights reserved.
 * This project is released under the MIT License.
 */
namespace gdjs {
  type RendererEffects = Record<string, gdjs.EffectsTools.Filter>;
  type FilterHost = {
    filters?: any[];
  };

  /**
   * @category Core Engine > Effects
   */
  export interface EffectsTarget {
    getRuntimeScene: () => gdjs.RuntimeInstanceContainer;
    getElapsedTime: (
      instanceContainer?: gdjs.RuntimeInstanceContainer
    ) => number;
    getHeight: () => number;
    getWidth: () => number;
    isLightingLayer?: () => boolean;
    getName: () => string;
    getRendererObject: () => RendererObjectInterface | null | undefined;
    get3DRendererObject: () => THREE.Object3D | null | undefined;
    getRuntimeLayer?: () => gdjs.RuntimeLayer;
  }

  /**
   * Handle effects on renderer objects.
   */
  class RendererEffectsManager {
    initializeEffect(
      effectData: EffectData,
      rendererEffects: RendererEffects,
      target: EffectsTarget
    ): boolean {
      const filterCreator = gdjs.EffectsTools.getFilterCreator(
        effectData.effectType
      );
      if (!filterCreator) {
        console.warn(
          `Effect: "${
            effectData.name
          }", on layer: "${target.getName()}", has an unknown effect type: "${
            effectData.effectType
          }". Was it registered properly? Is the effect type correct?`
        );
        return false;
      }

      rendererEffects[effectData.name] = filterCreator.makeFilter(
        target,
        effectData
      );
      return true;
    }

    updatePreRender(rendererEffects: RendererEffects, target: EffectsTarget) {
      for (const filterName in rendererEffects) {
        const filter = rendererEffects[filterName];
        filter.updatePreRender(target);
      }
    }

    addEffect(
      effectData: EffectData,
      rendererEffects: RendererEffects,
      target: EffectsTarget
    ): boolean {
      let effectAdded = true;
      effectAdded =
        this.initializeEffect(effectData, rendererEffects, target) &&
        effectAdded;
      effectAdded =
        this.updateAllEffectParameters(rendererEffects, effectData) &&
        effectAdded;

      if (rendererEffects[effectData.name]) {
        effectAdded =
          rendererEffects[effectData.name].applyEffect(target) && effectAdded;
      }
      return effectAdded;
    }

    removeEffect(
      rendererEffects: RendererEffects,
      target: EffectsTarget,
      effectName: string
    ): boolean {
      const filter = rendererEffects[effectName];
      if (!filter) return false;

      filter.removeEffect(target);

      delete rendererEffects[effectName];
      return true;
    }

    clearEffects(rendererObject: FilterHost | null | undefined): boolean {
      if (rendererObject) {
        rendererObject.filters = [];
      }
      return true;
    }

    reorderEffects(
      rendererEffects: RendererEffects,
      target: EffectsTarget,
      effectsData: EffectData[]
    ): boolean {
      const rendererObject = target.getRendererObject() as FilterHost | null;
      if (!rendererObject) {
        return false;
      }

      const knownFilters = new Set<any>();
      for (const effectName in rendererEffects) {
        const filter = rendererEffects[effectName];
        if (filter instanceof gdjs.EffectsTools.EffectFilter) {
          knownFilters.add(filter.effectHandle);
        }
      }

      const orderedFilters: any[] = [];
      for (const effectData of effectsData) {
        const filter = rendererEffects[effectData.name];
        if (filter instanceof gdjs.EffectsTools.EffectFilter) {
          orderedFilters.push(filter.effectHandle);
        }
      }

      const existingFilters: any[] = rendererObject.filters || [];
      const extraFilters = existingFilters.filter(
        (filter) => !knownFilters.has(filter)
      );

      rendererObject.filters = orderedFilters.concat(extraFilters);
      return true;
    }

    setEffectDoubleParameter(
      rendererEffects: RendererEffects,
      name: string,
      parameterName: string,
      value: float
    ): boolean {
      const filter = rendererEffects[name];
      if (!filter) return false;
      filter.updateDoubleParameter(parameterName, value);
      return true;
    }

    setEffectStringParameter(
      rendererEffects: RendererEffects,
      name: string,
      parameterName: string,
      value: string
    ): boolean {
      const filter = rendererEffects[name];
      if (!filter) return false;
      filter.updateStringParameter(parameterName, value);
      return true;
    }

    setEffectBooleanParameter(
      rendererEffects: RendererEffects,
      name: string,
      parameterName: string,
      value: boolean
    ): boolean {
      const filter = rendererEffects[name];
      if (!filter) return false;
      filter.updateBooleanParameter(parameterName, value);
      return true;
    }

    updateAllEffectParameters(
      rendererEffects: RendererEffects,
      effectData: EffectData
    ): boolean {
      let updatedDoubles = true;
      let updatedStrings = true;
      let updatedBooleans = true;
      for (let name in effectData.doubleParameters) {
        updatedDoubles =
          this.setEffectDoubleParameter(
            rendererEffects,
            effectData.name,
            name,
            effectData.doubleParameters[name]
          ) && updatedDoubles;
      }
      for (let name in effectData.stringParameters) {
        updatedStrings =
          this.setEffectStringParameter(
            rendererEffects,
            effectData.name,
            name,
            effectData.stringParameters[name]
          ) && updatedStrings;
      }
      for (let name in effectData.booleanParameters) {
        updatedBooleans =
          this.setEffectBooleanParameter(
            rendererEffects,
            effectData.name,
            name,
            effectData.booleanParameters[name]
          ) && updatedBooleans;
      }

      return updatedDoubles && updatedStrings && updatedBooleans;
    }

    hasEffect(rendererEffects: RendererEffects, name: string): boolean {
      return !!rendererEffects[name];
    }

    enableEffect(
      rendererEffects: RendererEffects,
      target: EffectsTarget,
      name: string,
      value: boolean
    ): void {
      const filter = rendererEffects[name];
      if (!filter) return;
      filter.setEnabled(target, value);
    }

    isEffectEnabled(
      rendererEffects: RendererEffects,
      target: EffectsTarget,
      name: string
    ): boolean {
      const filter = rendererEffects[name];
      if (!filter) return false;
      return filter.isEnabled(target);
    }
  }

  /**
   * @category Core Engine > Effects
   */
  export const EffectsManager = RendererEffectsManager;
  /**
   * @category Core Engine > Effects
   */
  export type EffectsManager = RendererEffectsManager;
}
