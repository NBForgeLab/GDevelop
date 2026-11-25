import { type AiRequestFunctionCallOutput } from '../Utils/GDevelopServices/Generation';
import { type GameCrashReport } from '../Utils/GDevelopServices/Analytics';

export type InGameEditorExtensionError = {
  id: number;
  key: string;
  extensionName: string | null;
  phase: string;
  type: string | null;
  message: string;
  stack: string;
  count: number;
};

export declare const setLatestInGameEditorExtensionErrors: (
  errors: Array<InGameEditorExtensionError>
) => void;

export declare const getLatestInGameEditorExtensionErrors: () => Array<InGameEditorExtensionError>;

export declare const isInGameEditorExtensionErrorFromStore: (
  project: gdProject | null | undefined,
  error: InGameEditorExtensionError
) => boolean;

export declare const buildInGameEditorExtensionErrorGameCrashReport: (
  project: gdProject,
  error: InGameEditorExtensionError
) => GameCrashReport;

export declare const getInGameEditorExtensionErrorOrigin: (
  error: InGameEditorExtensionError
) => string;

export declare const getInGameEditorExtensionErrorCallChain: (
  stack: string
) => string | null;

export declare const getAskAiToFixInGameEditorExtensionErrorsText: (
  errors: Array<InGameEditorExtensionError>
) => string;

export declare const addInGameEditorExtensionErrorsToFunctionCallOutputs: (options: {
  functionCallOutputs: Array<AiRequestFunctionCallOutput>;
  errors: Array<InGameEditorExtensionError>;
  givenErrorIds: Set<number>;
  project: gdProject | null | undefined;
}) => {
  functionCallOutputs: Array<AiRequestFunctionCallOutput>;
  newlyGivenErrorIds: Array<number>;
};
