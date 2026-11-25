export type InGameEditorUnavailabilityReason =
  | 'webgl2-not-supported'
  | 'renderer-creation-failed';

export declare const setInGameEditorRendererCreationFailed: (
  failed: boolean
) => void;

export declare const useInGameEditorUnavailabilityReason: () => InGameEditorUnavailabilityReason | null;
