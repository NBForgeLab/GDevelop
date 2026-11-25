import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type FiltersState } from '../../UI/Search/FiltersChooser';
import { type ExtensionShortHeader } from '../../Utils/GDevelopServices/Extension';
import { type Filters } from '../../Utils/GDevelopServices/Filters';
import { type SearchResult } from '../../UI/Search/UseSearchStructuredItem';

type ExtensionStoreState = {
  filters: Filters | null | undefined;
  searchResults: Array<SearchResult<ExtensionShortHeader>> | null | undefined;
  fetchExtensionsAndFilters: () => void;
  error: Error | null | undefined;
  searchText: string;
  setSearchText: (text: string) => void;
  allCategories: string[];
  chosenCategory: string;
  setChosenCategory: (category: string) => void;
  translatedExtensionShortHeadersByName: {
    [name: string]: ExtensionShortHeader;
  };
  filtersState: FiltersState;
  hasExtensionNamed: (extensionName: string) => boolean;
};

export declare const ExtensionStoreContext: React.Context<ExtensionStoreState>;

export declare const ExtensionStoreStateProvider: React.ComponentType<{
  children: React.ReactNode;
  i18n: I18nType;
  defaultSearchText?: string;
}>;
