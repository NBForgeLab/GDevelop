// @flow
import { useEffect } from 'react';
import DesktopService from './DesktopService';

const richPresenceStartTimestamp = Date.now();

const updateDiscordRichPresence = (project: ?gdProject) => {
  if (!DesktopService.isDesktop()) return;

  const config = {
    details: project ? 'Working on:' : 'Not working on',
    state: project ? project.getName() : 'any game',
    startTimestamp: richPresenceStartTimestamp,
    largeImageKey: 'gdicon',
    largeImageText: 'GDevelop',
  };

  DesktopService.updateDiscordRichPresence(config);
};

export const useDiscordRichPresence = (project: ?gdProject) => {
  useEffect(
    () => {
      updateDiscordRichPresence(project);
    },
    [project]
  );
};
