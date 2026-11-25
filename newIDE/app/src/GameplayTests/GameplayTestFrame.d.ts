export type GameplayTestFrameHiddenPause = {
  pausedMs: number;
  isRunInterrupted: boolean;
};

export declare const setGameplayTestFramePreviewLocation: (options: {
  previewIndexHtmlLocation: string;
  gameResolution: { width: number; height: number };
}) => void;
