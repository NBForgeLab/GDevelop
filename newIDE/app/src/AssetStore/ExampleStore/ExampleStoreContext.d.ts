import * as React from 'react';
import { type FiltersState } from '../../UI/Search/FiltersChooser';
import { type ExampleShortHeader } from '../../Utils/GDevelopServices/Example';
import { type Filters } from '../../Utils/GDevelopServices/Filters';
import { type SearchResult } from '../../UI/Search/UseSearchStructuredItem';

type ExampleStoreState = {
  exampleFilters: Filters | null | undefined;
  exampleShortHeadersSearchResults:
    | Array<SearchResult<ExampleShortHeader>>
    | null
    | undefined;
  fetchExamplesAndFilters: () => void;
  exampleShortHeaders: Array<ExampleShortHeader> | null | undefined;
  error: Error | null | undefined;
  searchText: string;
  setSearchText: (text: string) => void;
  filtersState: FiltersState;
};

export declare const ExampleStoreContext: React.Context<ExampleStoreState>;

export declare const ExampleStoreStateProvider: React.ComponentType<{
  children: React.ReactNode;
}>;
