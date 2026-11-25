import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type CloudProjectWithUserAccessInfo } from '../../../../Utils/GDevelopServices/Project';
import { type Profile } from '../../../../Utils/GDevelopServices/Authentication';
import {
  type FileMetadataAndStorageProviderName,
  type StorageProvider,
} from '../../../../ProjectsStorage';
import { type PrivateGameTemplateListingData } from '../../../../Utils/GDevelopServices/Shop';
import { type ExampleShortHeader } from '../../../../Utils/GDevelopServices/Example';
import { type SearchResult } from '../../../../UI/Search/UseSearchStructuredItem';
import { type PrivateGameTemplate } from '../../../../Utils/GDevelopServices/Asset';
import { type GDevelopTheme } from '../../../../UI/Theme';

export type LastModifiedInfo = {
  lastModifiedByUsername: string | null | undefined;
  lastModifiedByIconUrl: string;
  lastModifiedAt: number;
  lastKnownVersionId: string | null | undefined;
};

export type LastModifiedInfoByProjectId = {
  [projectId: string]: LastModifiedInfo;
};

export declare const getProjectLineHeight: (options: {
  isMobile: boolean;
}) => number;

export declare const getLastModifiedInfoByProjectId: (options: {
  cloudProjects: Array<CloudProjectWithUserAccessInfo>;
  profile: Profile;
}) => Promise<LastModifiedInfoByProjectId>;

export declare const getStorageProviderByInternalName: (
  storageProviders: Array<StorageProvider>,
  internalName: string
) => StorageProvider | null | undefined;

export declare const useProjectsListFor: (
  gameId: string | null
) => Array<FileMetadataAndStorageProviderName>;

export declare const getExampleAndTemplateTiles: (options: {
  receivedGameTemplates: Array<PrivateGameTemplate> | null | undefined;
  privateGameTemplateListingDatas?:
    | Array<SearchResult<PrivateGameTemplateListingData>>
    | null
    | undefined;
  exampleShortHeaders?:
    | Array<SearchResult<ExampleShortHeader>>
    | null
    | undefined;
  onSelectPrivateGameTemplateListingData: (
    privateGameTemplateListingData: PrivateGameTemplateListingData
  ) => void;
  onSelectExampleShortHeader: (exampleShortHeader: ExampleShortHeader) => void;
  i18n: I18nType;
  gdevelopTheme: GDevelopTheme;
  numberOfItemsExclusivelyInCarousel?: number;
  numberOfItemsInCarousel?: number;
  privateGameTemplatesPeriodicity: number;
  showOwnedGameTemplatesFirst?: boolean;
  isSearchActive?: boolean;
  disabled?: boolean;
}) => Array<React.ReactNode>;
