import * as React from 'react';
import { action } from '@storybook/addon-actions';
import { BuildCard } from '../../../ExportAndShare/Builds/BuildCard';

import paperDecorator from '../../PaperDecorator';

import {
  erroredCordovaBuild,
  pendingCordovaBuild,
  pendingElectronBuild,
  completeCordovaBuild,
  completeElectronBuild,
  completeWebBuild,
  game1,
  fakeSilverAuthenticatedUser,
} from '../../../fixtures/GDevelopServicesTestData';

export default {
  title: 'Builds/BuildCard',
  component: BuildCard,
  decorators: [paperDecorator],
};

export const WebBuildCard = (): React.ReactNode => (
  <BuildCard
    build={completeWebBuild}
    game={{ ...game1, acceptsBuildComments: true }}
    gameUpdating={false}
    setGameUpdating={action('setGameUpdating')}
    onBuildUpdated={action('onBuildUpdated')}
    onBuildDeleted={action('onBuildDeleted')}
    authenticatedUser={fakeSilverAuthenticatedUser}
  />
);

export const WebCurrentlyOnlineBuildCard = (): React.ReactNode => (
  <BuildCard
    build={completeWebBuild}
    game={{
      ...game1,
      publicWebBuildId: completeWebBuild.id,
    }}
    gameUpdating={false}
    setGameUpdating={action('setGameUpdating')}
    onBuildUpdated={action('onBuildUpdated')}
    onBuildDeleted={action('onBuildDeleted')}
    authenticatedUser={fakeSilverAuthenticatedUser}
  />
);

export const ElectronBuildCard = (): React.ReactNode => (
  <BuildCard
    build={completeElectronBuild}
    game={game1}
    gameUpdating={false}
    setGameUpdating={action('setGameUpdating')}
    onBuildUpdated={action('onBuildUpdated')}
    onBuildDeleted={action('onBuildDeleted')}
    authenticatedUser={fakeSilverAuthenticatedUser}
  />
);
export const PendingElectronBuildCard = (): React.ReactNode => (
  <BuildCard
    build={pendingElectronBuild}
    game={game1}
    gameUpdating={false}
    setGameUpdating={action('setGameUpdating')}
    onBuildUpdated={action('onBuildUpdated')}
    onBuildDeleted={action('onBuildDeleted')}
    authenticatedUser={fakeSilverAuthenticatedUser}
  />
);
export const CordovaBuildCard = (): React.ReactNode => (
  <BuildCard
    build={completeCordovaBuild}
    game={game1}
    gameUpdating={false}
    setGameUpdating={action('setGameUpdating')}
    onBuildUpdated={action('onBuildUpdated')}
    onBuildDeleted={action('onBuildDeleted')}
    authenticatedUser={fakeSilverAuthenticatedUser}
  />
);
export const pendingCordovaBuildCard = (): React.ReactNode => (
  <BuildCard
    build={pendingCordovaBuild}
    game={game1}
    gameUpdating={false}
    setGameUpdating={action('setGameUpdating')}
    onBuildUpdated={action('onBuildUpdated')}
    onBuildDeleted={action('onBuildDeleted')}
    authenticatedUser={fakeSilverAuthenticatedUser}
  />
);
export const ErroredCordovaBuildCard = (): React.ReactNode => (
  <BuildCard
    build={erroredCordovaBuild}
    game={game1}
    gameUpdating={false}
    setGameUpdating={action('setGameUpdating')}
    onBuildUpdated={action('onBuildUpdated')}
    onBuildDeleted={action('onBuildDeleted')}
    authenticatedUser={fakeSilverAuthenticatedUser}
  />
);
