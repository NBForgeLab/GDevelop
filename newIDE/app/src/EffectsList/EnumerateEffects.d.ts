import { type Schema } from '../PropertiesEditor/PropertiesEditorSchema';

export type EnumeratedEffectMetadata = {
  extension: gdPlatformExtension;
  effectMetadata: gdEffectMetadata;
  type: string;
  fullName: string;
  description: string;
  parametersSchema: Schema;
  isMarkedAsNotWorkingForObjects: boolean;
  isMarkedAsOnlyWorkingFor2D: boolean;
  isMarkedAsOnlyWorkingFor3D: boolean;
};

export declare const enumerateEffectsMetadata: (
  project: gdProject
) => Array<EnumeratedEffectMetadata>;

export declare const enumerateEffectNames: (
  effectsContainer: gdEffectsContainer
) => Array<string>;

export declare const setEffectDefaultParameters: (
  effect: gdEffect,
  effectMetadata: gdEffectMetadata
) => void;
