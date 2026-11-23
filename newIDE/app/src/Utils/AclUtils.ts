import { t } from '@lingui/macro';

// Matches `Level` in `./GDevelopServices/Project` (not yet migrated to TypeScript).
type Level = 'owner' | 'writer' | 'reader';

export const getTranslatableLevel = (level: Level): string => {
  switch (level) {
    case 'owner':
      return t`Owner`;
    case 'writer':
      return t`Read & Write`;
    case 'reader':
      return t`Read only`;
    default:
      return level;
  }
};
