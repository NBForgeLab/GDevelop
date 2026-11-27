import * as React from 'react';
import { action } from '@storybook/addon-actions';

import paperDecorator from '../../PaperDecorator';
import LeaderboardAppearanceDialog from '../../../GameDashboard/LeaderboardAdmin/LeaderboardAppearanceDialog';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import {
  fakeSilverAuthenticatedUser,
  fakeAuthenticatedUserWithNoSubscription,
  fakeStartupAuthenticatedUser,
} from '../../../fixtures/GDevelopServicesTestData';

export default {
  title: 'Leaderboard/LeaderboardAppearanceDialog',
  component: LeaderboardAppearanceDialog,
  decorators: [paperDecorator],
};

export const WithoutSubscription = (): React.ReactNode => (
  <AuthenticatedUserContext.Provider
    value={fakeAuthenticatedUserWithNoSubscription}
  >
    <LeaderboardAppearanceDialog
      open
      onClose={() => action('onClose')()}
      onSave={async () => {
        action('onSave')();
      }}
      leaderboardCustomizationSettings={{
        scoreTitle: 'Coins collected',
        scoreFormatting: {
          type: 'custom',
          prefix: '',
          suffix: ' coins',
          precision: 0,
        },
      }}
    />
  </AuthenticatedUserContext.Provider>
);

export const WithSilverSubscription = (): React.ReactNode => (
  <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
    <LeaderboardAppearanceDialog
      open
      onClose={() => action('onClose')()}
      onSave={async () => {
        action('onSave')();
      }}
      leaderboardCustomizationSettings={{
        scoreTitle: 'Coins collected',
        scoreFormatting: {
          type: 'custom',
          prefix: '',
          suffix: ' coins',
          precision: 0,
        },
      }}
    />
  </AuthenticatedUserContext.Provider>
);

export const WithStartupSubscription = (): React.ReactNode => (
  <AuthenticatedUserContext.Provider value={fakeStartupAuthenticatedUser}>
    <LeaderboardAppearanceDialog
      open
      onClose={() => action('onClose')()}
      onSave={async () => {
        action('onSave')();
      }}
      leaderboardCustomizationSettings={{
        scoreTitle: 'Coins collected',
        scoreFormatting: {
          type: 'custom',
          prefix: '',
          suffix: ' coins',
          precision: 0,
        },
      }}
    />
  </AuthenticatedUserContext.Provider>
);
