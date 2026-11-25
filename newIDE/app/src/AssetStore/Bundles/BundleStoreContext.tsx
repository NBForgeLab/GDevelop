import * as React from 'react';
import { type FiltersState } from '../../UI/Search/FiltersChooser';
import { type Filters } from '../../Utils/GDevelopServices/Filters';
import { useSearchItem } from '../../UI/Search/UseSearchItem';
import {
  listListedBundles,
  type BundleListingData,
} from '../../Utils/GDevelopServices/Shop';
import { capitalize } from 'lodash';
import { AssetStoreNavigatorContext } from '../AssetStoreNavigator';
import {
  getBundleListingDataFromCategory,
  getBundleListingDataFromUserFriendlySlug,
} from '../AssetStoreUtils';
import useAlertDialog from '../../UI/Alert/useAlertDialog';
import { t } from '@lingui/macro';
import { sendBundleInformationOpened } from '../../Utils/Analytics/EventSender';
import { BUNDLES_FETCH_TIMEOUT } from '../../Utils/GlobalFetchTimeouts';
import AuthenticatedUserContext from '../../Profile/AuthenticatedUserContext';

const getBundleListingDataSearchTerms = (bundle: BundleListingData) =>
  bundle.name + '\n' + bundle.description + '\n' + bundle.categories.join('\n');

type BundleStoreState = {
  bundleFilters: Filters | null | undefined;
  fetchBundles: () => void;
  bundleListingDatas: Array<BundleListingData> | null | undefined;
  error: Error | null | undefined;
  shop: {
    bundleListingDatasSearchResults:
      | Array<BundleListingData>
      | null
      | undefined;
    filtersState: FiltersState;
    setInitialBundleUserFriendlySlug: (arg0: string) => void;
    setInitialBundleCategory: (arg0: string) => void;
  };
};

export const initialBundleStoreState: BundleStoreState = {
  bundleFilters: null,
  fetchBundles: () => {},
  bundleListingDatas: null,
  error: null,
  shop: {
    bundleListingDatasSearchResults: null,
    filtersState: {
      chosenFilters: new Set(),
      addFilter: () => {},
      removeFilter: () => {},
      chosenCategory: null,
      setChosenCategory: () => {},
    },
    setInitialBundleUserFriendlySlug: (
      initialBundleUserFriendlySlug: string
    ) => {},
    setInitialBundleCategory: (initialBundleCategory: string) => {},
  },
};

export const BundleStoreContext: React.Context<BundleStoreState> =
  React.createContext<BundleStoreState>(initialBundleStoreState);

type BundleStoreStateProviderProps = {
  children: React.ReactNode;
};

