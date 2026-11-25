import * as React from 'react';

export type PreviewInGameEditorTarget = {
  editorId: string;
  sceneName: string | null;
  externalLayoutName: string | null;
  eventsBasedObjectType: string | null;
  eventsBasedObjectVariantName: string | null;
};

export type HotReloadSteps = {
  shouldReloadProjectData: boolean;
  shouldReloadLibraries: boolean;
  shouldReloadResources: boolean;
  shouldHardReload: boolean;
  reasons: Array<string>;
};

export type EditorCameraState = {
  cameraMode: 'free' | 'orbit';
  positionX: number;
  positionY: number;
  positionZ: number;
  rotationAngle: number;
  rotationX: number;
  rotationY: number;
  distance: number;
};

export declare const setEditorHotReloadNeeded: (
  hotReloadSteps: HotReloadSteps
) => void;

export declare const isEditorHotReloadNeeded: () => boolean;

export declare const EmbeddedGameFrame: React.ComponentType<any>;
