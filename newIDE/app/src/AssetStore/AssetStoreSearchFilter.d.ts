import { TagSearchFilter, type SearchFilter } from '../UI/Search/UseSearchItem';
import { type AssetShortHeader } from '../Utils/GDevelopServices/Asset';
import { type PrivateAssetPackListingData } from '../Utils/GDevelopServices/Shop';
import { type RGBColor } from '../Utils/ColorTransformer';

export declare class TagAssetStoreSearchFilter extends TagSearchFilter<AssetShortHeader> {
  constructor(tags?: Set<string>);
}

export declare const EFFECT_ASSETS_OBJECT_TYPE: string;

export declare class ObjectTypeAssetStoreSearchFilter
  implements SearchFilter<AssetShortHeader>
{
  objectTypes: Set<string>;
  constructor(objectTypes?: Set<string>);
  getPertinence(searchItem: AssetShortHeader): number;
  hasFilters(): boolean;
}

export declare class LicenseAssetStoreSearchFilter
  implements SearchFilter<AssetShortHeader>
{
  attributionFreeOnly: boolean;
  static noAttributionLicenses: Array<string>;
  constructor(attributionFreeOnly?: boolean);
  getPertinence(searchItem: AssetShortHeader): number;
  hasFilters(): boolean;
}

export declare class AssetPackTypeStoreSearchFilter
  implements SearchFilter<PrivateAssetPackListingData>
{
  constructor(...args: Array<any>);
  getPertinence(searchItem: PrivateAssetPackListingData): number;
  hasFilters(): boolean;
}

export declare class AnimatedAssetStoreSearchFilter
  implements SearchFilter<AssetShortHeader>
{
  constructor(...args: Array<any>);
  getPertinence(searchItem: AssetShortHeader): number;
  hasFilters(): boolean;
}

export declare class DimensionAssetStoreSearchFilter
  implements SearchFilter<AssetShortHeader>
{
  static boundMin: number;
  static boundMax: number;
  constructor(...args: Array<any>);
  getPertinence(searchItem: AssetShortHeader): number;
  hasFilters(): boolean;
}

export declare class ColorAssetStoreSearchFilter
  implements SearchFilter<AssetShortHeader>
{
  constructor(color?: RGBColor | null);
  getPertinence(searchItem: AssetShortHeader): number;
  hasFilters(): boolean;
}

export declare const toAssetStoreType: (type: string) => string;

export declare class AssetSwappingAssetStoreSearchFilter
  implements SearchFilter<AssetShortHeader>
{
  constructor(...args: Array<any>);
  getPertinence(searchItem: AssetShortHeader): number;
  hasFilters(): boolean;
}

export declare class SimilarAssetStoreSearchFilter
  implements SearchFilter<AssetShortHeader>
{
  constructor(other: AssetShortHeader);
  getPertinence(searchItem: AssetShortHeader): number;
  hasFilters(): boolean;
}
