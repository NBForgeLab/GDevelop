import * as React from 'react';
import { action } from '@storybook/addon-actions';

import paperDecorator from '../../PaperDecorator';
import {
  LeaderboardReplacerProgressDialog,
  ReplacePromptDialog,
} from '../../../Leaderboard/UseLeaderboardReplacer';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import { fakeSilverAuthenticatedUser } from '../../../fixtures/GDevelopServicesTestData';

export default {
  title: 'Leaderboard/LeaderboardReplacerDialog',
  component: LeaderboardReplacerProgressDialog,
  decorators: [paperDecorator],
};

export const IsReplacingLeaderboards = (): React.ReactNode => (
  <LeaderboardReplacerProgressDialog
    progress={30}
    onAbandon={null}
    onRetry={null}
    erroredLeaderboards={[
      { leaderboardId: 'errored-leaderboard-id', error: new Error() },
    ]}
  />
);

export const WithErrors = (): React.ReactNode => (
  <LeaderboardReplacerProgressDialog
    progress={100}
    onAbandon={action('onAbandon')}
    onRetry={action('onRetry')}
    erroredLeaderboards={[
      { leaderboardId: 'errored-leaderboard-id', error: new Error() },
    ]}
  />
);

export const ReplacerPromptAuthenticatedUser = (): React.ReactNode => (
  <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
    <ReplacePromptDialog
      leaderboardsToReplace={['leaderboard-to-replace']}
      onClose={action('onClose')}
      onTriggerReplace={action('onTriggerReplace')}
    />
  </AuthenticatedUserContext.Provider>
);

export const ReplacerPromptNotAuthenticatedUser = (): React.ReactNode => (
  <AuthenticatedUserContext.Provider
    value={{ ...fakeSilverAuthenticatedUser, authenticated: false }}
  >
    <ReplacePromptDialog
      leaderboardsToReplace={['leaderboard-to-replace']}
      onClose={action('onClose')}
      onTriggerReplace={action('onTriggerReplace')}
    />
  </AuthenticatedUserContext.Provider>
);
