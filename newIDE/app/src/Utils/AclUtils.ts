import { t } from '@lingui/macro';
import { type MessageDescriptor } from './i18n/MessageDescriptor';

// Matches `Level` in `./GDevelopServices/Project` (not yet migrated to TypeScript).
type Level = 'owner' | 'writer' | 'reader';

export const getTranslatableLevel = (level: Level): MessageDescriptor => {
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
