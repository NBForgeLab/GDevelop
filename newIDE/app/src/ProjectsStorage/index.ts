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

/**
 * The data containing the file/url/file identifier to be loaded
 * by a storage provider.
 */
export type FileMetadata = {
  /** The file id, path or local path according to the provider. */
  fileIdentifier: string;
  /** The version id if the provider supports versioning */
  version?: string;
  lastModifiedDate?: number;
  name?: string;
  gameId?: string;
  /** The user id of the user owning the project if not the authenticated user. */
  ownerId?: string;
};

/**
 * The data containing the file/url/name of a new location to be saved
 * by a storage provider.
 */
export type SaveAsLocation = {
  /**
   * The file id, path or local path according to the provider. Might be null if not known
   * or unused (for example, a cloud project uses only a name to identify a new project).
   */
  fileIdentifier?: string;
  /**
   * The name of the file. Might be null if unused
   * (for example, a local file path is stored only in `fileIdentifier`).
   */
  name?: string;
  /**
   * The id of the game. Might be null if no game is published.
   */
  // New fields can be added if a storage provider needs other things to identify
  // a new location where to save a project to.
  gameId?: string;
};

export type SaveProjectOptions = {
  previousVersion?: string;
  restoredFromVersionId?: string;
  useBackgroundSerializer?: boolean;
  skipNewVersionWarning?: boolean;
  /**
   * When true, the serializer writes object keys alphabetically and
   * always emits default values for omitted properties (disabled, folded,
   * empty events/variables arrays, etc.) so that diffs are minimal and
   * shift-free when toggling flags.
   */
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
    arg0:
      | {
          message: React.ReactNode;
          actionLabel?: React.ReactNode;
          onActionClick?: () => void;
        }
      | null
      | undefined
  ) => void;
  updateInterface: () => void;
  cleanUserSelectionOfResources: () => void;
};

export type ResourcesActionsMenuBuilder = (
  resourcesActionsProps: ResourcesActionsProps
) => Array<MenuItemTemplate>;

/**
 * Interface returned by a storage provider to manipulate files.
 */
export type StorageProviderOperations = {
  // Project opening:
  onOpenWithPicker?: () => Promise<FileMetadata | null | undefined>;
  onOpen?: (
    fileMetadata: FileMetadata,
    onProgress?: (progress: number, message: MessageDescriptor) => void
  ) => Promise<{
    content: Record<string, any>;
  }>;
  getOpenErrorMessage?: (error: Error) => MessageDescriptor;
  getWriteErrorMessage?: (error: Error) => MessageDescriptor;
  // If set to true, opening a project at startup with this storage provider
  // will trigger a confirmation modal (so that a user interaction happen).
  doesInitialOpenRequireUserInteraction?: boolean;
  onEnsureCanAccessResources?: (
    project: gdProject,
    fileMetadata: FileMetadata
  ) => Promise<void>;
  // Project saving:
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
  onChooseSaveProjectAsLocation?: (arg0: {
    project: gdProject;
    // This is the current location.
    fileMetadata: FileMetadata | null | undefined;
    displayOptionToGenerateNewProjectUuid: boolean;
  }) => Promise<{
    // This is the newly chosen location (or null if cancelled).
    saveAsLocation: SaveAsLocation | null | undefined;
    saveAsOptions: SaveAsOptions | null | undefined;
  }>;
  onSaveProjectAs?: (
    project: gdProject,
    // This is the new location to save to.
    saveAsLocation: SaveAsLocation | null | undefined,
    options: {
      onStartSaving: () => void;
      onMoveResources: (arg0: {
        newFileMetadata: FileMetadata;
      }) => Promise<void>;
    }
  ) => Promise<{
    wasSaved: boolean;
    /** This is the location where the project was saved, or null if not persisted. */
    fileMetadata: FileMetadata | null | undefined;
  }>;
  canFileMetadataBeSafelySavedAs?: (
    fileMetadata: FileMetadata,
    actions: {
      showAlert: ShowAlertFunction;
      showConfirmation: ShowConfirmFunction;
    }
  ) => Promise<boolean>;
  // Project properties saving:
  onChangeProjectProperty?: (
    project: gdProject,
    fileMetadata: FileMetadata,
    // In order to synchronize project and cloud project names.
    properties: {
      name?: string;
      gameId?: string;
    }
  ) => Promise<null | {
    version: string;
    lastModifiedDate: number;
  }>;
  // Project auto saving:
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

/**
 * A storage provider is a function returning a StorageProviderOperations.
 */
export type StorageProvider = {
  internalName: string;
  name: MessageDescriptor;
  needUserAuthentication?: boolean;
  hiddenInOpenDialog?: boolean;
  hiddenInSaveDialog?: boolean;
  disabled?: boolean;
  renderIcon?: (arg0: { size?: 'small' | 'medium' }) => React.ReactNode;
  getFileMetadataFromAppArguments?: (
    appArguments: AppArguments
  ) => FileMetadata | null | undefined;
  getProjectLocation?: (arg0: {
    projectName: string;
    saveAsLocation: SaveAsLocation | null | undefined;
    newProjectsDefaultFolder?: string;
  }) => SaveAsLocation;
  renderNewProjectSaveAsLocationChooser?: (props: {
    projectName: string;
    saveAsLocation: SaveAsLocation | null | undefined;
    setSaveAsLocation: (arg0: SaveAsLocation | null | undefined) => void;
    newProjectsDefaultFolder?: string;
  }) => React.ReactNode;
  createOperations: (arg0: {
    /** Open a dialog (a render function) */
    setDialog: (arg0: () => React.ReactNode) => void;
    /** Close the dialog */
    closeDialog: () => void;
    authenticatedUser: AuthenticatedUser;
  }) => StorageProviderOperations;
  createResourceOperations?: (arg0: {
    authenticatedUser: AuthenticatedUser;
  }) => ResourcesActionsMenuBuilder;
  /** Resources external changes */
  setupResourcesWatcher?: (arg0: {
    fileIdentifier: string;
    callback: (arg0: { identifier: string }) => void;
    options?: any;
  }) => () => void;
};
