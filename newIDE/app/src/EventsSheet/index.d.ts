import * as React from 'react';
import type { EventsScope } from '../InstructionOrExpression/EventsScope';
import type { ProjectScopedContainersAccessor } from '../InstructionOrExpression/EventsScope';
import type { ResourceManagementProps } from '../ResourcesList/ResourceSource';
import type { UnsavedChanges } from '../MainFrame/UnsavedChangesContext';
import type { HotReloadPreviewButtonProps } from '../HotReload/HotReloadPreviewButton';
import type { EventPath } from '../Utils/EventPath';
import type { SearchFilterParams } from '../Utils/Search';
import type { VariableDialogOpeningProps } from '../VariablesList/VariablesEditorDialog';

export type OutOfEditorChanges = {
  newOrChangedAiGeneratedEventIds: Set<string>;
};

export type EventsSheetInterface = {
  updateToolbar: () => void;
  onResourceExternallyChanged: (options: { identifier: string }) => void;
  onEventsModifiedOutsideEditor: (changes: OutOfEditorChanges) => void;
  scrollToEventPath: (eventPath: EventPath) => void;
  setGlobalSearchResults: (
    eventPaths: Array<EventPath>,
    focusedEventPath: EventPath,
    searchText: string,
    searchFilters?: SearchFilterParams
  ) => void;
  clearGlobalSearchResults: () => void;
  selectAllEvents: () => void;
};

export type Props = {
  project: gdProject;
  scope: EventsScope;
  globalObjectsContainer: gdObjectsContainer;
  objectsContainer: gdObjectsContainer;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  events: gdEventsList;
  setToolbar: (toolbar: React.ReactNode) => void;
  onOpenSettings?: (() => void) | null | undefined;
  settingsIcon?: React.ReactNode;
  onOpenExternalEvents: (externalEventsName: string) => void;
  onOpenLayout: (layoutName: string) => void;
  resourceManagementProps: ResourceManagementProps;
  openInstructionOrExpression: (type: string) => void;
  onCreateEventsFunction: (
    extensionName: string,
    eventsFunction: gdEventsFunction
  ) => Promise<void>;
  onBeginCreateEventsFunction: () => void;
  unsavedChanges?: UnsavedChanges | null | undefined;
  isActive: boolean;
  hotReloadPreviewButtonProps: HotReloadPreviewButtonProps;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
  onCreateNewExtensionWithBehavior:
    | ((project: gdProject, object: gdObject) => void)
    | null;
  editEventsFunctionParameter:
    | ((options: VariableDialogOpeningProps) => void)
    | null;
  openEventsBasedEntityPropertyEditorDialog:
    | ((options: VariableDialogOpeningProps) => void)
    | null;
};

declare const EventsSheet: React.ForwardRefExoticComponent<
  Props & React.RefAttributes<EventsSheetInterface>
>;
export default EventsSheet;
