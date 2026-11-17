// @flow
import * as React from 'react';

import { Trans, t } from '@lingui/macro';
import { type AuthenticatedUser } from '../../Profile/AuthenticatedUserContext';
import { type ResourcesActionsProps } from '../../ProjectsStorage';
import DesktopService from '../../Utils/DesktopService';
import { downloadUrlsToLocalFiles } from '../../Utils/LocalFileDownloader';
import Window from '../../Utils/Window';
import ResourcesLoader from '../../ResourcesLoader';

const path = DesktopService.getPath();

export const generateGetResourceActions = ({
  authenticatedUser,
}: {
  authenticatedUser: AuthenticatedUser,
}): (ResourcesActionsProps => Array<{
  click: () => Promise<void>,
  label: any,
}>) => ({
  project,
  resource,
  i18n,
  fileMetadata,
  informUser,
}: ResourcesActionsProps) => {
  const openLabel =
    DesktopService.isDesktop() && path
      ? t`Save in the "Downloads" folder`
      : t`Open resource in browser`;

  const openOrDownloadResource = async ({
    askUserForDownloadDestination,
  }: {
    askUserForDownloadDestination: boolean,
  }) => {
    let resourceUrl = ResourcesLoader.getResourceFullUrl(
      project,
      resource.getName(),
      {}
    );
    if (DesktopService.isDesktop() && path) {
      const defaultPath = path.join(
        DesktopService.getAppPathSync('downloads'),
        resource.getName()
      );
      let targetPath;
      if (askUserForDownloadDestination) {
        targetPath = DesktopService.showSaveDialogSync({
          defaultPath: defaultPath,
          properties: ['createDirectory', 'showOverwriteConfirmation'],
        });
        if (!targetPath) return;
      } else {
        targetPath = defaultPath;
      }
      await downloadUrlsToLocalFiles({
        urlContainers: [
          {
            url: resourceUrl,
            filePath: targetPath,
          },
        ],
        onProgress: () => {},
        throwIfAnyError: false,
      });
      informUser({
        actionLabel: <Trans>Open folder</Trans>,
        message: <Trans>The resource has been downloaded</Trans>,
        onActionClick: () => {
          if (targetPath) {
            DesktopService.showItemInFolder(
              path ? path.resolve(targetPath) : targetPath
            );
          }
        },
      });
    } else {
      Window.openExternalURL(resourceUrl);
    }
  };

  const actions = [
    {
      label: i18n._(openLabel),
      click: () =>
        openOrDownloadResource({ askUserForDownloadDestination: false }),
    },
  ];

  if (DesktopService.isDesktop() && path) {
    actions.push({
      label: i18n._(t`Save as...`),
      click: () =>
        openOrDownloadResource({ askUserForDownloadDestination: true }),
    });
  }
  return actions;
};
