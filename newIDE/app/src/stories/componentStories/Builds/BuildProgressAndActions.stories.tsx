import * as React from 'react';

import paperDecorator from '../../PaperDecorator';

import BuildProgressAndActions from '../../../ExportAndShare/Builds/BuildProgressAndActions';
import {
  erroredCordovaBuild,
  pendingCordovaBuild,
  pendingElectronBuild,
  completeCordovaBuild,
  completeElectronBuild,
  completeWebBuild,
  game1,
} from '../../../fixtures/GDevelopServicesTestData';

export default {
  title: 'Builds/BuildProgressAndActions',
  component: BuildProgressAndActions,
  decorators: [paperDecorator],
};

export const Errored = (): React.ReactNode => (
  <BuildProgressAndActions build={erroredCordovaBuild} game={game1} />
);

export const ErroredWithDetectedIssue = (): React.ReactNode => (
  <BuildProgressAndActions
    build={{
      ...erroredCordovaBuild,
      detectedErrors: [{ code: 'ios-app-icon-wrong-size' }],
    }}
    game={game1}
  />
);

export const ErroredWithUnknownDetectedIssue = (): React.ReactNode => (
  <BuildProgressAndActions
    build={{
      ...erroredCordovaBuild,
      detectedErrors: [{ code: 'some-future-error-code' }],
    }}
    game={game1}
  />
);

export const ErroredWithDetectedIssueAndHelpLink = (): React.ReactNode => (
  <BuildProgressAndActions
    build={{
      ...erroredCordovaBuild,
      detectedErrors: [
        {
          code: 'ios-app-icon-wrong-size',
          helpUrl: 'https://wiki.gdevelop.io/gdevelop5/publishing/',
        },
      ],
    }}
    game={game1}
  />
);

export const PendingElectronBuild = (): React.ReactNode => (
  <BuildProgressAndActions
    build={{ ...pendingElectronBuild, updatedAt: Date.now() }}
    game={game1}
  />
);

export const PendingCordovaBuild = (): React.ReactNode => (
  <BuildProgressAndActions
    build={{ ...pendingCordovaBuild, updatedAt: Date.now() }}
    game={game1}
  />
);

export const SlowPendingCordovaBuild = (): React.ReactNode => (
  <BuildProgressAndActions
    build={{ ...pendingCordovaBuild, updatedAt: Date.now() - 1000 * 400 }}
    game={game1}
  />
);

export const TimedOutPendingCordovaBuild = (): React.ReactNode => (
  <BuildProgressAndActions
    build={{ ...pendingCordovaBuild, updatedAt: Date.now() - 1000 * 3600 * 24 }}
    game={game1}
  />
);

export const CompleteCordovaBuild = (): React.ReactNode => (
  <BuildProgressAndActions build={completeCordovaBuild} game={game1} />
);

export const CompleteElectronBuild = (): React.ReactNode => (
  <BuildProgressAndActions build={completeElectronBuild} game={game1} />
);

export const CompleteUnpublishedWebBuild = (): React.ReactNode => (
  <BuildProgressAndActions
    build={completeWebBuild}
    game={{ ...game1, publicWebBuildId: 'other-build-id' }}
  />
);

export const CompletePublishedWebBuild = (): React.ReactNode => (
  <BuildProgressAndActions
    build={completeWebBuild}
    game={{ ...game1, publicWebBuildId: completeWebBuild.id }}
  />
);
