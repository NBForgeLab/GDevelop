import { type MessageDescriptor } from './i18n/MessageDescriptor.flow';
import {
  type NewProjectSetup,
  type ExampleProjectSetup,
} from '../ProjectCreation/NewProjectSetupDialog';
import {
  type StorageProvider,
  type StorageProviderOperations,
  type FileMetadata,
} from '../ProjectsStorage';
import { type PrivateGameTemplateListingData } from './GDevelopServices/Shop';
import { type CourseChapter } from './GDevelopServices/Asset';

type MainFrameState = any;
type EditorTabsState = any;
type MoveAllProjectResourcesOptionsWithoutProgress = any;

export type CreateProjectResult = {
  createdProject: gdProject | null;
};

type Props = {
  beforeCreatingProject: () => void;
  afterCreatingProject: (options: {
    project: gdProject;
    editorTabs: EditorTabsState;
    oldProjectId: string;
    fileMetadata: FileMetadata | null | undefined;
    options: {
      openAllScenes: boolean;
      forceOpenAskAiEditor: boolean;
    };
  }) => Promise<void>;
  onError: () => void;
  onSuccessOrError: () => void;
  getStorageProviderOperations: (
    storageProvider?: StorageProvider | null
  ) => StorageProviderOperations;
  getStorageProvider: () => StorageProvider;
  loadFromProject: (
    project: gdProject,
    fileMetadata: FileMetadata | null | undefined
  ) => Promise<MainFrameState>;
  openFromFileMetadata: (
    fileMetadata: FileMetadata,
    options?: {
      openingMessage?: MessageDescriptor | null;
      ignoreAutoSave?: boolean;
      doNotTrackAsProjectOpened?: boolean;
    }
  ) => Promise<MainFrameState | null | undefined>;
  onProjectSaved: (fileMetadata: FileMetadata | null | undefined) => void;
  ensureResourcesAreMoved: (
    options: MoveAllProjectResourcesOptionsWithoutProgress
  ) => Promise<void>;
  onGameRegistered: () => Promise<void>;
};

export type UseCreateProjectReturnType = {
  createEmptyProject: (
    newProjectSetup: NewProjectSetup
  ) => Promise<CreateProjectResult>;
  createProjectFromCourseChapter: (options: {
    courseChapter: CourseChapter;
    newProjectSetup: NewProjectSetup;
    templateId?: string;
  }) => Promise<CreateProjectResult>;
  createProjectFromExample: (
    exampleProjectSetup: ExampleProjectSetup
  ) => Promise<CreateProjectResult>;
  createProjectFromInAppTutorial: (
    tutorialId: string,
    newProjectSetup: NewProjectSetup
  ) => Promise<CreateProjectResult>;
  createProjectFromPrivateGameTemplate: (
    privateGameTemplateListingData: PrivateGameTemplateListingData,
    newProjectSetup: NewProjectSetup
  ) => Promise<CreateProjectResult>;
  createProjectFromTutorial: (
    tutorialId: string,
    newProjectSetup: NewProjectSetup
  ) => Promise<CreateProjectResult>;
};

declare const useCreateProject: (props: Props) => UseCreateProjectReturnType;

export default useCreateProject;
