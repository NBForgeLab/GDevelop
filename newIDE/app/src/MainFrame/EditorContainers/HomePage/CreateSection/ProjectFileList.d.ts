import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import {
  type FileMetadataAndStorageProviderName,
  type FileMetadata,
  type StorageProvider,
} from '../../../../ProjectsStorage';
import { type Game } from '../../../../Utils/GDevelopServices/Game';

type Props = {
  game: Game;
  onOpenProject: (file: FileMetadataAndStorageProviderName) => Promise<void>;
  storageProviders: Array<StorageProvider>;
  onDeleteCloudProject: (
    i18n: I18nType,
    file: FileMetadataAndStorageProviderName
  ) => Promise<void>;
  disabled: boolean;
  project: gdProject | null | undefined;
  currentFileMetadata: FileMetadata | null | undefined;
  closeProject: () => Promise<void>;
};

declare const ProjectFileListWithErrorBoundary: React.ComponentType<Props>;

export default ProjectFileListWithErrorBoundary;
