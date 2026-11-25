import * as React from 'react';
import {
  type Asset,
  type AssetShortHeader,
} from '../Utils/GDevelopServices/Asset';
import { type ResourceManagementProps } from '../ResourcesList/ResourceSource';
import type { ObjectFolderOrObjectWithContext } from '../ObjectsList/EnumerateObjectFolderOrObject';
import { type InstallAssetOutput } from './InstallAsset';

export declare const useProjectNeedToBeSavedAlertDialog: (
  canInstallPrivateAsset: () => boolean
) => (assetShortHeader: AssetShortHeader) => Promise<boolean>;

export declare const useFetchAssets: () => (
  assetShortHeaders: Array<AssetShortHeader>
) => Promise<Array<Asset>>;

export declare const useInstallAsset: (options: {
  project: gdProject | null | undefined;
  targetObjectFolderOrObjectWithContext?:
    | ObjectFolderOrObjectWithContext
    | null
    | undefined;
  resourceManagementProps: ResourceManagementProps;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
}) => (options: {
  assetShortHeader: AssetShortHeader;
  objectsContainer: gdObjectsContainer;
  requestedObjectName?: string;
  setIsAssetBeingInstalled: (isAssetBeingInstalled: boolean) => void;
}) => Promise<InstallAssetOutput | null>;

export declare const useInstallEffectAsset: (options: {
  project: gdProject | null | undefined;
  resourceManagementProps: ResourceManagementProps;
}) => (options: {
  assetShortHeader: AssetShortHeader;
  effectsContainer: gdEffectsContainer;
  effectName: string;
}) => Promise<gdEffect | null>;

export declare const useChooseEffectNameForEffectAsset: () => (options: {
  assetShortHeader: AssetShortHeader;
  effectsContainer: gdEffectsContainer;
}) => Promise<string | null>;

declare const NewObjectDialogWithErrorBoundary: React.ComponentType<any>;

export default NewObjectDialogWithErrorBoundary;
