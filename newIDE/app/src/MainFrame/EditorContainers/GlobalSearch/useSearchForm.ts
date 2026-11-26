import type { SearchFilterParams } from '../../../Utils/Search';

import * as React from 'react';

type SearchFiltersState = Required<SearchFilterParams>;

type FreezedSearchState = {
  searchText: string;
  searchFilterParams: SearchFiltersState;
};

type UseSearchFormReturn = {
  search: string;
  setSearch: (arg0: string) => void;
  searchFiltersState: SearchFiltersState;
  setSearchFiltersState: (
    arg0:
      | SearchFiltersState
      | ((searchFiltersState: SearchFiltersState) => SearchFiltersState)
  ) => void;
  freezedSearchState: FreezedSearchState;
  setFreezedSearchState: (
    arg0:
      | FreezedSearchState
      | ((freezedSearchState: FreezedSearchState) => FreezedSearchState)
  ) => void;
  hasSearched: boolean;
  setHasSearched: (arg0: boolean) => void;
};

export const useSearchForm = (): UseSearchFormReturn => {
  const [search, setSearch] = React.useState<string>('');
  const [searchFiltersState, setSearchFiltersState] =
    React.useState<SearchFiltersState>({
      matchCase: false,
      searchInConditions: true,
      searchInActions: true,
      searchInEventStrings: true,
      searchInEventSentences: true,
      searchInInstructionNames: false,
      includeStoreExtensions: false,
    });

  const [freezedSearchState, setFreezedSearchState] =
    React.useState<FreezedSearchState>({
      searchFilterParams: searchFiltersState,
      searchText: search,
    });
  const [hasSearched, setHasSearched] = React.useState(false);

  return {
    search,
    setSearch,
    searchFiltersState,
    setSearchFiltersState,
    freezedSearchState,
    setFreezedSearchState,
    hasSearched,
    setHasSearched,
  };
};
