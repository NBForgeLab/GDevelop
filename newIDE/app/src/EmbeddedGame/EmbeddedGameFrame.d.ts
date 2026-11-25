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
  elevationAngle: number;
  distance: number;
};

export declare const setEditorHotReloadNeeded: (
  hotReloadSteps: HotReloadSteps
) => void;

export declare const isEditorHotReloadNeeded: () => boolean;

export declare const EmbeddedGameFrame: React.ComponentType<any>;

export type ChangeViewPositionCommand =
  | 'centerViewOnLastSelectedInstance'
  | 'zoomToInitialPosition'
  | 'zoomToFitContent'
  | 'zoomToFitSelection';

export declare const setEmbeddedGameFramePreviewLocation: (options: {
  previewIndexHtmlLocation: string;
}) => void;

export declare const changeViewPosition: (
  command: ChangeViewPositionCommand
) => void;

export declare const setCameraState: (
  editorId: string,
  cameraState: EditorCameraState
) => void;

export declare const preventGameFramePointerEvents: (enabled: boolean) => void;
