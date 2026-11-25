import * as React from 'react';
import {
  type NewProjectSetup,
  type ExampleProjectSetup,
} from '../../ProjectCreation/NewProjectSetupDialog';
import { type UnsavedChanges } from '../UnsavedChangesContext';
import { type ResourceManagementProps } from '../../ResourcesList/ResourceSource';
import type {
  StorageProvider,
  FileMetadataAndStorageProviderName,
  FileMetadata,
  SaveAsLocation,
} from '../../ProjectsStorage';
import { type HotReloadPreviewButtonProps } from '../../HotReload/HotReloadPreviewButton';
import { type ExampleShortHeader } from '../../Utils/GDevelopServices/Example';
import { type PrivateGameTemplateListingData } from '../../Utils/GDevelopServices/Shop';
import { type CourseChapter } from '../../Utils/GDevelopServices/Asset';
import { type ExpandedCloudProjectVersion } from '../../Utils/GDevelopServices/Project';
import { type ObjectWithContext } from '../../ObjectsList/EnumerateObjects';
import { type CreateProjectResult } from '../../Utils/UseCreateProject';
import { type GameplayTestsCallbacks } from '../../GameplayTests/GameplayTestRunner';
import type { NavigateToEventFromGlobalSearchParams } from '../../Utils/Search';
import type {
  SceneEventsOutsideEditorChanges,
  InstancesOutsideEditorChanges,
  ObjectsOutsideEditorChanges,
  ObjectGroupsOutsideEditorChanges,
  ProjectItemRenamedOutsideEditorChanges,
  WillDeleteSceneChanges,
  WillDeleteGameplayTestChanges,
  WillDeleteObjectChanges,
  ExtensionsOutsideEditorChanges,
  WillDeleteExtensionItemChanges,
} from '../../EditorFunctions/OutsideEditorChanges';

type PreviewDebuggerServer = any;
type GamesList = any;
type GamesPlatformFrameTools = any;
type OpenAskAiOptions = any;

export type EditorContainerExtraProps = {
  initiallyFocusedFunctionName?: string | null;
  initiallyFocusedBehaviorName?: string | null;
  initiallyFocusedObjectName?: string | null;
  storageProviders?: Array<StorageProvider>;
  continueProcessingFunctionCallsOnMount?: boolean;
};

