import * as React from 'react';
import { action } from '@storybook/addon-actions';

import paperDecorator from '../../PaperDecorator';

import PromotionsSlideshow from '../../../Promotions/PromotionsSlideshow';
import { AnnouncementsFeedContext } from '../../../AnnouncementsFeed/AnnouncementsFeedContext';
import {
  fakeAnnouncements,
  fakePromotions,
} from '../../../fixtures/GDevelopServicesTestData';

export default {
  title: 'PromotionsSlideshow',
  component: PromotionsSlideshow,
  decorators: [paperDecorator],
};

export const Default = (): React.ReactNode => {
  return (
    <AnnouncementsFeedContext.Provider
      value={{
        announcements: fakeAnnouncements,
        promotions: fakePromotions,
        error: null,
        fetchAnnouncementsAndPromotions: async () => {
          action('fetchAnnouncementsAndPromotions')();
        },
      }}
    >
      <PromotionsSlideshow />
    </AnnouncementsFeedContext.Provider>
  );
};

export const ErrorLoadingPromotions = (): React.ReactNode => {
  return (
    <AnnouncementsFeedContext.Provider
      value={{
        announcements: null,
        promotions: null,
        error: new Error('Fake error'),
        fetchAnnouncementsAndPromotions: async () => {
          action('fetchAnnouncementsAndPromotions')();
        },
      }}
    >
      <PromotionsSlideshow />
    </AnnouncementsFeedContext.Provider>
  );
};

export const LoadingPromotions = (): React.ReactNode => {
  return (
    <AnnouncementsFeedContext.Provider
      value={{
        announcements: null,
        promotions: null,
        error: null,
        fetchAnnouncementsAndPromotions: async () => {
          action('fetchAnnouncementsAndPromotions')();
        },
      }}
    >
      <PromotionsSlideshow />
    </AnnouncementsFeedContext.Provider>
  );
};

export const OnlyGame = (): React.ReactNode => {
  return (
    <AnnouncementsFeedContext.Provider
      value={{
        announcements: fakeAnnouncements,
        promotions: fakePromotions,
        error: null,
        fetchAnnouncementsAndPromotions: async () => {
          action('fetchAnnouncementsAndPromotions')();
        },
      }}
    >
      <PromotionsSlideshow type="game" />
    </AnnouncementsFeedContext.Provider>
  );
};

export const OnlyAssetPack = (): React.ReactNode => {
  return (
    <AnnouncementsFeedContext.Provider
      value={{
        announcements: fakeAnnouncements,
        promotions: fakePromotions,
        error: null,
        fetchAnnouncementsAndPromotions: async () => {
          action('fetchAnnouncementsAndPromotions')();
        },
      }}
    >
      <PromotionsSlideshow type="asset-pack" />
    </AnnouncementsFeedContext.Provider>
  );
};
