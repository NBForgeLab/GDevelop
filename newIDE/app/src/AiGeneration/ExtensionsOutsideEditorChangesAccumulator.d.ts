import { type ExtensionsOutsideEditorChanges } from '../EditorFunctions/OutsideEditorChanges';

export type ExtensionsOutsideEditorChangesAccumulator = {
  add: (changes: ExtensionsOutsideEditorChanges) => void;
  isEmpty: () => boolean;
  flush: () => ExtensionsOutsideEditorChanges;
};

export declare const makeExtensionsOutsideEditorChangesAccumulator: () => ExtensionsOutsideEditorChangesAccumulator;

export declare const doExtensionChangesNeedCodeRegeneration: (
  changes: ExtensionsOutsideEditorChanges
) => boolean;
