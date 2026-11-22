import * as React from 'react';

export type WindowSizeType = 'small' | 'medium' | 'large' | 'xlarge';
export type OrientationAndWindowSizeType =
  | 'small-portrait'
  | 'medium-portrait'
  | 'large-portrait'
  | 'xlarge-portrait'
  | 'small-landscape'
  | 'medium-landscape'
  | 'large-landscape'
  | 'xlarge-landscape';

export interface WindowSize {
  windowSize: WindowSizeType;
  isMobile: boolean;
  isMediumScreen: boolean;
  isLandscape: boolean;
}

export declare const TopLevelWindowSizeProvider: React.FC<{
  children: React.ReactNode;
}>;

export declare const SpecificDimensionsWindowSizeProvider: React.FC<{
  children: React.ReactNode;
  innerWidth: number | null;
  innerHeight: number | null;
}>;

export declare const ResponsiveWindowMeasurer: React.FC<{
  children: (windowSize: WindowSize) => React.ReactNode;
}>;

export declare const useResponsiveWindowSize: () => WindowSize;
