export declare const sendErrorMessage: (
  message: string,
  type:
    | 'error'
    | 'error-boundary_mainframe'
    | 'error-boundary_list-search-result'
    | 'error-boundary_box-search-result'
    | 'error-boundary_app'
    | 'error-boundary_extension-loader',
  rawError: any,
  errorId: string
) => void;

export declare const sendExternalEditorOpened: (editorName: string) => void;

export declare const sendBehaviorAdded: (metadata: {
  behaviorType: string;
  parentEditor: 'behaviors-editor' | 'instruction-editor-dialog';
}) => void;

export declare const sendBehaviorsEditorShown: (metadata: {
  parentEditor: 'object-editor-dialog';
}) => void;

export declare const sendAiRequestStarted: (metadata: {
  simplifiedProjectJsonLength: number;
  projectSpecificExtensionsSummaryJsonLength: number;
  payWithCredits: boolean;
  storageProviderName: string | null;
  mode: string;
  aiRequestId: string;
}) => void;

export declare const sendAiRequestMessageSent: (metadata: {
  simplifiedProjectJsonLength: number;
  projectSpecificExtensionsSummaryJsonLength: number;
  payWithCredits: boolean;
  mode: string;
  aiRequestId: string;
  outputLength: number;
}) => void;
