import type { ShortcutMap } from './DefaultShortcuts';

type KeyEventLike = {
  readonly keyCode?: number;
  readonly which?: any;
  readonly code?: string;
  readonly metaKey: boolean;
  readonly ctrlKey: boolean;
  readonly altKey: boolean;
  readonly shiftKey: boolean;
};

export declare const getShortcutStringFromEvent: (e: KeyEventLike) => string;
export declare const isValidShortcutEvent: (e: KeyEventLike) => boolean;
export declare const getShortcutMetadataFromEvent: (e: KeyEventLike) => {
  shortcutString: string;
  isValid: boolean;
};
export declare const useShortcutMap: () => ShortcutMap;
export declare const getShortcutDisplayName: (
  shortcutString: string | null | undefined
) => string;
export declare const getElectronAccelerator: (shortcutString: string) => string;
