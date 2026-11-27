import * as React from 'react';
import { action } from '@storybook/addon-actions';

import paperDecorator from '../../PaperDecorator';

import { AnnouncementsFeed } from '../../../AnnouncementsFeed';
import { AnnouncementsFeedContext } from '../../../AnnouncementsFeed/AnnouncementsFeedContext';
import {
  fakeAnnouncements,
  fakePromotions,
} from '../../../fixtures/GDevelopServicesTestData';

export default {
  title: 'AnnouncementsFeed',
  component: AnnouncementsFeed,
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
      <AnnouncementsFeed />
    </AnnouncementsFeedContext.Provider>
  );
};

export const WithClosableItems = (): React.ReactNode => {
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
      <AnnouncementsFeed canClose />
    </AnnouncementsFeedContext.Provider>
  );
};

export const ErrorLoadingAnnouncements = (): React.ReactNode => {
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
      <AnnouncementsFeed />
    </AnnouncementsFeedContext.Provider>
  );
};

export const LoadingAnnouncements = (): React.ReactNode => {
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
      <AnnouncementsFeed />
    </AnnouncementsFeedContext.Provider>
  );
};

export const DefaultWithMargins = (): React.ReactNode => {
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
      <AnnouncementsFeed addMargins />
    </AnnouncementsFeedContext.Provider>
  );
};

export const OnlyUrgent = (): React.ReactNode => {
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
      <AnnouncementsFeed level="urgent" />
    </AnnouncementsFeedContext.Provider>
  );
};
