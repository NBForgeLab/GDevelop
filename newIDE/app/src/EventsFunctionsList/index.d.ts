import * as React from 'react';
import type { UnsavedChanges } from '../MainFrame/UnsavedChangesContext';
import type { EventsBasedObjectCallbacks } from './EventsBasedObjectTreeViewItemContent';
import type { EventsFunctionCallbacks } from './EventsFunctionTreeViewItemContent';

export declare const extensionConfigurationRootFolderId: string;
export declare const extensionObjectsRootFolderId: string;
export declare const extensionBehaviorsRootFolderId: string;
export declare const extensionFunctionsRootFolderId: string;
export declare const extensionTestsRootFolderId: string;

export declare const getTreeViewItemIdFromFunctionFolderOrFunction: (
  functionFolderOrFunction: gdFunctionFolderOrFunction
) => string;

export declare const getRootId: (
  eventsBasedBehavior?: gdEventsBasedBehavior | null | undefined,
  eventsBasedObject?: gdEventsBasedObject | null | undefined
) => string;

export declare const getRootFunctionFolderId: (
  eventsBasedBehavior?: gdEventsBasedBehavior | null | undefined,
  eventsBasedObject?: gdEventsBasedObject | null | undefined
) => string;

export declare const getRootFunctionFolder: (
  eventsFunctionsExtension: gdEventsFunctionsExtension,
  eventsBasedBehavior?: gdEventsBasedBehavior | null | undefined,
  eventsBasedObject?: gdEventsBasedObject | null | undefined
) => gdFunctionFolderOrFunction;

export type EventsBasedBehaviorCallbacks = {
  onSelectEventsBasedBehavior: (
    eventsBasedBehavior: gdEventsBasedBehavior | null | undefined
  ) => void;
  onDeleteEventsBasedBehavior: (
    eventsBasedBehavior: gdEventsBasedBehavior,
    cb: (shouldDelete: boolean) => void
  ) => void;
  onRenameEventsBasedBehavior: (
    eventsBasedBehavior: gdEventsBasedBehavior,
    newName: string,
    cb: (shouldRename: boolean) => void
  ) => void;
  onEventsBasedBehaviorRenamed: (
    eventsBasedBehavior: gdEventsBasedBehavior
  ) => void;
  onEventsBasedBehaviorPasted: (
    eventsBasedBehavior: gdEventsBasedBehavior,
    sourceExtensionName: string,
    sourceEventsBasedBehaviorName: string
  ) => void;
  moveEventsBasedBehaviorTo: (
    eventsBasedBehavior: gdEventsBasedBehavior,
    cb: (destinationExtensionName: string) => void
  ) => void;
  onEventsBasedBehaviorMoved: (
    oldExtensionName: string,
    newExtensionName: string,
    oldObjectName: string,
    newObjectName: string
  ) => void;
};

export type GameplayTestCallbacks = {
  onOpenGameplayTest: (testName: string) => void;
  onRenameGameplayTest: (oldName: string, newName: string) => void;
  onDeleteGameplayTest: (test: gdTest) => void;
  onRunGameplayTest: (testName: string) => void | Promise<void>;
};

export type EventsFunctionsListInterface = {
  forceUpdateList: () => void;
};

export type Props = {
  project: gdProject;
  eventsFunctionsExtension: gdEventsFunctionsExtension;
  unsavedChanges?: UnsavedChanges | null | undefined;
  forceUpdateEditor: () => void;
  selectedEventsBasedObject: gdEventsBasedObject | null | undefined;
  selectedEventsBasedBehavior: gdEventsBasedBehavior | null | undefined;
  selectedEventsFunction: gdEventsFunction | null | undefined;
  onSelectExtensionProperties: () => void;
  onSelectExtensionGlobalVariables: () => void;
  onSelectExtensionSceneVariables: () => void;
  onEventBasedObjectTypeChanged: () => void;
} & EventsBasedObjectCallbacks &
  EventsBasedBehaviorCallbacks &
  EventsFunctionCallbacks &
  GameplayTestCallbacks;

declare const EventsFunctionsListWithErrorBoundary: React.ForwardRefExoticComponent<
  Props & React.RefAttributes<EventsFunctionsListInterface>
>;
export default EventsFunctionsListWithErrorBoundary;
