export type JsCodeExcerpt = {
  eventId: string;
  fromLine: number;
  toLine: number;
  totalLines: number;
  code: string;
};

type EventScriptRenderingError = {
  path: string;
  message: string;
};

export type EventScriptSourceView = {
  text: string;
  selectedEventIds: Array<string>;
  jsCodeExcerpt: JsCodeExcerpt | null;
  truncated: boolean;
  notes: Array<string>;
  renderingErrors: Array<EventScriptRenderingError>;
};

export type ScopeSummary = {
  parameters: Array<{ name: string; type: string }>;
  properties: Array<string>;
  childObjects?: Array<string>;
  extensionVariables: { global: Array<string>; scene: Array<string> };
};

export declare const renderScopeSummaryHeaderLines: (
  scopeSummary: ScopeSummary
) => Array<string>;

export declare const formatNumberedLines: (
  lines: Array<string>,
  firstIndex: number
) => Array<string>;

export declare const renderEventSourceById: (options: {
  eventsList: gdEventsList;
  eventIdOrGroupName: string;
  includeSubEvents: boolean;
}) => string | null;

export declare const findEventByIdOrGroupName: (options: {
  eventsList: gdEventsList;
  eventIdOrGroupName: string;
}) => {
  event: gdBaseEvent;
  path: string;
  indentation: string;
} | null;

export declare const buildEventScriptSourceView: (options: {
  eventsList: gdEventsList;
  eventIds?: Array<string> | null;
  searchText?: string | null;
  objectNames?: Array<string> | null;
  subEventsDepth?: number | null;
  maxChars: number;
  jsFromLine?: number | null;
}) => EventScriptSourceView;
