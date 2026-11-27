import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor';
import { t } from '@lingui/macro';
import {
  type StorageProvider,
  type FileMetadata,
  type ResourcesActionsMenuBuilder,
} from '../ProjectsStorage';
import {
  type ResourceV2,
  type Resource,
} from '../Utils/GDevelopServices/Asset';
import { type ResourceExternalEditor } from './ResourceExternalEditor';
import { type OnFetchNewlyAddedResourcesFunction } from '../ProjectsStorage/ResourceFetcher';
import { type ResourceCustomPropertyConfig } from '../Utils/ProjectSettingsReader';

const gd: libGDevelop = global.gd;

// These are all the kind of resources that can be found in
// Core/GDCore/Project/ResourcesContainer.h
export type ResourceKind =
  | 'image'
  | 'audio'
  | 'font'
  | 'video'
  | 'json'
  | 'tilemap'
  | 'tileset'
  | 'bitmapFont'
  | 'model3D'
  | 'atlas'
  | 'spine'
  | 'javascript';

export const resourcesKindSupportedByResourceStore = ['audio', 'font'];

export const allResourceKindsAndMetadata: Array<{
  kind: ResourceKind;
  displayName: MessageDescriptor;
  fileExtensions: Array<string>;
  createNewResource: () => gdResource;
}> = [
  {
    kind: 'audio',
    displayName: t`Audio` as any,
    fileExtensions: ['aac', 'm4a', 'wav', 'mp3', 'ogg'],
    createNewResource: (): gdAudioResource => new gd.AudioResource(),
  },
  {
    kind: 'image',
    displayName: t`Image` as any,
    fileExtensions: ['png', 'jpg', 'jpeg', 'webp'],
    createNewResource: (): gdImageResource => new gd.ImageResource(),
  },
  {
    kind: 'font',
    displayName: t`Font` as any,
    fileExtensions: ['ttf', 'otf'],
    createNewResource: (): gdFontResource => new gd.FontResource(),
  },
  {
    kind: 'video',
    displayName: t`Video` as any,
    fileExtensions: ['mp4', 'webm'],
    createNewResource: (): gdVideoResource => new gd.VideoResource(),
  },
  {
    kind: 'json',
    displayName: t`Json` as any,
    fileExtensions: ['json'],
    createNewResource: (): gdJsonResource => {
      return new gd.JsonResource();
    },
  },
  {
    kind: 'tilemap',
    displayName: t`Tile Map` as any,
    fileExtensions: ['json', 'ldtk', 'tmj'],
    createNewResource: (): gdTilemapResource => new gd.TilemapResource(),
  },
  {
    kind: 'tileset',
    displayName: t`Tile Set` as any,
    fileExtensions: ['json', 'tsj'],
    createNewResource: (): gdTilesetResource => new gd.TilesetResource(),
  },
  {
    kind: 'bitmapFont',
    displayName: t`Bitmap Font` as any,
    fileExtensions: ['fnt', 'xml'],
    createNewResource: (): gdBitmapFontResource => new gd.BitmapFontResource(),
  },
  {
    kind: 'model3D',
    displayName: t`3D model` as any,
    fileExtensions: ['glb'],
    createNewResource: (): gdModel3DResource => new gd.Model3DResource(),
  },
  {
    kind: 'atlas',
    displayName: t`Atlas` as any,
    fileExtensions: ['atlas'],
    createNewResource: (): gdAtlasResource => new gd.AtlasResource(),
  },
  {
    kind: 'spine',
    displayName: t`Spine skeleton` as any,
    fileExtensions: ['json', 'skel'],
    createNewResource: (): gdSpineResource => {
      return new gd.SpineResource();
    },
  },
  {
    kind: 'javascript',
    displayName: t`JavaScript file` as any,
    fileExtensions: ['js'],
    createNewResource: (): gdJavaScriptResource => {
      return new gd.JavaScriptResource();
    },
  },
];

const constructors: Record<string, () => gdResource> = {};
for (const { kind, createNewResource } of allResourceKindsAndMetadata) {
  constructors[kind] = createNewResource;
}

export function createNewResource(kind: string): gdResource | null | undefined {
  return constructors[kind] ? constructors[kind]() : null;
}

export type ChooseResourceOptions = {
  initialSourceName: string;
  multiSelection: boolean;
  resourceKind: ResourceKind;
};

export type ResourceImportationBehavior = 'import' | 'relative' | 'ask';

export type ChooseResourceProps = {
  i18n: I18nType;
  project: gdProject;
  fileMetadata: FileMetadata | null | undefined;
  getStorageProvider: () => StorageProvider;
  getLastUsedPath: (project: gdProject, kind: ResourceKind) => string;
  setLastUsedPath: (
    project: gdProject,
    kind: ResourceKind,
    path: string
  ) => void;
  options: ChooseResourceOptions;
  automaticallyOpenIfPossible?: boolean;
  resourcesImporationBehavior: ResourceImportationBehavior;
};

export type ResourceSourceComponentProps = ChooseResourceProps & {
  onChooseResources: (arg0: {
    selectedResources: Array<gdResource>;
    selectedSourceName: string;
  }) => void;
  selectedResourceIndex?: number | null;
  onSelectResource?: (arg0: number | null | undefined) => void;
  selectedResources?: Array<gdResource> | null;
  onResourcesSelected?: (arg0: Array<gdResource>) => void;
};

export type ResourceSourceComponentPrimaryActionProps = {
  resource: ResourceV2 | Resource | null | undefined;
  selectedResources: Array<gdResource> | null | undefined;
  onChooseResources: (arg0: {
    selectedResources: Array<gdResource>;
    selectedSourceName: string;
  }) => void;
};

export type ResourceSource = {
  name: string;
  displayName: MessageDescriptor;
  displayTab: 'standalone' | 'import' | 'import-advanced';
  onlyForStorageProvider?: string | null;
  kind: ResourceKind;
  selectResourcesHeadless?:
    | ((chooseResourceProps: ChooseResourceProps) => Promise<Array<gdResource>>)
    | null;
  renderComponent: (
    resourceSourceComponentProps: ResourceSourceComponentProps
  ) => React.ReactNode;
  renderPrimaryAction?: (
    resourceSourceComponentPrimaryActionProps: ResourceSourceComponentPrimaryActionProps
  ) => React.ReactNode;
  shouldCreateResource: boolean;
  shouldGuessAnimationsFromName: boolean;
  hideInResourceEditor?: boolean;
};

export type ChooseResourceFunction = (
  options: ChooseResourceOptions
) => Promise<{
  selectedResources: Array<gdResource>;
  selectedSourceName: string;
}>;

export type ResourceManagementProps = {
  resourceSources: Array<ResourceSource>;
  resourceExternalEditors: Array<ResourceExternalEditor>;
  onChooseResource: ChooseResourceFunction;
  getStorageProvider: () => StorageProvider;
  onFetchNewlyAddedResources: OnFetchNewlyAddedResourcesFunction;
  getStorageProviderResourceOperations: () =>
    | ResourcesActionsMenuBuilder
    | null
    | undefined;
  canInstallPrivateAsset: () => boolean;
  onNewResourcesAdded: () => void;
  onResourceUsageChanged: () => void;
  resourceCustomPropertyConfigs: Array<ResourceCustomPropertyConfig>;
};

export type ResourceStoreChooserProps = {
  options: ChooseResourceOptions;
  selectedResourceIndex?: number | null;
  onSelectResource?: (arg0: number | null | undefined) => void;
  onChooseResources?: (resources: Array<gdResource>) => void;
  createNewResource?: () => gdResource;
};
