// @flow
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  GDevelopAiCdn,
  GDevelopAssetApi,
  GDevelopReleaseApi,
  GDevelopUserApi,
} from './ApiConfigs';
import { listAllAnnouncements, listAllPromotions } from './Announcement';
import {
  cdnClient as assetCdnClient,
  client as assetClient,
  listAllAuthors,
  listAllLicenses,
  listAllPublicAssets,
  listAllResources,
  listCourses,
} from './Asset';
import { getAchievements } from './Badge';
import { listAllExamples } from './Example';
import {
  cdnClient as extensionCdnClient,
  getBehaviorsRegistry,
  getExtensionsRegistry,
  getObjectsRegistry,
} from './Extension';
import {
  client as gameClient,
  getGameCategories,
  getGameCommentQualityRatingsLeaderboards,
  listAllShowcasedGames,
  listMarketingPlans,
} from './Game';
import { fetchAiSettings } from './Generation';
import { fetchInAppTutorialShortHeaders } from './InAppTutorial';
import { getReleases } from './Release';
import {
  client as shopClient,
  listGivenAwayProducts,
  listListedBundles,
  listListedCourseChapters,
  listListedCourses,
  listListedCreditsPackages,
  listListedPrivateAssetPacks,
  listListedPrivateGameTemplates,
  listProductLicenses,
} from './Shop';
import { client as tutorialClient, listAllTutorials } from './Tutorial';
import {
  apiClient as usageClient,
  listSubscriptionPlanPricingSystems,
  listSubscriptionPlans,
} from './Usage';
import {
  client as userClient,
  getUserCommentQualityRatingsLeaderboards,
  listDefaultRecommendations,
} from './User';

const setupGdideEnvironment = (
  protocol: 'gdide:' | 'http:',
  readPublicCatalogImpl?: string => Promise<any>
) => {
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    global,
    'window'
  );
  if (typeof global.window === 'undefined') {
    (global: any).window = {};
  }
  const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
    global.window,
    'location'
  );
  Object.defineProperty(global.window, 'location', {
    configurable: true,
    value: { protocol },
  });
  if (readPublicCatalogImpl) {
    (global.window: any).gdevelopDesktop = {
      readPublicCatalog: readPublicCatalogImpl,
    };
  } else {
    delete (global.window: any).gdevelopDesktop;
  }

  return () => {
    if (originalLocationDescriptor) {
      Object.defineProperty(
        global.window,
        'location',
        originalLocationDescriptor
      );
    } else if (global.window) {
      delete global.window.location;
    }
    if (global.window) {
      delete global.window.gdevelopDesktop;
    }
    if (!originalWindowDescriptor) {
      delete (global: any).window;
    }
  };
};

