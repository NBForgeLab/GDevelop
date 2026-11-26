import * as React from 'react';
import {
  type NewProjectSetup,
  type ExampleProjectSetup,
} from '../../ProjectCreation/NewProjectSetupDialog';
import { type UnsavedChanges } from '../UnsavedChangesContext';
import { type ResourceManagementProps } from '../../ResourcesList/ResourceSource';
import type { StorageProvider } from '../../ProjectsStorage';
import { type PreviewDebuggerServer } from '../../ExportAndShare/PreviewLauncher.flow';
import { type HotReloadPreviewButtonProps } from '../../HotReload/HotReloadPreviewButton';
import {
  type FileMetadataAndStorageProviderName,
  type FileMetadata,
  type SaveAsLocation,
} from '../../ProjectsStorage';
import { type ExampleShortHeader } from '../../Utils/GDevelopServices/Example';
import { type PrivateGameTemplateListingData } from '../../Utils/GDevelopServices/Shop';
import { type CourseChapter } from '../../Utils/GDevelopServices/Asset';
import { type ExpandedCloudProjectVersion } from '../../Utils/GDevelopServices/Project';
import { type GamesList } from '../../GameDashboard/UseGamesList';
import { type GamesPlatformFrameTools } from './HomePage/PlaySection/UseGamesPlatformFrame';
import { type ObjectWithContext } from '../../ObjectsList/EnumerateObjects';
import { type CreateProjectResult } from '../../Utils/UseCreateProject';
import { type OpenAskAiOptions } from '../../AiGeneration/Utils';
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

export type EditorContainerExtraProps = {
  // Events function extension editor
  initiallyFocusedFunctionName?: string | null;
  initiallyFocusedBehaviorName?: string | null;
  initiallyFocusedObjectName?: string | null;
  // Homepage
  storageProviders?: Array<StorageProvider>;
  // Ask AI
  continueProcessingFunctionCallsOnMount?: boolean;
};

export type RenderEditorContainerProps = {
  isActive: boolean;
  // The pane the editor is displayed in ('left', 'center' or 'right'), for
  // editors adapting their layout to their position.
  paneIdentifier: string;
  gameEditorMode: 'embedded-game' | 'instances-editor';
  setGameEditorMode: (arg0: 'embedded-game' | 'instances-editor') => void;
  projectItemName: string | null | undefined;
  editorId: string;
  project: gdProject | null | undefined;
  fileMetadata: FileMetadata | null | undefined;
  storageProvider: StorageProvider;
  setToolbar: (arg0: React.ReactNode | null | undefined) => void;
  setGamesPlatformFrameShown: (arg0: {
    shown: boolean;
    isMobile: boolean;
  }) => void;
  // Some optional extra props to pass to the rendered editor
  extraEditorProps: EditorContainerExtraProps | null | undefined;
  // Resources:
  resourceManagementProps: ResourceManagementProps;
  unsavedChanges: UnsavedChanges | null | undefined;
  // Preview:
  setPreviewedLayout: (arg0: {
    layoutName: string | null;
    externalLayoutName: string | null;
    eventsBasedObjectType: string | null;
    eventsBasedObjectVariantName: string | null;
  }) => void;
  previewDebuggerServer: PreviewDebuggerServer | null | undefined;
  hotReloadPreviewButtonProps: HotReloadPreviewButtonProps;
  onRestartInGameEditor: (reason: string) => void;
  showRestartInGameEditorAfterErrorButton: boolean;
  // Opening other editors:
  onOpenExternalEvents: (arg0: string) => void;
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
    eventsFunctionsExtension: gdEventsFunctionsExtension,
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
  onOpenAskAi: (arg0: OpenAskAiOptions | null | undefined) => void;
  onCloseAskAi: () => void;
  // Gameplay tests management:
  gameplayTestsCallbacks: GameplayTestsCallbacks;
  // Events function management:
  onLoadEventsFunctionsExtensions: (arg0: {
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
  // Project opening
  canOpen: boolean;
  onChooseProject: () => void;
  onOpenRecentFile: (file: FileMetadataAndStorageProviderName) => Promise<void>;
  onOpenProjectManager: () => void;
  askToCloseProject: () => Promise<boolean>;
  closeProject: () => Promise<void>;
  // Games
  gamesList: GamesList;
  // Games Platform
  gamesPlatformFrameTools: GamesPlatformFrameTools;
  // Other dialogs opening:
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
  // Resources handling
  onDeleteResource: (resource: gdResource, cb: (arg0: boolean) => void) => void;
  onRenameResource: (
    resource: gdResource,
    newName: string,
    cb: (arg0: boolean) => void
  ) => void;
  // Project creation
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
  // Project save
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
  // Project versions
  onCheckoutVersion: (
    version: ExpandedCloudProjectVersion,
    options?: {
      dontSaveCheckedOutVersionStatus?: boolean;
    }
  ) => Promise<boolean>;
  getOrLoadProjectVersion: (
    versionId: string
  ) => Promise<ExpandedCloudProjectVersion | null | undefined>;
  // Object editing
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
  // Events editing
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
  onObjectListsModified: (arg0: { isNewObjectTypeUsed: boolean }) => void;
  onExternalLayoutAssociationChanged: () => void;
};

export type RenderEditorContainerPropsWithRef = RenderEditorContainerProps & {
  // TODO - improve the typing of this ref.
  ref: (arg0: any) => any;
};
