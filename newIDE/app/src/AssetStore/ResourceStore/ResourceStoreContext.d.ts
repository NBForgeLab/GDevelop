import * as React from 'react';
import {
  type Resource,
  type ResourceV2,
  type AudioResourceV2,
  type FontResourceV2,
  type Author,
  type License,
} from '../../Utils/GDevelopServices/Asset';
import { type Filters } from '../../Utils/GDevelopServices/Filters';
import { type SearchFilter } from '../../UI/Search/UseSearchItem';

export type ResourceKindSupportedByResourceStore = 'audio' | 'font' | 'svg';

export type ResourceStoreState = {
  filters: Filters | null | undefined;
  authors: Array<Author> | null | undefined;
  licenses: Array<License> | null | undefined;
  searchResults:
    | Array<FontResourceV2>
    | Array<AudioResourceV2>
    | Array<Resource>
    | null
    | undefined;
  fetchResourcesAndFilters: () => void;
  error: Error | null | undefined;
  searchText: string;
  setSearchText: (text: string) => void;
  clearAllFilters: () => void;
  setSearchResourceKind: (kind: ResourceKindSupportedByResourceStore) => void;
  getAuthorsDisplayLinks: (resource: ResourceV2) => React.ReactNode;
  audioFiltersState: {
    durationFilter: SearchFilter<AudioResourceV2>;
    setDurationFilter: (filter: SearchFilter<AudioResourceV2>) => void;
    audioTypeFilter: SearchFilter<AudioResourceV2>;
    setAudioTypeFilter: (filter: SearchFilter<AudioResourceV2>) => void;
  };
  fontFiltersState: {
    alphabetSupportFilter: SearchFilter<FontResourceV2>;
    setAlphabetSupportFilter: (filter: SearchFilter<FontResourceV2>) => void;
  };
};

export declare const ResourceStoreContext: React.Context<ResourceStoreState>;

export declare const ResourceStoreStateProvider: React.ComponentType<{
  children: React.ReactNode;
}>;
