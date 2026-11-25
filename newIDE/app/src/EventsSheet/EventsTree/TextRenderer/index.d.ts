export declare const eventsTextRenderingErrorText: string;

export type EventsTextRenderingError = {
  path: string;
  message: string;
};

export declare const renderInstructionSentenceAsPlainText: (
  instruction: gdInstruction,
  metadata: gdInstructionMetadata
) => string;

export declare const renderEventsAsText: (options: {
  eventsList: gdEventsList;
  parentPath: string;
  padding: string;
  isAncestorDisabled?: boolean;
  renderingErrors?: Array<EventsTextRenderingError>;
}) => string;

export declare const renderNonTranslatedEventsAsTextWithErrors: (options: {
  eventsList: gdEventsList;
}) => {
  text: string;
  renderingErrors: Array<EventsTextRenderingError>;
};

export declare const renderNonTranslatedEventsAsText: (options: {
  eventsList: gdEventsList;
}) => string;
