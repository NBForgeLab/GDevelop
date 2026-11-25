import * as React from 'react';
import { type FiltersState } from '../UI/Search/FiltersChooser';
import { type ObjectShortHeader } from '../Utils/GDevelopServices/Extension';
import { type Filters } from '../Utils/GDevelopServices/Filters';
import { type SearchResult } from '../UI/Search/UseSearchStructuredItem';

type TranslatedObjectShortHeader = ObjectShortHeader & {
  englishFullName: string;
  englishDescription: string;
};

export type ObjectCategory = {
  categoryId: string;
  name: string;
  tags: [];
  tier: '';
};

type ObjectStoreState = {
  filters: Filters | null | undefined;
  searchResults:
    | Array<SearchResult<ObjectShortHeader | ObjectCategory>>
    | null
    | undefined;
  fetchObjects: () => void;
  error: Error | null | undefined;
  searchText: string;
  setSearchText: (searchText: string) => void;
  allCategories: Array<string>;
  chosenCategory: string;
  setChosenCategory: (category: string) => void;
  setInstalledObjectMetadataList: (
    installedObjectMetadataList: Array<ObjectShortHeader>
  ) => void;
  translatedObjectShortHeadersByType: {
    [name: string]: TranslatedObjectShortHeader;
  };
  filtersState: FiltersState;
};

export declare const ObjectStoreContext: React.Context<ObjectStoreState>;
