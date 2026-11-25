import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type UnsavedChanges } from '../../MainFrame/UnsavedChangesContext';
import { type HistoryHandler } from '../../VariablesList/VariablesList';
import { type ProjectScopedContainersAccessor } from '../../InstructionOrExpression/EventsScope';
import { type ResourceManagementProps } from '../../ResourcesList/ResourceSource';
import { type MessageDescriptor } from '../../Utils/i18n/MessageDescriptor.flow';

export declare const styles: {
  icon: React.CSSProperties;
  scrollView: React.CSSProperties;
  hiddenContent: React.CSSProperties;
  subPanelContentContainer: React.CSSProperties;
};

export type TitleBarButton = {
  id: string;
  icon: any;
  label?: MessageDescriptor;
  onClick?: () => void;
};

export declare const CollapsibleSubPanel: React.ComponentType<{
  renderContent: () => React.ReactNode;
  isFolded: boolean;
  toggleFolded: () => void;
  titleIcon?: React.ReactNode | null;
  title: string;
  titleBarButtons?: Array<TitleBarButton>;
}>;

export declare const CompactObjectPropertiesEditor: React.ComponentType<{
  project: gdProject;
  resourceManagementProps: ResourceManagementProps;
  layout?: gdLayout | null;
  eventsFunctionsExtension: gdEventsFunctionsExtension | null;
  eventsBasedObject: gdEventsBasedObject | null;
  onUpdateBehaviorsSharedData: () => void;
  objectsContainer: gdObjectsContainer;
  globalObjectsContainer: gdObjectsContainer | null;
  initialInstances: gdInitialInstancesContainer;
  layersContainer: gdLayersContainer;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  unsavedChanges?: UnsavedChanges | null;
  i18n: I18nType;
  historyHandler?: HistoryHandler;
  objects: Array<gdObject>;
  onEditObject: (
    object: gdObject,
    initialTab?: 'properties' | 'behaviors' | 'variables' | 'effects' | null
  ) => void;
  onObjectsModified: (objects: Array<gdObject>) => void;
  onEffectAdded: () => void;
  onOpenEventBasedObjectVariantEditor: (
    extensionName: string,
    eventsBasedObjectName: string,
    variantName: string
  ) => void;
  onDeleteEventsBasedObjectVariant: (
    eventsFunctionsExtension: gdEventsFunctionsExtension,
    eventBasedObject: gdEventsBasedObject,
    variant: gdEventsBasedObjectVariant
  ) => void;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
  onCreateNewExtensionWithBehavior:
    | ((project: gdProject, object: gdObject) => void)
    | null;
  isVariableListLocked: boolean;
  isBehaviorListLocked: boolean;
}>;
