import * as React from 'react';
import {
  type InstructionsListContext,
  type InstructionContext,
  type ParameterContext,
  type VariableDeclarationContext,
} from '../../SelectionHandler';
import {
  type EventsScope,
  ProjectScopedContainersAccessor,
} from '../../../InstructionOrExpression/EventsScope';
import { type ScreenType } from '../../../UI/Responsive/ScreenTypeMeasurer';
import { type WindowSizeType } from '../../../UI/Responsive/ResponsiveWindowMeasurer';

export type EventRendererProps = {
  project: gdProject;
  scope: EventsScope;
  globalObjectsContainer: gdObjectsContainer;
  objectsContainer: gdObjectsContainer;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  event: gdBaseEvent;
  disabled: boolean;
  onUpdate: () => void;
  selected: boolean;
  onAddNewInstruction: (
    instructionsListContext: InstructionsListContext
  ) => void;
  onPasteInstructions: (
    instructionsListContext: InstructionsListContext
  ) => void;
  onMoveToInstruction: (destinationContext: InstructionContext) => void;
  onMoveToInstructionsList: (
    destinationContext: InstructionsListContext
  ) => void;
  onInstructionClick: (instructionContext: InstructionContext) => void;
  onInstructionDoubleClick: (instructionContext: InstructionContext) => void;
  onInstructionContextMenu: (
    x: number,
    y: number,
    instructionContext: InstructionContext
  ) => void;
  onAddInstructionContextMenu: (
    buttonElement: HTMLButtonElement,
    instructionsListContext: InstructionsListContext
  ) => void;
  onParameterClick: (parameterContext: ParameterContext) => void;
  onEndEditingEvent: () => void;
  selection: any;
  onVariableDeclarationClick: (
    variableDeclarationContext: VariableDeclarationContext
  ) => void;
  onVariableDeclarationDoubleClick: (
    variableDeclarationContext: VariableDeclarationContext
  ) => void;
  onOpenLayout: (arg0: string) => void;
  onOpenExternalEvents: (arg0: string) => void;
  leftIndentWidth: number;
  renderObjectThumbnail: (arg0: string) => React.ReactNode;
  screenType: ScreenType;
  windowSize: WindowSizeType;
  eventsSheetWidth: number;
  eventsSheetHeight: number;
  idPrefix: string;
  isValidElseEvent?: boolean;
  highlightedSearchText?: string | null;
  highlightedSearchMatchCase?: boolean;
};
