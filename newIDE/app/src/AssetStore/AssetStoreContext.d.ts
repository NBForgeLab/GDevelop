import * as React from 'react';
import { type Filters } from '../Utils/GDevelopServices/Filters';
import {
  type AssetShortHeader,
  type PublicAssetPacks,
  type PublicAssetPack,
  type Author,
  type License,
  type Environment,
} from '../Utils/GDevelopServices/Asset';
import { type PrivateAssetPackListingData } from '../Utils/GDevelopServices/Shop';
import { type SearchFilter } from '../UI/Search/UseSearchItem';
import {
  TagAssetStoreSearchFilter,
  AnimatedAssetStoreSearchFilter,
  ObjectTypeAssetStoreSearchFilter,
  ColorAssetStoreSearchFilter,
  LicenseAssetStoreSearchFilter,
  DimensionAssetStoreSearchFilter,
  AssetPackTypeStoreSearchFilter,
  AssetSwappingAssetStoreSearchFilter,
} from './AssetStoreSearchFilter';
import { type AssetStorePageState } from './AssetStoreNavigator';
import { type ChosenCategory } from '../UI/Search/FiltersChooser';

export type AssetFiltersState = {
  animatedFilter: AnimatedAssetStoreSearchFilter;
  setAnimatedFilter: (filter: AnimatedAssetStoreSearchFilter) => void;
  viewpointFilter: TagAssetStoreSearchFilter;
  setViewpointFilter: (filter: TagAssetStoreSearchFilter) => void;
  dimensionFilter: DimensionAssetStoreSearchFilter;
  setDimensionFilter: (filter: DimensionAssetStoreSearchFilter) => void;
  objectTypeFilter: ObjectTypeAssetStoreSearchFilter;
  setObjectTypeFilter: (filter: ObjectTypeAssetStoreSearchFilter) => void;
  colorFilter: ColorAssetStoreSearchFilter;
  setColorFilter: (filter: ColorAssetStoreSearchFilter) => void;
  licenseFilter: LicenseAssetStoreSearchFilter;
  setLicenseFilter: (filter: LicenseAssetStoreSearchFilter) => void;
  assetSwappingFilter: AssetSwappingAssetStoreSearchFilter;
  setAssetSwappingFilter: (filter: AssetSwappingAssetStoreSearchFilter) => void;
};

export type AssetPackFiltersState = {
  typeFilter: AssetPackTypeStoreSearchFilter;
  setTypeFilter: (filter: AssetPackTypeStoreSearchFilter) => void;
};

export type AssetStoreState = {
  filters: Filters | null | undefined;
  publicAssetPacks: PublicAssetPacks | null | undefined;
  privateAssetPackListingDatas:
    | Array<PrivateAssetPackListingData>
    | null
    | undefined;
  authors: Array<Author> | null | undefined;
  licenses: Array<License> | null | undefined;
  environment: Environment;
  setEnvironment: (environment: Environment) => void;
  assetShortHeadersSearchResults: Array<AssetShortHeader> | null | undefined;
  publicAssetPacksSearchResults: Array<PublicAssetPack> | null | undefined;
  privateAssetPackListingDatasSearchResults:
    | Array<PrivateAssetPackListingData>
    | null
    | undefined;
  fetchAssetsAndFilters: () => void;
  error: Error | null | undefined;
  assetFiltersState: AssetFiltersState;
  assetPackFiltersState: AssetPackFiltersState;
  clearAllFilters: () => void;
  currentPage: AssetStorePageState;
  useSearchItem: (
    searchText: string,
    chosenCategory: ChosenCategory | null | undefined,
    chosenFilters: Set<string> | null | undefined,
    searchFilters: Array<SearchFilter<AssetShortHeader>>
  ) => Array<AssetShortHeader> | null | undefined;
  setInitialPackUserFriendlySlug: (initialPackUserFriendlySlug: string) => void;
  getAssetShortHeaderFromId: (id: string) => AssetShortHeader | null;
};

export declare const initialAssetStoreState: AssetStoreState;

export declare const AssetStoreContext: React.Context<AssetStoreState>;

export declare const AssetStoreStateProvider: React.ComponentType<{
  children: React.ReactNode;
}>;
