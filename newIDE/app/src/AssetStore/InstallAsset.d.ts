import { type Asset } from '../Utils/GDevelopServices/Asset';
import {
  type ExtensionShortHeader,
  type ExtensionDependency,
} from '../Utils/GDevelopServices/Extension';
import { type RequiredExtensionInstallation } from './ExtensionStore/InstallExtension';

export type AddAssetOutput = {
  createdObjects: Array<gdObject>;
};

export type InstallAssetOutput = {
  createdObjects: Array<gdObject>;
  isTheFirstOfItsTypeInProject: boolean;
};

export type InstallAssetArgs = {
  asset: Asset;
  project: gdProject;
  objectsContainer: gdObjectsContainer;
  targetObjectFolderOrObject?: gdObjectFolderOrObject | null;
  requestedObjectName?: string;
};

export declare const installResource: (
  project: gdProject,
  asset: Asset,
  serializedResource: any,
  resourceNewNames: { [key: string]: string }
) => void;

export declare const installEffectAsset: (options: {
  asset: Asset;
  project: gdProject;
  effectsContainer: gdEffectsContainer;
  effectName: string;
}) => gdEffect | null;

export declare const addAssetToProject: (
  args: InstallAssetArgs
) => Promise<AddAssetOutput>;

export declare const installPublicAsset: typeof addAssetToProject;

export declare const getRequiredExtensionsFromAsset: (
  asset: Asset
) => Array<ExtensionDependency>;

export declare const getRequiredExtensionsFromAssets: (
  assets: Array<Asset>
) => Array<ExtensionDependency>;

export declare const checkRequiredExtensionsUpdateForAssets: (options: {
  assets: Array<Asset>;
  project: gdProject;
  extensionShortHeadersByName: { [name: string]: ExtensionShortHeader };
}) => Promise<RequiredExtensionInstallation>;

export declare const complyVariantsToEventsBasedObjectOf: (
  project: gdProject,
  createdObjectTypes: Array<string>
) => void;
