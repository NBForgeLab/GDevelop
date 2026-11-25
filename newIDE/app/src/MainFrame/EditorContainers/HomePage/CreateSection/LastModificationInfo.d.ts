import * as React from 'react';
import {
  type FileMetadataAndStorageProviderName,
  type FileMetadata,
  type StorageProvider,
} from '../../../../ProjectsStorage';
import { type AuthenticatedUser } from '../../../../Profile/AuthenticatedUserContext';
import { type LastModifiedInfo } from './utils';

type LastModificationInfoProps = {
  file: FileMetadataAndStorageProviderName;
  lastModifiedInfo?: LastModifiedInfo | null;
  storageProvider: StorageProvider | null | undefined;
  authenticatedUser: AuthenticatedUser;
  currentFileMetadata: FileMetadata | null | undefined;
  textColor?: 'primary' | 'secondary';
  textSize?: 'body-small';
  textPrefix?: React.ReactNode;
};

declare const LastModificationInfo: React.ComponentType<LastModificationInfoProps>;

export default LastModificationInfo;
