import * as React from 'react';
import { type SerializedExtension } from '../Utils/GDevelopServices/Extension';

type EventsFunctionsExtensionOpener = {
  chooseEventsFunctionExtensionFile: () => Promise<Array<any>>;
  readEventsFunctionExtensionFile: (
    filepath: any
  ) => Promise<SerializedExtension>;
  chooseAssetPackFile: () => Promise<any>;
  readAssetPackFile: (filepath: any) => Promise<Blob>;
};

type EventsFunctionsExtensionWriter = {
  chooseEventsFunctionExtensionFile: (
    extensionName?: string
  ) => Promise<string | null | undefined>;
  writeSerializedObject: (
    serializedObject: Record<string, any>,
    filepath: string
  ) => Promise<void>;
};

export type EventsFunctionsExtensionsState = {
  eventsFunctionsExtensionsError: Error | null | undefined;
  loadProjectEventsFunctionsExtensions: (
    project: gdProject | null | undefined
  ) => Promise<void>;
  unloadProjectEventsFunctionsExtensions: (project: gdProject) => void;
  unloadProjectEventsFunctionsExtension: (
    project: gdProject,
    extensionName: string
  ) => void;
  reloadProjectEventsFunctionsExtensions: (
    project: gdProject | null | undefined
  ) => Promise<void>;
  reloadProjectEventsFunctionsExtensionMetadata: (
    project: gdProject | null | undefined,
    extension: gdEventsFunctionsExtension
  ) => void;
  getEventsFunctionsExtensionWriter: () =>
    | EventsFunctionsExtensionWriter
    | null
    | undefined;
  getEventsFunctionsExtensionOpener: () =>
    | EventsFunctionsExtensionOpener
    | null
    | undefined;
  ensureLoadFinished: () => Promise<void>;
  getIncludeFileHashs: () => { [file: string]: number };
};

declare const EventsFunctionsExtensionsContext: React.Context<EventsFunctionsExtensionsState>;

export default EventsFunctionsExtensionsContext;
