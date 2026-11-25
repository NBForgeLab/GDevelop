export type InGameEditorRay = {
  from: [number, number, number];
  to: [number, number, number];
  excludedInstanceUuid?: string;
};

export type InGameEditorRaycastRequest = {
  rays: Array<InGameEditorRay>;
  mode: '3d' | '2d';
  includedObjectNames: Array<string> | null;
  excludedObjectNames: Array<string>;
  excludedInstanceUuids: Array<string>;
};

export type InGameEditorRaycastHit = {
  x: number;
  y: number;
  z: number;
  objectName: string;
  instanceUuid: string | null;
};

export type InGameEditorEditedLocation = {
  sceneName: string | null;
  externalLayoutName: string | null;
  eventsBasedObjectType: string | null;
  eventsBasedObjectVariantName: string | null;
};

export type InGameEditorRaycastResult = {
  editedLocation: InGameEditorEditedLocation | null;
  hits: Array<InGameEditorRaycastHit | null>;
};

export type InGameEditorStatus = 'disabled' | 'updating' | 'up-to-date';

export declare const registerInGameEditorQueryHandlers: (
  handlers: {
    update: () => InGameEditorStatus;
    enable: () => void;
    raycast: (
      request: InGameEditorRaycastRequest
    ) => Promise<InGameEditorRaycastResult>;
  } | null
) => void;

export declare const updateInGameEditor: () => InGameEditorStatus;

export declare const enableInGameEditor: () => void;

export declare const raycastInGameEditor: (
  request: InGameEditorRaycastRequest
) => Promise<InGameEditorRaycastResult>;
