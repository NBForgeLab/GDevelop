import * as React from 'react';

import paperDecorator from '../PaperDecorator';

import ProfileDetails from '../../Profile/ProfileDetails';
import {
  indieUserProfile,
  defaultAuthenticatedUserWithNoSubscription,
  fakeSilverAuthenticatedUser,
  fakeStartupAuthenticatedUser,
} from '../../fixtures/GDevelopServicesTestData';

export default {
  title: 'Profile/ProfileDetails',
  component: ProfileDetails,
  decorators: [paperDecorator],
};

export const MyCompleteProfileWithoutSubscription = (): React.ReactNode => (
  <ProfileDetails
    authenticatedUser={defaultAuthenticatedUserWithNoSubscription}
  />
);

export const MyCompleteProfileWithSilverSubscription = (): React.ReactNode => (
  <ProfileDetails authenticatedUser={fakeSilverAuthenticatedUser} />
);

export const MyCompleteProfileWithProSubscription = (): React.ReactNode => (
  <ProfileDetails authenticatedUser={fakeStartupAuthenticatedUser} />
);

export const MyProfileWithoutDiscordUsernameNorSubscription =
  (): React.ReactNode => (
    <ProfileDetails
      authenticatedUser={{
        ...defaultAuthenticatedUserWithNoSubscription,
        profile: { ...indieUserProfile, discordUsername: '' },
      }}
    />
  );

export const MyProfileWithoutDiscordUsernameWithStartupSubscription =
  (): React.ReactNode => (
    <ProfileDetails
      authenticatedUser={{
        ...fakeStartupAuthenticatedUser,
        profile: { ...indieUserProfile, discordUsername: '' },
      }}
    />
  );

export const Loading = (): React.ReactNode => (
  <ProfileDetails
    authenticatedUser={{
      ...defaultAuthenticatedUserWithNoSubscription,
      profile: null,
    }}
  />
);
