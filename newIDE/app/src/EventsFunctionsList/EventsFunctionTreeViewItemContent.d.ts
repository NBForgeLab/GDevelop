export declare const EVENTS_FUNCTION_CLIPBOARD_KIND: string;

export declare const pasteEventsFunction: (options: {
  project: gdProject;
  eventsFunctionsContainer: gdEventsFunctionsContainer;
  parentFolder: gdFunctionFolderOrFunction;
  insertionIndex: number;
  isTargetFreeFunction: boolean;
}) => gdEventsFunction | null;

export declare const getFunctionIconUrl: (
  functionType: EventsFunction_FunctionType,
  functionName?: string | null
) => string;

export type EventsFunctionCreationParameters = {
  functionType: EventsFunction_FunctionType;
  name: string | null | undefined;
};

export type EventsFunctionCallbacks = {
  onSelectEventsFunction: (
    selectedEventsFunction: gdEventsFunction | null | undefined,
    selectedEventsBasedBehavior: gdEventsBasedBehavior | null | undefined,
    selectedEventsBasedObject: gdEventsBasedObject | null | undefined
  ) => void;
  onDeleteEventsFunction: (
    eventsFunction: gdEventsFunction,
    cb: (shouldDelete: boolean) => void
  ) => void;
  onRenameEventsFunction: (
    eventsBasedBehavior: gdEventsBasedBehavior | null | undefined,
    eventsBasedObject: gdEventsBasedObject | null | undefined,
    eventsFunction: gdEventsFunction,
    newName: string,
    cb: (shouldRename: boolean) => void
  ) => void;
  onAddEventsFunction: (
    eventsBasedBehavior: gdEventsBasedBehavior | null | undefined,
    eventsBasedObject: gdEventsBasedObject | null | undefined,
    cb: (
      parameters: EventsFunctionCreationParameters | null | undefined
    ) => void
  ) => void;
  onEventsFunctionAdded: (
    eventsFunction: gdEventsFunction,
    eventsBasedBehavior: gdEventsBasedBehavior | null | undefined,
    eventsBasedObject: gdEventsBasedObject | null | undefined
  ) => void;
  moveEventsFunctionTo: (
    cb: (destinationExtensionName: string) => Promise<void>
  ) => void;
  onEventsFunctionMoved: (
    oldExtensionName: string,
    newExtensionName: string,
    oldObjectName: string,
    newObjectName: string
  ) => void;
};

export declare const getEventsFunctionTreeViewItemId: (
  eventFunction: gdEventsFunction
) => string;

export declare const canFunctionBeRenamed: (
  eventsFunction: gdEventsFunction,
  containerType: 'extension' | 'behavior' | 'object'
) => boolean;
