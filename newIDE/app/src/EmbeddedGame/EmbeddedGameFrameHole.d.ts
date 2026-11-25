import * as React from 'react';

export declare const embeddedGameFrameHoleId: string;

export type ActiveEmbeddedGameFrameHoleCountCallback = (args: {
  activeEmbeddedGameFrameHoleCount: number;
}) => void;

export declare const registerActiveEmbeddedGameFrameHoleCountCallback: (
  callback: ActiveEmbeddedGameFrameHoleCountCallback
) => () => void;

export declare const registerEmbeddedGameFrameHoleResizeCallback: (
  callback: () => void
) => () => void;

export declare const getActiveEmbeddedGameFrameHoleRect: () => DOMRect | null;

export declare const EmbeddedGameFrameHole: React.ComponentType<{
  isActive: boolean;
  showRestartInGameEditorAfterErrorButton: boolean;
  onRestartInGameEditor: (reason: string) => void;
  marginBottom?: number;
}>;
