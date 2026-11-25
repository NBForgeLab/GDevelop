import * as React from 'react';
import { t } from '@lingui/macro';
import { type Filters } from '../Utils/GDevelopServices/Filters';
import {
  type AssetShortHeader,
  type PublicAssetPacks,
  type PublicAssetPack,
  type Author,
  type License,
  type Environment,
  listAllPublicAssets,
  listAllAuthors,
  listAllLicenses,
} from '../Utils/GDevelopServices/Asset';
import {
  listListedPrivateAssetPacks,
  type PrivateAssetPackListingData,
} from '../Utils/GDevelopServices/Shop';
import { useSearchItem, type SearchFilter } from '../UI/Search/UseSearchItem';
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
import {
  type AssetStorePageState,
  assetStoreHomePageState,
  AssetStoreNavigatorContext,
} from './AssetStoreNavigator';
import { type ChosenCategory } from '../UI/Search/FiltersChooser';
import AuthenticatedUserContext from '../Profile/AuthenticatedUserContext';
import {
  getAssetPackFromUserFriendlySlug,
  getPrivateAssetPackListingDataFromUserFriendlySlug,
} from './AssetStoreUtils';
import useAlertDialog from '../UI/Alert/useAlertDialog';

export type AssetFiltersState = {
  animatedFilter: AnimatedAssetStoreSearchFilter;
  setAnimatedFilter: (
    animatedAssetStoreSearchFilter: AnimatedAssetStoreSearchFilter
  ) => void;
  viewpointFilter: TagAssetStoreSearchFilter;
  setViewpointFilter: (
    tagAssetStoreSearchFilter: TagAssetStoreSearchFilter
  ) => void;
  dimensionFilter: DimensionAssetStoreSearchFilter;
  setDimensionFilter: (
    dimensionAssetStoreSearchFilter: DimensionAssetStoreSearchFilter
  ) => void;
  objectTypeFilter: ObjectTypeAssetStoreSearchFilter;
  setObjectTypeFilter: (
    objectTypeAssetStoreSearchFilter: ObjectTypeAssetStoreSearchFilter
  ) => void;
  colorFilter: ColorAssetStoreSearchFilter;
  setColorFilter: (
    colorAssetStoreSearchFilter: ColorAssetStoreSearchFilter
  ) => void;
  licenseFilter: LicenseAssetStoreSearchFilter;
  setLicenseFilter: (
    licenseAssetStoreSearchFilter: LicenseAssetStoreSearchFilter
  ) => void;
  assetSwappingFilter: AssetSwappingAssetStoreSearchFilter;
  setAssetSwappingFilter: (
    assetSwappingAssetStoreSearchFilter: AssetSwappingAssetStoreSearchFilter
  ) => void;
};

export type AssetPackFiltersState = {
  typeFilter: AssetPackTypeStoreSearchFilter;
  setTypeFilter: (
    assetPackTypeStoreSearchFilter: AssetPackTypeStoreSearchFilter
  ) => void;
};

