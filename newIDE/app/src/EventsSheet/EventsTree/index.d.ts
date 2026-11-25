import * as React from 'react';
import {
  type EventsScope,
  ProjectScopedContainersAccessor,
} from '../../InstructionOrExpression/EventsScope';
import { type ScreenType } from '../../UI/Responsive/ScreenTypeMeasurer';
import { type WindowSizeType } from '../../UI/Responsive/ResponsiveWindowMeasurer';
import { type Preferences } from '../../MainFrame/Preferences/PreferencesContext';
import { type Tutorial } from '../../Utils/GDevelopServices/Tutorial';

type InstructionsListContext = {
  isCondition: boolean;
  instrsList: gdInstructionsList;
};

type InstructionContext = {
  isCondition: boolean;
  instrsList: gdInstructionsList;
  instruction: gdInstruction;
  indexInList: number;
};

type ParameterContext = {
  isCondition: boolean;
  instrsList: gdInstructionsList;
  instruction: gdInstruction;
  indexInList: number;
  parameterIndex: number;
  domEvent?: any;
};

type VariableDeclarationContext = {
  variablesContainer: gdVariablesContainer;
  variableName: string;
};

type EventContext = {
  eventsList: gdEventsList;
  event: gdBaseEvent;
  indexInList: number;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
};

type InstructionContextWithEventContext = InstructionContext & {
  eventContext: EventContext;
};

type SelectionState = {
  selectedInstructions: Array<InstructionContextWithEventContext>;
  selectedInstructionsLists: Array<InstructionsListContext>;
  selectedEvents: Array<EventContext>;
};

export type EventsTreeProps = {
  events: gdEventsList;
  project: gdProject;
  scope: EventsScope;
  globalObjectsContainer: gdObjectsContainer;
  objectsContainer: gdObjectsContainer;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  selection: SelectionState;
  onAddNewInstruction: (
    eventContext: EventContext,
    instructionsListContext: InstructionsListContext
  ) => void;
  onPasteInstructions: (
    eventContext: EventContext,
    instructionsListContext: InstructionsListContext
  ) => void;
  onMoveToInstruction: (
    eventContext: EventContext,
    destinationContext: InstructionContext
  ) => void;
  onMoveToInstructionsList: (
    eventContext: EventContext,
    destinationContext: InstructionsListContext
  ) => void;
  onInstructionClick: (
    eventContext: EventContext,
    instructionContext: InstructionContext
  ) => void;
  onInstructionDoubleClick: (
    eventContext: EventContext,
    instructionContext: InstructionContext
  ) => void;
  onInstructionContextMenu: (
    eventContext: EventContext,
    x: number,
    y: number,
    instructionContext: InstructionContext
  ) => void;
  onAddInstructionContextMenu: (
    eventContext: EventContext,
    button: HTMLButtonElement,
    instructionsListContext: InstructionsListContext
  ) => void;
  onParameterClick: (
    eventContext: EventContext,
    parameterContext: ParameterContext
  ) => void;
  onVariableDeclarationClick: (
    eventContext: EventContext,
    variableDeclarationContext: VariableDeclarationContext
  ) => void;
  onVariableDeclarationDoubleClick: (
    eventContext: EventContext,
    variableDeclarationContext: VariableDeclarationContext
  ) => void;
  onEventClick: (eventContext: EventContext) => void;
  onEventContextMenu: (
    x: number,
    y: number,
    eventContext: EventContext
  ) => void;
  onAddNewEvent: (eventType: string, eventsList: gdEventsList) => void;
  onOpenExternalEvents: (name: string) => void;
  onOpenLayout: (name: string) => void;
  showObjectThumbnails: boolean;
  searchResults: Array<gdBaseEvent> | null | undefined;
  searchFocusOffset: number | null | undefined;
  highlightedSearchText: string | null | undefined;
  highlightedSearchMatchCase?: boolean;
  onEventMoved: (previousRowIndex: number, nextRowIndex: number) => void;
  onEndEditingEvent: (event: gdBaseEvent) => void;
  onScroll?: () => void;
  screenType: ScreenType;
  windowSize: WindowSizeType;
  eventsSheetWidth: number;
  eventsSheetHeight: number;
  fontSize?: number;
  indentScale: number;
  preferences: Preferences;
  tutorials: Array<Tutorial> | null | undefined;
  highlightedAiGeneratedEventIds: Set<string>;
};

export type EventsTreeInterface = {
  forceEventsUpdate: (cb?: () => void) => void;
  foldAll: () => void;
  unfoldToLevel: (level: number) => void;
  getEventContextAtRowIndexes: (
    rowIndexes: Array<number>
  ) => Array<EventContext>;
  scrollToRow: (row: number) => void;
  scrollToInstruction: (
    rowIndex: number,
    listLabel: string,
    instructionIndex: number
  ) => void;
  getEventRow: (event: gdBaseEvent) => number;
  unfoldForEvent: (event: gdBaseEvent) => void;
};

export declare const getIndentWidth: (windowSize: WindowSizeType) => number;

declare const EventsTree: React.ForwardRefExoticComponent<
  EventsTreeProps & React.RefAttributes<EventsTreeInterface>
>;

export default EventsTree;
