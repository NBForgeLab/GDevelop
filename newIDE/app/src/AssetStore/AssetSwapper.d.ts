import { type AssetShortHeader } from '../Utils/GDevelopServices/Asset';

export declare const canSwapAssetOfObject: (object: gdObject) => boolean;

export declare const swapAsset: (
  project: gdProject,
  PixiResourcesLoader: any,
  object: gdObject,
  assetObject: gdObject,
  assetShortHeader?: AssetShortHeader | null
) => boolean;