export type RenderEditorContainerProps = {
  isActive: boolean;
  paneIdentifier: string;
  gameEditorMode: 'embedded-game' | 'instances-editor';
  setGameEditorMode: (mode: 'embedded-game' | 'instances-editor') => void;
  projectItemName: string | null | undefined;
  editorId: string;
  project: gdProject | null | undefined;
  fileMetadata: FileMetadata | null | undefined;
  storageProvider: StorageProvider;
  setToolbar: (toolbar: React.ReactNode | null | undefined) => void;
  setGamesPlatformFrameShown: (options: {
    shown: boolean;
    isMobile: boolean;
  }) => void;
  extraEditorProps: EditorContainerExtraProps | null | undefined;
  resourceManagementProps: ResourceManagementProps;
  unsavedChanges: UnsavedChanges | null | undefined;
  setPreviewedLayout: (options: {
    layoutName: string | null;
    externalLayoutName: string | null;
    eventsBasedObjectType: string | null;
    eventsBasedObjectVariantName: string | null;
  }) => void;
  previewDebuggerServer: PreviewDebuggerServer | null | undefined;
  hotReloadPreviewButtonProps: HotReloadPreviewButtonProps;
  onRestartInGameEditor: (reason: string) => void;
  showRestartInGameEditorAfterErrorButton: boolean;
  onOpenExternalEvents: (name: string) => void;
  onOpenLayout: (
    sceneName: string,
    options?: {
      openEventsEditor: boolean;
      openSceneEditor: boolean;
      focusWhenOpened:
        | 'scene-or-events-otherwise'
        | 'scene'
        | 'events'
        | 'none';
    }
  ) => void;
  onOpenEvents: (sceneName: string) => void;
  onOpenExternalLayout: (externalLayoutName: string) => void;
  openInstructionOrExpression: (type: string) => void;
  onOpenCustomObjectEditor: (
    extension: gdEventsFunctionsExtension,
    eventsBasedObject: gdEventsBasedObject,
    variantName: string
  ) => void;
  onOpenEventsFunctionsExtension: (
    extensionName: string,
    initiallyFocusedFunctionName?: string | null,
    initiallyFocusedBehaviorName?: string | null,
    initiallyFocusedObjectName?: string | null
  ) => void;
  openObjectEvents: (extensionName: string, objectName: string) => void;
  onNavigateToEventFromGlobalSearch: (
    params: NavigateToEventFromGlobalSearchParams
  ) => void;
  onOpenAskAi: (options?: OpenAskAiOptions | null) => void;
  onCloseAskAi: () => void;
  gameplayTestsCallbacks: GameplayTestsCallbacks;
  onLoadEventsFunctionsExtensions: (options: {
    shouldHotReloadEditor: boolean;
  }) => Promise<void>;
  onReloadEventsFunctionsExtensionMetadata: (
    extension: gdEventsFunctionsExtension
  ) => void;
  onCreateEventsFunction: (
    extensionName: string,
    eventsFunction: gdEventsFunction,
    editorIdentifier:
      | 'scene-events-editor'
      | 'extension-events-editor'
      | 'external-events-editor'
  ) => Promise<void>;
  onRenamedEventsBasedObject: (
    eventsFunctionsExtension: gdEventsFunctionsExtension,
    oldName: string,
    newName: string
  ) => void;
  onDeletedEventsBasedObject: (
    eventsFunctionsExtension: gdEventsFunctionsExtension,
    name: string
  ) => void;
  onEventsBasedObjectMoved: (
    oldExtensionName: string,
    newExtensionName: string,
    oldObjectName: string,
    newObjectName: string
  ) => void;
  onEventsBasedBehaviorMoved: (
    oldExtensionName: string,
    newExtensionName: string,
    oldBehaviorName: string,
    newBehaviorName: string
  ) => void;
  onEventsFunctionMoved: (
    oldExtensionName: string,
    newExtensionName: string,
    oldFunctionName: string,
    newFunctionName: string
  ) => void;
  canOpen: boolean;
  onChooseProject: () => void;
  onOpenRecentFile: (file: FileMetadataAndStorageProviderName) => Promise<void>;
  onOpenProjectManager: () => void;
  askToCloseProject: () => Promise<boolean>;
  closeProject: () => Promise<void>;
  gamesList: GamesList;
  gamesPlatformFrameTools: GamesPlatformFrameTools;
  onSelectExampleShortHeader: (exampleShortHeader: ExampleShortHeader) => void;
  onSelectPrivateGameTemplateListingData: (
    privateGameTemplateListingData: PrivateGameTemplateListingData
  ) => void;
  onOpenLanguageDialog: () => void;
  onOpenVersionHistory: () => void;
  selectInAppTutorial: (tutorialId: string) => void;
  onOpenProfile: () => void;
  onOpenPreferences: () => void;
  onOpenAbout: () => void;
  onDeleteResource: (
    resource: gdResource,
    cb: (result: boolean) => void
  ) => void;
  onRenameResource: (
    resource: gdResource,
    newName: string,
    cb: (result: boolean) => void
  ) => void;
  onOpenNewProjectSetupDialog: () => void;
  onCreateProjectFromExample: (
    exampleProjectSetup: ExampleProjectSetup
  ) => Promise<CreateProjectResult>;
  onCreateEmptyProject: (
    newProjectSetup: NewProjectSetup
  ) => Promise<CreateProjectResult>;
  onOpenTemplateFromTutorial: (tutorialId: string) => Promise<void>;
  onOpenTemplateFromCourseChapter: (
    courseChapter: CourseChapter,
    templateId?: string
  ) => Promise<void>;
  onOpenPrivateGameTemplateListingData: (
    privateGameTemplateListingData: PrivateGameTemplateListingData
  ) => void;
  onSave: (options?: {
    skipNewVersionWarning: boolean;
  }) => Promise<FileMetadata | null | undefined>;
  onSaveProjectAsWithStorageProvider: (
    options:
      | {
          requestedStorageProvider?: StorageProvider;
          forcedSavedAsLocation?: SaveAsLocation;
          createdProject?: gdProject;
        }
      | null
      | undefined
  ) => Promise<FileMetadata | null | undefined>;
  canSave: boolean;
  onCheckoutVersion: (
    version: ExpandedCloudProjectVersion,
    options?: { dontSaveCheckedOutVersionStatus?: boolean }
  ) => Promise<boolean>;
  getOrLoadProjectVersion: (
    versionId: string
  ) => Promise<ExpandedCloudProjectVersion | null | undefined>;
  openBehaviorEvents: (extensionName: string, behaviorName: string) => void;
  onEventsBasedObjectChildrenEdited: (
    eventsBasedObject: gdEventsBasedObject,
    options?: {
      editedObject?: gdObject | null;
      hasResourceChanged?: boolean;
    }
  ) => void;
  onSceneObjectEdited: (
    scene: gdLayout,
    objectWithContext: ObjectWithContext,
    hasResourceChanged?: boolean
  ) => void;
  onSceneObjectsDeleted: (scene: gdLayout) => void;
  triggerHotReloadInGameEditorIfNeeded: () => void;
  onInstancesModifiedOutsideEditor: (
    changes: InstancesOutsideEditorChanges
  ) => void;
  onObjectsModifiedOutsideEditor: (
    changes: ObjectsOutsideEditorChanges
  ) => void;
  onObjectGroupsModifiedOutsideEditor: (
    changes: ObjectGroupsOutsideEditorChanges
  ) => void;
  onProjectItemRenamedOutsideEditor: (
    changes: ProjectItemRenamedOutsideEditorChanges
  ) => void;
  onWillDeleteScene: (changes: WillDeleteSceneChanges) => Promise<void>;
  onWillDeleteGameplayTest: (
    changes: WillDeleteGameplayTestChanges
  ) => Promise<void>;
  onWillDeleteObject: (changes: WillDeleteObjectChanges) => void;
  onExtensionsModifiedOutsideEditor: (
    changes: ExtensionsOutsideEditorChanges
  ) => void;
  onWillDeleteExtensionItem: (
    changes: WillDeleteExtensionItemChanges
  ) => Promise<void>;
  onSceneEventsModifiedOutsideEditor: (
    changes: SceneEventsOutsideEditorChanges
  ) => void;
  onExtractAsExternalLayout: (name: string) => void;
  onExtractAsEventBasedObject: (
    extensionName: string,
    eventsBasedObjectName: string
  ) => void;
  onEventBasedObjectTypeChanged: () => void;
  onOpenEventBasedObjectEditor: (
    extensionName: string,
    eventsBasedObjectName: string
  ) => void;
  onOpenEventBasedObjectVariantEditor: (
    extensionName: string,
    eventsBasedObjectName: string,
    variantName: string
  ) => void;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
  onCreateNewExtensionWithBehavior:
    | ((project: gdProject, object: gdObject) => void)
    | null;
  onDeleteEventsBasedObjectVariant: (
    eventsFunctionsExtension: gdEventsFunctionsExtension,
    eventBasedObject: gdEventsBasedObject,
    variant: gdEventsBasedObjectVariant
  ) => void;
  onEffectAdded: () => void;
  onLayerRenamedOrRemoved: () => void;
  onObjectListsModified: (options: { isNewObjectTypeUsed: boolean }) => void;
  onExternalLayoutAssociationChanged: () => void;
};

export type RenderEditorContainerPropsWithRef = RenderEditorContainerProps & {
  ref: (instance: any) => any;
};
