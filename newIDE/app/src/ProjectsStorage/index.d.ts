import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';
import { type AppArguments } from '../Utils/Window';
import { type AuthenticatedUser } from '../Profile/AuthenticatedUserContext';
import { type MenuItemTemplate } from '../UI/Menu/Menu.flow';
import {
  type ShowAlertFunction,
  type ShowConfirmFunction,
} from '../UI/Alert/AlertContext';

export type FileMetadata = {
  fileIdentifier: string;
  version?: string;
  lastModifiedDate?: number;
  name?: string;
  gameId?: string;
  ownerId?: string;
};

export type SaveAsLocation = {
  fileIdentifier?: string;
  name?: string;
  gameId?: string;
};

export type SaveProjectOptions = {
  previousVersion?: string;
  restoredFromVersionId?: string;
  useBackgroundSerializer?: boolean;
  skipNewVersionWarning?: boolean;
  canonicalEventSerialization?: boolean;
};

export type SaveAsOptions = {
  generateNewProjectUuid?: boolean;
  setProjectNameFromLocation?: boolean;
};

export type FileMetadataAndStorageProviderName = {
  fileMetadata: FileMetadata;
  storageProviderName: string;
};

export type ResourcesActionsProps = {
  project: gdProject;
  fileMetadata: FileMetadata;
  resource: gdResource;
  i18n: I18nType;
  informUser: (
    options?: {
      message: React.ReactNode;
      actionLabel?: React.ReactNode;
      onActionClick?: () => void;
    } | null
  ) => void;
  updateInterface: () => void;
  cleanUserSelectionOfResources: () => void;
};

export type ResourcesActionsMenuBuilder = (
  props: ResourcesActionsProps
) => Array<MenuItemTemplate>;

export type StorageProviderOperations = {
  onOpenWithPicker?: () => Promise<FileMetadata | null | undefined>;
  onOpen?: (
    fileMetadata: FileMetadata,
    onProgress?: (progress: number, message: MessageDescriptor) => void
  ) => Promise<{
    content: Record<string, any>;
  }>;
  getOpenErrorMessage?: (error: Error) => MessageDescriptor;
  getWriteErrorMessage?: (error: Error) => MessageDescriptor;
  doesInitialOpenRequireUserInteraction?: boolean;
  onEnsureCanAccessResources?: (
    project: gdProject,
    fileMetadata: FileMetadata
  ) => Promise<void>;
  onSaveProject?: (
    project: gdProject,
    fileMetadata: FileMetadata,
    options: SaveProjectOptions | undefined,
    actions: {
      showAlert: ShowAlertFunction;
      showConfirmation: ShowConfirmFunction;
    }
  ) => Promise<{
    wasSaved: boolean;
    fileMetadata: FileMetadata;
  }>;
  onChooseSaveProjectAsLocation?: (options: {
    project: gdProject;
    fileMetadata: FileMetadata | null | undefined;
    displayOptionToGenerateNewProjectUuid: boolean;
  }) => Promise<{
    saveAsLocation: SaveAsLocation | null | undefined;
    saveAsOptions: SaveAsOptions | null | undefined;
  }>;
  onSaveProjectAs?: (
    project: gdProject,
    saveAsLocation: SaveAsLocation | null | undefined,
    options: {
      onStartSaving: () => void;
      onMoveResources: (options: {
        newFileMetadata: FileMetadata;
      }) => Promise<void>;
    }
  ) => Promise<{
    wasSaved: boolean;
    fileMetadata: FileMetadata | null | undefined;
  }>;
  canFileMetadataBeSafelySavedAs?: (
    fileMetadata: FileMetadata,
    actions: {
      showAlert: ShowAlertFunction;
      showConfirmation: ShowConfirmFunction;
    }
  ) => Promise<boolean>;
  onChangeProjectProperty?: (
    project: gdProject,
    fileMetadata: FileMetadata,
    properties: { name?: string; gameId?: string }
  ) => Promise<null | { version: string; lastModifiedDate: number }>;
  onAutoSaveProject?: (
    project: gdProject,
    fileMetadata: FileMetadata
  ) => Promise<void>;
  getAutoSaveCreationDate?: (
    fileMetadata: FileMetadata,
    compareLastModified: boolean
  ) => Promise<number | null | undefined>;
  onGetAutoSave?: (fileMetadata: FileMetadata) => Promise<FileMetadata>;
};

export type StorageProvider = {
  internalName: string;
  name: MessageDescriptor;
  needUserAuthentication?: boolean;
  hiddenInOpenDialog?: boolean;
  hiddenInSaveDialog?: boolean;
  disabled?: boolean;
  renderIcon?: (options: { size?: 'small' | 'medium' }) => React.ReactNode;
  getFileMetadataFromAppArguments?: (
    appArguments: AppArguments
  ) => FileMetadata | null | undefined;
  getProjectLocation?: (options: {
    projectName: string;
    saveAsLocation: SaveAsLocation | null | undefined;
    newProjectsDefaultFolder?: string;
  }) => SaveAsLocation;
  renderNewProjectSaveAsLocationChooser?: (props: {
    projectName: string;
    saveAsLocation: SaveAsLocation | null | undefined;
    setSaveAsLocation: (location: SaveAsLocation | null | undefined) => void;
    newProjectsDefaultFolder?: string;
  }) => React.ReactNode;
  createOperations: (options: {
    setDialog: (renderDialog: () => React.ReactNode) => void;
    closeDialog: () => void;
    authenticatedUser: AuthenticatedUser;
  }) => StorageProviderOperations;
  createResourceOperations?: (options: {
    authenticatedUser: AuthenticatedUser;
  }) => ResourcesActionsMenuBuilder;
  setupResourcesWatcher?: (options: {
    fileIdentifier: string;
    callback: (resourceInfo: { identifier: string }) => void;
    options?: any;
  }) => () => void;
};
