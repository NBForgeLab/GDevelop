import * as React from 'react';
import type { ResourceManagementProps } from '../ResourcesList/ResourceSource';
import type { ProjectScopedContainersAccessor } from '../InstructionOrExpression/EventsScope';

export declare const desktopIconSizes: Array<number>;
export declare const androidIconSizes: Array<number>;
export declare const androidWindowSplashScreenAnimatedIconRecommendedSize: number;
export declare const iosIconSizes: Array<number>;

export type Props = {
  project: gdProject;
  resourceManagementProps: ResourceManagementProps;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  desktopIconResourceNames: Array<string>;
  onDesktopIconResourceNamesChanged: (names: Array<string>) => void;
  androidIconResourceNames: Array<string>;
  onAndroidIconResourceNamesChanged: (names: Array<string>) => void;
  androidWindowSplashScreenAnimatedIconResourceName: string;
  onAndroidWindowSplashScreenAnimatedIconResourceNameChanged: (
    name: string
  ) => void;
  iosIconResourceNames: Array<string>;
  onIosIconResourceNamesChanged: (names: Array<string>) => void;
};

declare const PlatformSpecificAssetsWithErrorBoundary: React.ComponentType<Props>;
export default PlatformSpecificAssetsWithErrorBoundary;
