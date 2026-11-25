import { type I18n as I18nType } from '@lingui/core';
import { type StorageProvider, type FileMetadata } from '../ProjectsStorage';
import { type ExampleShortHeader } from '../Utils/GDevelopServices/Example';

type NewProjectCreationSource =
  | 'default'
  | 'ai-agent-request'
  | 'mcp'
  | 'course-chapter'
  | 'in-app-tutorial';

type NewProjectSetup = {
  creationSource: NewProjectCreationSource;
  projectFileUrl?: string | null;
  [key: string]: any;
};

type ExampleProjectSetup = {
  exampleShortHeader: ExampleShortHeader;
  newProjectSetup: NewProjectSetup;
  i18n: I18nType;
};

export type NewProjectAnalyticsMetadata = {
  exampleUrl: string;
  exampleSlug: string;
  exampleCompositeSlug: string;
  creationSource: NewProjectCreationSource;
};

export type NewProjectSource = {
  project: gdProject | null | undefined;
  storageProvider: StorageProvider | null | undefined;
  fileMetadata: FileMetadata | null | undefined;
  templateSlug?: string | null;
  analyticsMetadata: NewProjectAnalyticsMetadata;
};

export declare const addDefaultLightToLayer: (layer: gdLayer) => void;

export declare const addDefaultLightToAllLayers: (layout: gdLayout) => void;

export declare const createNewEmptyProject: (options: {
  creationSource: NewProjectCreationSource;
}) => NewProjectSource;

export declare const createNewProjectFromTutorialTemplate: (
  tutorialTemplateUrl: string,
  tutorialId: string
) => NewProjectSource;

export declare const createNewProjectFromCourseChapterTemplate: (
  templateUrl: string,
  courseChapterId: string
) => NewProjectSource;

export declare const createNewProjectFromPrivateGameTemplate: (
  privateGameTemplateUrl: string,
  privateGameTemplateTag: string
) => NewProjectSource;

export declare const createNewProjectFromExampleShortHeader: (
  options: ExampleProjectSetup
) => Promise<NewProjectSource | null | undefined>;