export const BundleStoreStateProvider = ({
  children,
}: BundleStoreStateProviderProps): React.ReactElement<any> => {
  const shopNavigationState = React.useContext(AssetStoreNavigatorContext);
  const { searchText: shopSearchText, setSearchText: setShopSearchText } =
    shopNavigationState;
  const { limits } = React.useContext(AuthenticatedUserContext);

  const [bundleFilters, setBundleFilters] = React.useState<
    Filters | null | undefined
  >(null);
  const [error, setError] = React.useState<Error | null | undefined>(null);
  const [bundleListingDatas, setBundleListingDatas] = React.useState<
    Array<BundleListingData> | null | undefined
  >(null);
  const [initialBundleUserFriendlySlug, setInitialBundleUserFriendlySlug] =
    React.useState<string | null | undefined>(null);
  const [initialBundleCategory, setInitialBundleCategory] = React.useState<
    string | null | undefined
  >(null);
  const initialBundleOpened = React.useRef<boolean>(false);

  const isLoading = React.useRef<boolean>(false);
  const { showAlert } = useAlertDialog();

  const hidePremiumProducts =
    !!limits &&
    !!limits.capabilities.classrooms &&
    limits.capabilities.classrooms.hidePremiumProducts;

  const fetchBundles = React.useCallback(() => {
    // If the bundles are already loaded, don't load them again.
    if (isLoading.current || bundleListingDatas) return;

    (async () => {
      setError(null);
      isLoading.current = true;

      try {
        const fetchedBundleListingDatas = await listListedBundles();

        console.info(
          `Loaded ${
            fetchedBundleListingDatas ? fetchedBundleListingDatas.length : 0
          } bundles from the store.`
        );

        setBundleListingDatas(fetchedBundleListingDatas);
        const defaultTags = fetchedBundleListingDatas.reduce(
          (
            allCategories: Array<string>,
            bundleListingData: BundleListingData
          ) => {
            return allCategories.concat(
              bundleListingData.categories.map((category) =>
                capitalize(category)
              )
            );
          },
          []
        );
        const uniqueDefaultTags = Array.from(new Set(defaultTags));
        const bundleFilters: Filters = {
          allTags: [],
          defaultTags: uniqueDefaultTags,
          tagsTree: [],
        };
        setBundleFilters(bundleFilters);
      } catch (error) {
        console.error(`Unable to load the bundles from the store:`, error);
        setError(error as Error);
      }

      isLoading.current = false;
    })();
  }, [bundleListingDatas]);

  // When the bundles are loaded,
  // open the bundle with the slug that was asked to be initially loaded.
  React.useEffect(() => {
    if (
      (!initialBundleUserFriendlySlug && !initialBundleCategory) ||
      initialBundleOpened.current ||
      !bundleListingDatas
    ) {
      // If there is no initial bundle or
      // if the bundle was already opened, don't re-open it again even
      // if the effect run again.
      return;
    }

    initialBundleOpened.current = true;

    let bundleListingData: BundleListingData | null | undefined = null;
    // Open the information page of a the bundle.
    if (initialBundleUserFriendlySlug) {
      bundleListingData = getBundleListingDataFromUserFriendlySlug({
        bundleListingDatas,
        userFriendlySlug: initialBundleUserFriendlySlug,
      });
    } else if (initialBundleCategory) {
      bundleListingData = getBundleListingDataFromCategory({
        bundleListingDatas,
        category: initialBundleCategory,
      });
    }

    if (!bundleListingData) {
      showAlert({
        title: t`Bundle not found`,
        message: t`The link to the bundle you've followed seems outdated. Why not take a look at the other bundles in the store?`,
      });
      setInitialBundleUserFriendlySlug(null);
      setInitialBundleCategory(null);
      initialBundleOpened.current = false; // Allow to open the bundle again if the effect run again.
      return;
    }

    const priceForUsageType = bundleListingData.prices.find(
      (price) => price.usageType === 'default'
    );
    sendBundleInformationOpened({
      bundleName: bundleListingData.name,
      bundleId: bundleListingData.id,
      source: 'web-link',
      priceValue: priceForUsageType && priceForUsageType.value,
      priceCurrency: priceForUsageType && priceForUsageType.currency,
    });
    shopNavigationState.openBundleInformationPage({
      bundleListingData,
      storeSearchText: true,
      clearSearchText: false,
    });
    initialBundleOpened.current = false; // Allow to open the bundle again if the effect run again.
    setInitialBundleUserFriendlySlug(null);
    setInitialBundleCategory(null);
  }, [
    bundleListingDatas,
    shopNavigationState,
    showAlert,
    initialBundleUserFriendlySlug,
    initialBundleCategory,
  ]);

  React.useEffect(() => {
    if (isLoading.current) return;

    const timeoutId = setTimeout(() => {
      console.info('Pre-fetching bundles from the store...');
      fetchBundles();
    }, BUNDLES_FETCH_TIMEOUT);
    return () => clearTimeout(timeoutId);
  }, [fetchBundles]);

  const bundleListingDatasById = React.useMemo(() => {
    if (!bundleListingDatas) {
      return null;
    }
    const bundleListingDatasById: { [id: string]: BundleListingData } = {};
    if (hidePremiumProducts) return bundleListingDatasById;
    bundleListingDatas.forEach((bundleListingData) => {
      const id = bundleListingData.id;
      if (bundleListingDatasById[id]) {
        console.warn(`Multiple bundles with the same id: ${id}`);
      }
      bundleListingDatasById[id] = bundleListingData;
    });
    return bundleListingDatasById;
  }, [bundleListingDatas, hidePremiumProducts]);

  const currentPage = shopNavigationState.getCurrentPage();

  const bundleListingDatasSearchResultsForShop:
    | Array<BundleListingData>
    | null
    | undefined = useSearchItem(
    bundleListingDatasById,
    getBundleListingDataSearchTerms,
    shopSearchText,
    currentPage.filtersState.chosenCategory,
    currentPage.filtersState.chosenFilters
  );

  const BundleStoreState = React.useMemo(
    () => ({
      bundleListingDatas: hidePremiumProducts ? [] : bundleListingDatas,
      error,
      bundleFilters,
      fetchBundles,
      shop: {
        bundleListingDatasSearchResults: hidePremiumProducts
          ? []
          : bundleListingDatasSearchResultsForShop,
        searchText: shopSearchText,
        setSearchText: setShopSearchText,
        filtersState: currentPage.filtersState,
        setInitialBundleUserFriendlySlug,
        setInitialBundleCategory,
      },
    }),
    [
      hidePremiumProducts,
      bundleListingDatas,
      error,
      bundleFilters,
      fetchBundles,
      bundleListingDatasSearchResultsForShop,
      shopSearchText,
      setShopSearchText,
      currentPage.filtersState,
    ]
  );

  return (
    <BundleStoreContext.Provider value={BundleStoreState}>
      {children}
    </BundleStoreContext.Provider>
  );
};
