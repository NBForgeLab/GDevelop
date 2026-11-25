import * as React from 'react';
import { type FiltersState } from '../UI/Search/FiltersChooser';
import {
  type AssetShortHeader,
  type PublicAssetPack,
  type PrivateAssetPack,
} from '../Utils/GDevelopServices/Asset';
import {
  type PrivateAssetPackListingData,
  type PrivateGameTemplateListingData,
  type BundleListingData,
} from '../Utils/GDevelopServices/Shop';

export type AssetStorePageState = {
  openedAssetPack: PublicAssetPack | PrivateAssetPack | null;
  openedShopCategory: string | null;
  openedAssetShortHeader: AssetShortHeader | null | undefined;
  openedPrivateAssetPackListingData:
    | PrivateAssetPackListingData
    | null
    | undefined;
  openedPrivateGameTemplateListingData:
    | PrivateGameTemplateListingData
    | null
    | undefined;
  openedBundleListingData: BundleListingData | null | undefined;
  selectedFolders: Array<string>;
  filtersState: FiltersState;
  pageBreakIndex?: number | null;
  scrollPosition?: number | null;
  displayAssets: boolean;
  searchText?: string;
};

export type NavigationState = {
  searchText: string;
  setSearchText: (text: string) => void;
  getCurrentPage: () => AssetStorePageState;
  isRootPage: boolean;
  backToPreviousPage: () => AssetStorePageState;
  openHome: () => AssetStorePageState;
  openAssetSwapping: () => AssetStorePageState;
  clearHistory: () => void;
  clearPreviousPageFromHistory: () => void;
  openSearchResultPage: () => void;
  openTagPage: (tag: string) => void;
  openShopCategoryPage: (category: string) => void;
  openPackPage: (options: {
    assetPack: PublicAssetPack | PrivateAssetPack;
    storeSearchText: boolean;
    clearSearchText: boolean;
  }) => void;
  openPrivateAssetPackInformationPage: (options: {
    privateAssetPackListingData: PrivateAssetPackListingData;
    storeSearchText: boolean;
    clearSearchText: boolean;
  }) => void;
  openPrivateGameTemplateInformationPage: (options: {
    privateGameTemplateListingData: PrivateGameTemplateListingData;
    storeSearchText: boolean;
    clearSearchText: boolean;
  }) => void;
  openBundleInformationPage: (options: {
    bundleListingData: BundleListingData;
    storeSearchText: boolean;
    clearSearchText: boolean;
  }) => void;
  openAssetDetailPage: (options: {
    assetShortHeader: AssetShortHeader;
    storeSearchText: boolean;
    clearSearchText: boolean;
  }) => void;
  navigateInsideFolder: (folder: string) => void;
  goBackToFolderIndex: (index: number) => void;
};

export declare const assetStoreHomePageState: AssetStorePageState;
export declare const isHomePage: (pageState: AssetStorePageState) => boolean;
export declare const isSearchResultPage: (
  pageState: AssetStorePageState
) => boolean;
export declare const AssetStoreNavigatorContext: React.Context<NavigationState>;
export declare const AssetStoreNavigatorStateProvider: React.ComponentType<{
  children: React.ReactNode;
}>;