type AssetStoreState = {
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

export const initialAssetStoreState: AssetStoreState = {
  filters: null,
  publicAssetPacks: null,
  privateAssetPackListingDatas: null,
  authors: null,
  licenses: null,
  environment: 'live',
  setEnvironment: () => {},
  assetShortHeadersSearchResults: null,
  publicAssetPacksSearchResults: null,
  privateAssetPackListingDatasSearchResults: null,
  fetchAssetsAndFilters: () => {},
  error: null,
  assetFiltersState: {
    animatedFilter: new AnimatedAssetStoreSearchFilter(),
    setAnimatedFilter: (filter) => {},
    viewpointFilter: new TagAssetStoreSearchFilter(),
    setViewpointFilter: (filter) => {},
    dimensionFilter: new DimensionAssetStoreSearchFilter(),
    setDimensionFilter: (filter) => {},
    objectTypeFilter: new ObjectTypeAssetStoreSearchFilter(),
    setObjectTypeFilter: (filter) => {},
    colorFilter: new ColorAssetStoreSearchFilter(),
    setColorFilter: (filter) => {},
    licenseFilter: new LicenseAssetStoreSearchFilter(),
    setLicenseFilter: (filter) => {},
    assetSwappingFilter: new AssetSwappingAssetStoreSearchFilter(),
    setAssetSwappingFilter: (filter) => {},
  },
  assetPackFiltersState: {
    typeFilter: new AssetPackTypeStoreSearchFilter({}),
    setTypeFilter: (filter) => {},
  },
  clearAllFilters: () => {},
  currentPage: assetStoreHomePageState,
  useSearchItem: (searchText, chosenCategory, chosenFilters, searchFilters) =>
    null,
  setInitialPackUserFriendlySlug: (initialPackUserFriendlySlug: string) => {},
  getAssetShortHeaderFromId: (id: string) => null,
};

export const AssetStoreContext: React.Context<AssetStoreState> =
  React.createContext<AssetStoreState>(initialAssetStoreState);

type AssetStoreStateProviderProps = {
  children: React.ReactNode;
};

const getAssetShortHeaderSearchTerms = (assetShortHeader: AssetShortHeader) => {
  return (
    assetShortHeader.name +
    '\n' +
    assetShortHeader.shortDescription +
    '\n' +
    assetShortHeader.tags.join(', ')
  );
};

const getPublicAssetPackSearchTerms = (assetPack: PublicAssetPack) =>
  assetPack.name +
  '\n' +
  assetPack.tag +
  '\n' +
  assetPack.authors.map((author) => author.name).join(', ');

const getPrivateAssetPackListingDataSearchTerms = (
  privateAssetPack: PrivateAssetPackListingData
) => privateAssetPack.name + '\n' + privateAssetPack.description;

export const AssetStoreStateProvider = ({
  children,
}: AssetStoreStateProviderProps): React.ReactElement<any> => {
  const shopNavigationState = React.useContext(AssetStoreNavigatorContext);
  const { searchText } = shopNavigationState;

  const [assetShortHeadersById, setAssetShortHeadersById] = React.useState<
    | {
        [key: string]: AssetShortHeader;
      }
    | null
    | undefined
  >(null);
  // The id can be shortened to its first characters (the AI is given 10 of
  // them): it must then be the start of exactly one id.
  const getAssetShortHeaderFromId = React.useCallback(
    (id: string): AssetShortHeader | null => {
      if (!assetShortHeadersById) return null;
      if (assetShortHeadersById[id]) return assetShortHeadersById[id];
      const matchingIds = Object.keys(assetShortHeadersById).filter((fullId) =>
        fullId.startsWith(id)
      );
      return matchingIds.length === 1
        ? assetShortHeadersById[matchingIds[0]]
        : null;
    },
    [assetShortHeadersById]
  );
  const [publicAssetShortHeaders, setPublicAssetShortHeaders] = React.useState<
    Array<AssetShortHeader> | null | undefined
  >(null);
  const { receivedAssetShortHeaders, receivedAssetPacks, limits } =
    React.useContext(AuthenticatedUserContext);
  const [filters, setFilters] = React.useState<Filters | null | undefined>(
    null
  );
  const [publicAssetPacks, setPublicAssetPacks] = React.useState<
    PublicAssetPacks | null | undefined
  >(null);
  const [privateAssetPackListingDatas, setPrivateAssetPackListingDatas] =
    React.useState<Array<PrivateAssetPackListingData> | null | undefined>(null);
  const [authors, setAuthors] = React.useState<
    Array<Author> | null | undefined
  >(null);
  const [licenses, setLicenses] = React.useState<
    Array<License> | null | undefined
  >(null);
  const [environment, setEnvironment] = React.useState<Environment>('live');
  const [error, setError] = React.useState<Error | null | undefined>(null);
  const [initialPackUserFriendlySlug, setInitialPackUserFriendlySlug] =
    React.useState<string | null | undefined>(null);
  const initialPackOpened = React.useRef<boolean>(false);
  const { showAlert } = useAlertDialog();

  const [animatedFilter, setAnimatedFilter] =
    React.useState<AnimatedAssetStoreSearchFilter>(
      new AnimatedAssetStoreSearchFilter()
    );
  const [viewpointFilter, setViewpointFilter] =
    React.useState<TagAssetStoreSearchFilter>(new TagAssetStoreSearchFilter());
  const [dimensionFilter, setDimensionFilter] =
    React.useState<DimensionAssetStoreSearchFilter>(
      new DimensionAssetStoreSearchFilter()
    );
  const [objectTypeFilter, setObjectTypeFilter] =
    React.useState<ObjectTypeAssetStoreSearchFilter>(
      new ObjectTypeAssetStoreSearchFilter()
    );
  const [colorFilter, setColorFilter] =
    React.useState<ColorAssetStoreSearchFilter>(
      new ColorAssetStoreSearchFilter()
    );
  const [licenseFilter, setLicenseFilter] =
    React.useState<LicenseAssetStoreSearchFilter>(
      new LicenseAssetStoreSearchFilter()
    );
  const [assetSwappingFilter, setAssetSwappingFilter] =
    React.useState<AssetSwappingAssetStoreSearchFilter>(
      new AssetSwappingAssetStoreSearchFilter()
    );
  // When one of the filter change, we need to rebuild the array
  // for the search.
  const assetSearchFilters = React.useMemo<
    Array<SearchFilter<AssetShortHeader>>
  >(
    () => [
      animatedFilter,
      viewpointFilter,
      dimensionFilter,
      objectTypeFilter,
      colorFilter,
      licenseFilter,
      assetSwappingFilter,
    ],
    [
      animatedFilter,
      viewpointFilter,
      dimensionFilter,
      objectTypeFilter,
      colorFilter,
      licenseFilter,
      assetSwappingFilter,
    ]
  );

  const [assetPackTypeFilter, setAssetPackTypeFilter] =
    React.useState<AssetPackTypeStoreSearchFilter>(
      new AssetPackTypeStoreSearchFilter({ receivedAssetPacks })
    );
  const assetPackSearchFilters = React.useMemo<
    Array<SearchFilter<PublicAssetPack | PrivateAssetPackListingData>>
  >(() => [assetPackTypeFilter], [assetPackTypeFilter]);
  const hidePremiumProducts =
    !!limits &&
    !!limits.capabilities.classrooms &&
    limits.capabilities.classrooms.hidePremiumProducts;

  // Only the last fetch is applied: switching the environment while a fetch is
  // running must not let the previous environment's assets come last.
  const lastFetchIndex = React.useRef<number>(0);
  const fetchAssetsAndFilters = React.useCallback(() => {
    (async () => {
      lastFetchIndex.current++;
      const fetchIndex = lastFetchIndex.current;
      setError(null);

      try {
        const {
          publicAssetShortHeaders: fetchedPublicAssetShortHeaders,
          publicFilters: fetchedPublicFilters,
          publicAssetPacks: fetchedPublicAssetPacks,
        } = await listAllPublicAssets({ environment });
        const fetchedAuthors = await listAllAuthors({ environment });
        const fetchedLicenses = await listAllLicenses({ environment });
        const fetchedPrivateAssetPackListingDatas =
          await listListedPrivateAssetPacks();
        if (fetchIndex !== lastFetchIndex.current) return;

        console.info(
          `Loaded ${
            fetchedPublicAssetShortHeaders
              ? fetchedPublicAssetShortHeaders.length
              : 0
          } assets from the asset store.`
        );
        setPublicAssetPacks(fetchedPublicAssetPacks);
        setPublicAssetShortHeaders(fetchedPublicAssetShortHeaders);
        setFilters(fetchedPublicFilters);
        setAuthors(fetchedAuthors);
        setLicenses(fetchedLicenses);
        setPrivateAssetPackListingDatas(fetchedPrivateAssetPackListingDatas);
      } catch (error) {
        if (fetchIndex !== lastFetchIndex.current) return;
        console.error(`Unable to load the assets from the asset store:`, error);
        setError(error instanceof Error ? error : new Error(String(error)));
      }
    })();
  }, [environment]);

  // When the public assets or the private assets are loaded, regenerate the
  // list of all assets by ids.
  React.useEffect(() => {
    const assetShortHeadersById: { [key: string]: AssetShortHeader } = {};
    if (publicAssetShortHeaders) {
      publicAssetShortHeaders.forEach((assetShortHeader) => {
        assetShortHeadersById[assetShortHeader.id] = assetShortHeader;
      });
    }
    if (receivedAssetShortHeaders) {
      receivedAssetShortHeaders.forEach((assetShortHeader) => {
        assetShortHeadersById[assetShortHeader.id] = assetShortHeader;
      });
    }
    if (Object.keys(assetShortHeadersById).length > 0) {
      setAssetShortHeadersById(assetShortHeadersById);
    }
  }, [publicAssetShortHeaders, receivedAssetShortHeaders]);

  // When the asset packs (public and received private packs) are loaded,
  // open the asset pack with the slug that was asked to be initially loaded.
  React.useEffect(() => {
    if (!initialPackUserFriendlySlug || initialPackOpened.current) {
      // If there is no initial pack or
      // if the pack was already opened, don't re-open it again even
      // if the effect run again.
      return;
    }

    if (
      publicAssetPacks &&
      receivedAssetPacks &&
      privateAssetPackListingDatas &&
      initialPackUserFriendlySlug
    ) {
      initialPackOpened.current = true;

      // Try to first find a public or received asset pack.
      const assetPack = getAssetPackFromUserFriendlySlug({
        publicAssetPacks,
        receivedAssetPacks,
        userFriendlySlug: initialPackUserFriendlySlug,
      });

      if (assetPack) {
        shopNavigationState.openPackPage({
          assetPack,
          storeSearchText: true,
          clearSearchText: false,
        });
        initialPackOpened.current = false; // Allow to open the pack again if the effect run again.
        setInitialPackUserFriendlySlug(null);
        return;
      }

      // Otherwise, try to open the information page of a pack not yet bought.
      const privateAssetPackListingData =
        getPrivateAssetPackListingDataFromUserFriendlySlug({
          privateAssetPackListingDatas,
          userFriendlySlug: initialPackUserFriendlySlug,
        });

      if (privateAssetPackListingData) {
        shopNavigationState.openPrivateAssetPackInformationPage({
          privateAssetPackListingData,
          storeSearchText: true,
          clearSearchText: false,
        });
        initialPackOpened.current = false; // Allow to open the pack again if the effect run again.
        setInitialPackUserFriendlySlug(null);
        return;
      }

      showAlert({
        title: t`Asset pack not found`,
        message: t`The link to the asset pack you've followed seems outdated. Why not take a look at the other packs in the asset store?`,
      });
    }
  }, [
    publicAssetPacks,
    receivedAssetPacks,
    privateAssetPackListingDatas,
    shopNavigationState,
    showAlert,
    initialPackUserFriendlySlug,
  ]);

  React.useEffect(() => {
    // the callback fetchAssetsAndFilters depends on the environment,
    // so it will be called again if the environment changes.
    fetchAssetsAndFilters();
  }, [fetchAssetsAndFilters]);

  const publicAssetPacksByTag = React.useMemo(() => {
    if (!publicAssetPacks || !publicAssetPacks.starterPacks) {
      return null;
    }
    const publicAssetPacksByTag: { [tag: string]: PublicAssetPack } = {};
    publicAssetPacks.starterPacks.forEach((assetPack) => {
      const tag = assetPack.tag;
      if (
        publicAssetPacksByTag[tag] &&
        !assetPack.externalWebLink // Don't warn for external web links, as they can be used multiple times.
      ) {
        console.warn(`Multiple public asset packs with the same tag: ${tag}`);
      }
      publicAssetPacksByTag[tag] = assetPack;
    });
    return publicAssetPacksByTag;
  }, [publicAssetPacks]);

  const privateAssetPackListingDatasById = React.useMemo(() => {
    if (!privateAssetPackListingDatas) {
      return null;
    }
    const privateAssetPackListingDatasById: {
      [id: string]: PrivateAssetPackListingData;
    } = {};
    if (hidePremiumProducts) return privateAssetPackListingDatasById;
    privateAssetPackListingDatas.forEach((privateAssetPackListingData) => {
      const id = privateAssetPackListingData.id;
      if (privateAssetPackListingDatasById[id]) {
        console.warn(`Multiple private asset packs with the same id: ${id}`);
      }
      privateAssetPackListingDatasById[id] = privateAssetPackListingData;
    });
    return privateAssetPackListingDatasById;
  }, [privateAssetPackListingDatas, hidePremiumProducts]);

  const currentPage = shopNavigationState.getCurrentPage();
  const { chosenCategory, chosenFilters } = currentPage.filtersState;

  // Map each public asset pack tag to its authors' names. The author is not
  // stored on the asset short header itself, but assets inherit the authors of
  // their pack (identified by the asset's first tag), so this lets assets be
  // searched by their author's name.
  const authorNamesByAssetPackTag = React.useMemo<{
    [key: string]: string;
  }>(() => {
    const authorNamesByTag: {
      [key: string]: string;
    } = {};
    if (publicAssetPacks) {
      publicAssetPacks.starterPacks.forEach((assetPack) => {
        if (assetPack.authors.length > 0) {
          authorNamesByTag[assetPack.tag] = assetPack.authors
            .map((author) => author.name)
            .join(', ');
        }
      });
    }
    return authorNamesByTag;
  }, [publicAssetPacks]);
  const getAssetShortHeaderSearchTermsWithAuthors = React.useCallback(
    (assetShortHeader: AssetShortHeader) => {
      const searchTerms = getAssetShortHeaderSearchTerms(assetShortHeader);
      const assetPackTag = assetShortHeader.tags[0];
      const authorNames = assetPackTag
        ? authorNamesByAssetPackTag[assetPackTag]
        : null;
      return authorNames ? searchTerms + '\n' + authorNames : searchTerms;
    },
    [authorNamesByAssetPackTag]
  );

  const assetShortHeadersSearchResults:
    | Array<AssetShortHeader>
    | null
    | undefined = useSearchItem(
    assetShortHeadersById,
    getAssetShortHeaderSearchTermsWithAuthors,
    searchText,
    chosenCategory,
    chosenFilters,
    assetSearchFilters
  );

  // this filter works for both public and private packs
  const publicAssetPacksSearchResults:
    | Array<PublicAssetPack>
    | null
    | undefined = useSearchItem(
    publicAssetPacksByTag,
    // this filter works for both public and private packs
    getPublicAssetPackSearchTerms,
    searchText,
    chosenCategory,
    null,
    // this filter works for both public and private packs
    assetPackSearchFilters
  );

  // this filter works for both public and private packs
  const privateAssetPackListingDatasSearchResults:
    | Array<PrivateAssetPackListingData>
    | null
    | undefined = useSearchItem(
    privateAssetPackListingDatasById,
    // this filter works for both public and private packs
    getPrivateAssetPackListingDataSearchTerms,
    searchText,
    chosenCategory,
    null,
    // this filter works for both public and private packs
    assetPackSearchFilters
  );

  const assetFiltersState: AssetFiltersState = React.useMemo(
    () => ({
      animatedFilter,
      setAnimatedFilter,
      viewpointFilter,
      setViewpointFilter,
      dimensionFilter,
      setDimensionFilter,
      objectTypeFilter,
      setObjectTypeFilter,
      colorFilter,
      setColorFilter,
      licenseFilter,
      setLicenseFilter,
      assetSwappingFilter,
      setAssetSwappingFilter,
    }),
    [
      animatedFilter,
      setAnimatedFilter,
      viewpointFilter,
      setViewpointFilter,
      dimensionFilter,
      setDimensionFilter,
      objectTypeFilter,
      setObjectTypeFilter,
      colorFilter,
      setColorFilter,
      licenseFilter,
      setLicenseFilter,
      assetSwappingFilter,
      setAssetSwappingFilter,
    ]
  );

  const assetPackFiltersState: AssetPackFiltersState = React.useMemo(
    () => ({
      typeFilter: assetPackTypeFilter,
      setTypeFilter: setAssetPackTypeFilter,
    }),
    [assetPackTypeFilter, setAssetPackTypeFilter]
  );

  const clearAllFilters = React.useCallback(() => {
    assetFiltersState.setAnimatedFilter(new AnimatedAssetStoreSearchFilter());
    assetFiltersState.setViewpointFilter(new TagAssetStoreSearchFilter());
    assetFiltersState.setDimensionFilter(new DimensionAssetStoreSearchFilter());
    assetFiltersState.setObjectTypeFilter(
      new ObjectTypeAssetStoreSearchFilter()
    );
    assetFiltersState.setColorFilter(new ColorAssetStoreSearchFilter());
    assetFiltersState.setLicenseFilter(new LicenseAssetStoreSearchFilter());
    assetPackFiltersState.setTypeFilter(new AssetPackTypeStoreSearchFilter({}));
    // Keep assetSwappingFilter as its not a user filter.
  }, [assetFiltersState, assetPackFiltersState]);

  const assetStoreState = React.useMemo(
    () => ({
      assetShortHeadersSearchResults,
      publicAssetPacksSearchResults,
      privateAssetPackListingDatasSearchResults: hidePremiumProducts
        ? []
        : privateAssetPackListingDatasSearchResults,
      fetchAssetsAndFilters,
      filters,
      publicAssetPacks,
      privateAssetPackListingDatas: hidePremiumProducts
        ? []
        : privateAssetPackListingDatas,
      authors,
      licenses,
      environment,
      setEnvironment,
      error,
      currentPage,
      assetFiltersState,
      assetPackFiltersState,
      clearAllFilters,
      useSearchItem: (
        searchText: string,
        chosenCategory: ChosenCategory | null | undefined,
        chosenFilters: Set<string> | null | undefined,
        searchFilters: Array<SearchFilter<AssetShortHeader>>
      ) =>
        useSearchItem(
          assetShortHeadersById,
          getAssetShortHeaderSearchTermsWithAuthors,
          searchText,
          chosenCategory,
          chosenFilters,
          searchFilters
        ),
      setInitialPackUserFriendlySlug,
      getAssetShortHeaderFromId,
    }),
    [
      assetShortHeadersSearchResults,
      publicAssetPacksSearchResults,
      hidePremiumProducts,
      privateAssetPackListingDatasSearchResults,
      fetchAssetsAndFilters,
      filters,
      publicAssetPacks,
      privateAssetPackListingDatas,
      authors,
      licenses,
      environment,
      error,
      currentPage,
      assetFiltersState,
      assetPackFiltersState,
      clearAllFilters,
      getAssetShortHeaderFromId,
      assetShortHeadersById,
      getAssetShortHeaderSearchTermsWithAuthors,
    ]
  );

  return (
    <AssetStoreContext.Provider value={assetStoreState}>
      {children}
    </AssetStoreContext.Provider>
  );
};
