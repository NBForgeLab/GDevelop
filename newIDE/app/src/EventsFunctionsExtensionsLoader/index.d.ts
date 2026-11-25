import { type I18n as I18nType } from '@lingui/core';

export type EventsFunctionCodeWriter = {
  getIncludeFileFor: (functionName: string) => string;
  writeFunctionCode: (functionName: string, code: string) => Promise<void>;
  writeBehaviorCode: (behaviorName: string, code: string) => Promise<void>;
  writeObjectCode: (objectName: string, code: string) => Promise<void>;
};

export type IncludeFileContent = {
  includeFile: string;
  content: string;
};

export type EventsFunctionCodeWriterCallbacks = {
  onWriteFile: (content: IncludeFileContent) => void;
};

export declare const loadProjectEventsFunctionsExtensions: (
  project: gdProject,
  eventsFunctionCodeWriter: EventsFunctionCodeWriter,
  i18n: I18nType
) => Promise<Array<void>>;

export declare const reloadProjectEventsFunctionsExtensionMetadata: (
  project: gdProject,
  eventsFunctionsExtension: gdEventsFunctionsExtension,
  eventsFunctionCodeWriter: EventsFunctionCodeWriter,
  i18n: I18nType
) => void;

export declare const unloadProjectEventsFunctionsExtensions: (
  project: gdProject
) => Promise<Array<void>>;

export declare const unloadProjectEventsFunctionsExtension: (
  project: gdProject,
  extensionName: string
) => void;

export declare const isAnEventFunctionMetadata: (
  instructionOrExpression: gdInstructionMetadata | gdExpressionMetadata
) => boolean;

export declare const getFunctionNameFromType: (
  type: string
) =>
  | { behaviorName: string; extensionName: string; name: string }
  | { behaviorName: string | undefined; extensionName: string; name: string };

export declare const getFreeEventsFunctionType: (
  extensionName: string,
  eventsFunction: gdEventsFunction
) => string;

export declare const ParametersIndexOffsets: Readonly<{
  FreeFunction: number;
  BehaviorFunction: number;
  ObjectFunction: number;
}>;
