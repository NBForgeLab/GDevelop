import { type CloudProjectWithUserAccessInfo } from '../../../../Utils/GDevelopServices/Project';
import { type Profile } from '../../../../Utils/GDevelopServices/Authentication';
import {
  type FileMetadataAndStorageProviderName,
  type StorageProvider,
} from '../../../../ProjectsStorage';

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
