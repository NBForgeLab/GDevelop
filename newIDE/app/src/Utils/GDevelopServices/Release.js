// @flow
import { readPublicCatalog } from '../DesktopService';
import axios from 'axios';
import { GDevelopReleaseApi } from './ApiConfigs';
import { ensureIsArray } from '../DataValidator';

export type Release = {
  name: ?string,
  publishedAt: ?string,
  description: ?string,
};

export const getReleases = async (): Promise<Array<Release>> => {
  const data = await readPublicCatalog(
    'releases',
    async () =>
      (await axios.get<Array<Release>>(
        `${GDevelopReleaseApi.baseUrl}/release`,
        {
          params: {
            last: 4,
          },
        }
      )).data
  );
  return ensureIsArray({
    data,
    endpointName: '/release of Release API',
  });
};

export const hasBreakingChange = (release: Release): boolean => {
  return (
    (release.description || '').toLowerCase().indexOf('breaking change') !== -1
  );
};

export const findRelease = (
  releases: Array<Release>,
  name: string
): ?Release => {
  return releases.find(release => release.name === name);
};