describe('GDevelopServices public catalog callers', () => {
  it('routes all public catalog getters through preload on gdide: protocol', async () => {
    const axiosMock = new MockAdapter(axios);
    const assetCdnMock = new MockAdapter(assetCdnClient);
    const assetMock = new MockAdapter(assetClient);
    const extensionCdnMock = new MockAdapter(extensionCdnClient);
    const gameMock = new MockAdapter(gameClient);
    const shopMock = new MockAdapter(shopClient);
    const tutorialMock = new MockAdapter(tutorialClient);
    const usageMock = new MockAdapter(usageClient);
    const userMock = new MockAdapter(userClient);

    const catalogPayloads: { [string]: any } = {
      bundles: [{ id: 'bundle-1' }],
      templates: [{ id: 'template-1' }],
      credits: [{ id: 'credits-1' }],
      assetPacks: [{ id: 'pack-1' }],
      givenAwayProducts: [{ id: 'gift-1' }],
      releases: [{ name: '5.4.0' }],
      showcasedGames: {
        gamesShowcaseUrl: 'https://cdn.example/games.json',
        filtersUrl: 'https://cdn.example/game-filters.json',
      },
      gameCategories: [{ id: 'cat-1' }],
      marketingPlans: [{ id: 'plan-1' }],
      recommendations: [{ id: 'rec-1' }],
      achievements: [{ id: 'ach-1' }],
      announcements: [{ id: 'ann-1' }],
      promotions: [{ id: 'promo-1' }],
      extension: { databaseUrl: 'https://cdn.example/ext.json' },
      behavior: { databaseUrl: 'https://cdn.example/beh.json' },
      object: { databaseUrl: 'https://cdn.example/obj.json' },
      assets: {
        assetShortHeadersUrl: 'https://cdn.example/asset-headers.json',
        effectShortHeadersUrl: '',
        filtersUrl: 'https://cdn.example/asset-filters.json',
        assetPacksUrl: 'https://cdn.example/asset-packs.json',
        assetCdn: {},
      },
      stagingAssets: {
        assetShortHeadersUrl: 'https://cdn.example/staging-asset-headers.json',
        effectShortHeadersUrl: '',
        filtersUrl: 'https://cdn.example/staging-asset-filters.json',
        assetPacksUrl: 'https://cdn.example/staging-asset-packs.json',
        assetCdn: {},
      },
      resources: {
        resourcesUrl: 'https://cdn.example/resources.json',
        resourcesV2Url: 'https://cdn.example/resources-v2.json',
        filtersUrl: 'https://cdn.example/resource-filters.json',
      },
      stagingResources: {
        resourcesUrl: 'https://cdn.example/staging-resources.json',
        resourcesV2Url: 'https://cdn.example/staging-resources-v2.json',
        filtersUrl: 'https://cdn.example/staging-resource-filters.json',
      },
      authors: { authorsUrl: 'https://cdn.example/authors.json' },
      stagingAuthors: {
        authorsUrl: 'https://cdn.example/staging-authors.json',
      },
      licenses: { licensesUrl: 'https://cdn.example/licenses.json' },
      stagingLicenses: {
        licensesUrl: 'https://cdn.example/staging-licenses.json',
      },
      assetLicenses: [{ id: 'lic-pack' }],
      templateLicenses: [{ id: 'lic-tpl' }],
      subscriptionPlans: [{ id: 'sub-live' }],
      subscriptionPlansWithLegacy: [{ id: 'sub-legacy' }],
      pricingSystems: [{ id: 'price-live' }],
      pricingSystemsWithLegacy: [{ id: 'price-legacy' }],
      gameCommentQualityRatingsLeaderboards: [{ name: 'game-lb' }],
      userCommentQualityRatingsLeaderboards: [{ name: 'user-lb' }],
      aiSettings: { aiRequest: { defaultModel: 'test' } },
      stagingAiSettings: { aiRequest: { defaultModel: 'staging-test' } },
      courses: [{ id: 'course-1' }],
      listedCourses: [{ id: 'listed-course-1' }],
      listedChapters: [{ id: 'listed-chapter-1' }],
      tutorials: [{ id: 'tutorial-1' }],
      inAppTutorials: [{ id: 'in-app-1' }],
      examples: {
        exampleShortHeadersUrl: 'https://cdn.example/examples.json',
        filtersUrl: 'https://cdn.example/example-filters.json',
      },
    };

    const readPublicCatalogMock = jest.fn(async (name: string) => {
      if (!(name in catalogPayloads)) {
        throw new Error(`Unexpected catalog key: ${name}`);
      }
      return catalogPayloads[name];
    });

    const cleanup = setupGdideEnvironment('gdide:', readPublicCatalogMock);
    try {
      // Secondary CDN fetches that happen after resolving catalog metadata:
      axiosMock
        .onGet('https://cdn.example/examples.json')
        .reply(200, [{ id: 'ex-1' }])
        .onGet('https://cdn.example/example-filters.json')
        .reply(200, { allTags: [] })
        .onGet('https://cdn.example/games.json')
        .reply(200, [])
        .onGet('https://cdn.example/game-filters.json')
        .reply(200, { allTags: [] });
      assetCdnMock
        .onGet('https://cdn.example/asset-headers.json')
        .reply(200, [])
        .onGet('https://cdn.example/asset-filters.json')
        .reply(200, { allTags: [] })
        .onGet('https://cdn.example/asset-packs.json')
        .reply(200, { starterPacks: [] })
        .onGet('https://cdn.example/staging-asset-headers.json')
        .reply(200, [])
        .onGet('https://cdn.example/staging-asset-filters.json')
        .reply(200, { allTags: [] })
        .onGet('https://cdn.example/staging-asset-packs.json')
        .reply(200, { starterPacks: [] });
      assetMock
        .onGet('https://cdn.example/resources.json')
        .reply(200, [])
        .onGet('https://cdn.example/resources-v2.json')
        .reply(200, [])
        .onGet('https://cdn.example/resource-filters.json')
        .reply(200, { allTags: [] })
        .onGet('https://cdn.example/staging-resources.json')
        .reply(200, [])
        .onGet('https://cdn.example/staging-resources-v2.json')
        .reply(200, [])
        .onGet('https://cdn.example/staging-resource-filters.json')
        .reply(200, { allTags: [] })
        .onGet('https://cdn.example/authors.json')
        .reply(200, [{ name: 'Author', website: '' }])
        .onGet('https://cdn.example/staging-authors.json')
        .reply(200, [{ name: 'Staging Author', website: '' }])
        .onGet('https://cdn.example/licenses.json')
        .reply(200, [{ name: 'MIT', website: '' }])
        .onGet('https://cdn.example/staging-licenses.json')
        .reply(200, [{ name: 'CC0', website: '' }]);
      extensionCdnMock
        .onGet('https://cdn.example/ext.json')
        .reply(200, {
          extensionShortHeaders: [],
          views: { default: { firstIds: [] } },
        })
        .onGet('https://cdn.example/beh.json')
        .reply(200, { headers: [] })
        .onGet('https://cdn.example/obj.json')
        .reply(200, { headers: [] });

      expect(await listListedPrivateAssetPacks()).toEqual([{ id: 'pack-1' }]);
      expect(await listListedPrivateGameTemplates()).toEqual([
        { id: 'template-1' },
      ]);
      expect(await listListedCreditsPackages()).toEqual([{ id: 'credits-1' }]);
      expect(await listListedCourseChapters()).toEqual([
        { id: 'listed-chapter-1' },
      ]);
      expect(await listListedCourses()).toEqual([{ id: 'listed-course-1' }]);
      expect(await listListedBundles()).toEqual([{ id: 'bundle-1' }]);
      expect(await listProductLicenses({ productType: 'asset-pack' })).toEqual([
        { id: 'lic-pack' },
      ]);
      expect(
        await listProductLicenses({ productType: 'game-template' })
      ).toEqual([{ id: 'lic-tpl' }]);
      expect(await listGivenAwayProducts()).toEqual([{ id: 'gift-1' }]);

      expect(await getReleases()).toEqual([{ name: '5.4.0' }]);
      expect(await listAllShowcasedGames()).toEqual({
        showcasedGames: [],
        filters: { allTags: [] },
      });
      expect(await getGameCategories()).toEqual([{ id: 'cat-1' }]);
      expect(await listMarketingPlans()).toEqual([{ id: 'plan-1' }]);
      expect(await getGameCommentQualityRatingsLeaderboards()).toEqual([
        { name: 'game-lb' },
      ]);

      expect(await listDefaultRecommendations()).toEqual([{ id: 'rec-1' }]);
      expect(await getUserCommentQualityRatingsLeaderboards()).toEqual([
        { name: 'user-lb' },
      ]);
      expect(await getAchievements()).toEqual([{ id: 'ach-1' }]);
      expect(await listAllAnnouncements()).toEqual([{ id: 'ann-1' }]);
      expect(await listAllPromotions()).toEqual([{ id: 'promo-1' }]);

      await listAllPublicAssets({ environment: 'live' });
      await listAllPublicAssets({ environment: 'staging' });
      await listAllResources({ environment: 'live' });
      await listAllResources({ environment: 'staging' });
      expect(await listAllAuthors({ environment: 'live' })).toEqual([
        { name: 'Author', website: '' },
      ]);
      expect(await listAllAuthors({ environment: 'staging' })).toEqual([
        { name: 'Staging Author', website: '' },
      ]);
      expect(await listAllLicenses({ environment: 'live' })).toEqual([
        { name: 'MIT', website: '' },
      ]);
      expect(await listAllLicenses({ environment: 'staging' })).toEqual([
        { name: 'CC0', website: '' },
      ]);
      expect(
        await listCourses(async () => 'Bearer t', { userId: null })
      ).toEqual([{ id: 'course-1' }]);

      await getExtensionsRegistry();
      await getBehaviorsRegistry();
      await getObjectsRegistry();
      await listAllExamples();
      expect(await listAllTutorials()).toEqual([{ id: 'tutorial-1' }]);
      expect(await fetchInAppTutorialShortHeaders()).toEqual([
        { id: 'in-app-1' },
      ]);
      expect(await fetchAiSettings({ environment: 'live' })).toEqual({
        aiRequest: { defaultModel: 'test' },
      });
      expect(await fetchAiSettings({ environment: 'staging' })).toEqual({
        aiRequest: { defaultModel: 'staging-test' },
      });

      expect(await listSubscriptionPlans({ includeLegacy: false })).toEqual([
        { id: 'sub-live' },
      ]);
      expect(await listSubscriptionPlans({ includeLegacy: true })).toEqual([
        { id: 'sub-legacy' },
      ]);
      expect(
        await listSubscriptionPlanPricingSystems({ includeLegacy: false })
      ).toEqual([{ id: 'price-live' }]);
      expect(
        await listSubscriptionPlanPricingSystems({ includeLegacy: true })
      ).toEqual([{ id: 'price-legacy' }]);

      const calledKeys = readPublicCatalogMock.mock.calls.map(call => call[0]);
      expect(new Set(calledKeys)).toEqual(
        new Set(Object.keys(catalogPayloads))
      );
      expect(readPublicCatalogMock).toHaveBeenCalledTimes(
        Object.keys(catalogPayloads).length
      );

      // Authenticated or filtered callers must bypass readPublicCatalog and hit HTTP directly:
      assetMock
        .onGet('/course', { params: { userId: 'u-1' } })
        .reply(200, [{ id: 'user-course' }]);
      usageMock
        .onGet('/subscription-plan', {
          params: { includeLegacy: 'false', userId: 'u-1' },
        })
        .reply(200, [{ id: 'user-sub' }])
        .onGet('/subscription-plan-pricing-system', {
          params: { includeLegacy: 'false', subscriptionPlanIds: 'p1' },
        })
        .reply(200, [{ id: 'filtered-price' }]);

      expect(
        await listCourses(async () => 'Bearer token', { userId: 'u-1' })
      ).toEqual([{ id: 'user-course' }]);
      expect(
        await listSubscriptionPlans({
          includeLegacy: false,
          userId: 'u-1',
          getAuthorizationHeader: async () => 'Bearer token',
        })
      ).toEqual([{ id: 'user-sub' }]);
      expect(
        await listSubscriptionPlanPricingSystems({
          includeLegacy: false,
          subscriptionPlanIds: ['p1'],
        })
      ).toEqual([{ id: 'filtered-price' }]);
      expect(readPublicCatalogMock).toHaveBeenCalledTimes(
        Object.keys(catalogPayloads).length
      );
    } finally {
      axiosMock.restore();
      assetCdnMock.restore();
      assetMock.restore();
      extensionCdnMock.restore();
      gameMock.restore();
      shopMock.restore();
      tutorialMock.restore();
      usageMock.restore();
      userMock.restore();
      cleanup();
    }
  });

  it('uses HTTP axios endpoints when not running on gdide: protocol', async () => {
    const axiosMock = new MockAdapter(axios);
    const shopMock = new MockAdapter(shopClient);
    const gameMock = new MockAdapter(gameClient);
    const usageMock = new MockAdapter(usageClient);
    const readPublicCatalogMock = jest.fn<any, any>();
    const cleanup = setupGdideEnvironment('http:', readPublicCatalogMock);

    try {
      shopMock
        .onGet('/asset-pack')
        .reply(200, [{ id: 'http-pack' }])
        .onGet('/given-away-product')
        .reply(200, [{ id: 'http-gift' }]);
      axiosMock
        .onGet(`${GDevelopReleaseApi.baseUrl}/release`, {
          params: { last: 4 },
        })
        .reply(200, [{ name: 'http-release' }])
        .onGet(`${GDevelopReleaseApi.baseUrl}/announcement`)
        .reply(200, [{ id: 'http-ann' }])
        .onGet(`${GDevelopUserApi.baseUrl}/achievement`)
        .reply(200, [{ id: 'http-ach' }])
        .onGet(`${GDevelopAiCdn.baseUrl.live}/ai-settings-v2.json`)
        .reply(200, { aiRequest: { defaultModel: 'http' } })
        .onGet(`${GDevelopAssetApi.baseUrl}/in-app-tutorial-short-header`)
        .reply(200, [{ id: 'http-in-app' }]);
      gameMock.onGet('/game-category').reply(200, [{ id: 'http-cat' }]);
      usageMock
        .onGet('/subscription-plan', { params: { includeLegacy: 'true' } })
        .reply(200, [{ id: 'http-plan' }]);

      expect(await listListedPrivateAssetPacks()).toEqual([
        { id: 'http-pack' },
      ]);
      expect(await listGivenAwayProducts()).toEqual([{ id: 'http-gift' }]);
      expect(await getReleases()).toEqual([{ name: 'http-release' }]);
      expect(await listAllAnnouncements()).toEqual([{ id: 'http-ann' }]);
      expect(await getAchievements()).toEqual([{ id: 'http-ach' }]);
      expect(await fetchAiSettings({ environment: 'live' })).toEqual({
        aiRequest: { defaultModel: 'http' },
      });
      expect(await fetchInAppTutorialShortHeaders()).toEqual([
        { id: 'http-in-app' },
      ]);
      expect(await getGameCategories()).toEqual([{ id: 'http-cat' }]);
      expect(await listSubscriptionPlans({ includeLegacy: true })).toEqual([
        { id: 'http-plan' },
      ]);
      expect(readPublicCatalogMock).not.toHaveBeenCalled();
    } finally {
      axiosMock.restore();
      shopMock.restore();
      gameMock.restore();
      usageMock.restore();
      cleanup();
    }
  });
});
