import * as React from 'react';

export type IframePosition = {
  isMobile: boolean;
  top: number;
  left: number;
  width: number;
  height: number;
};

export declare const GAMES_PLATFORM_IFRAME_ID: string;
export declare const gamesPlatformEmbeddedVersion: string;

export type Props = {
  loaded: boolean;
  visible: boolean;
  initialGameId: string | null | undefined;
  iframePosition: IframePosition | null | undefined;
};

declare const GamesPlatformFrame: React.ComponentType<Props>;
export default GamesPlatformFrame;
