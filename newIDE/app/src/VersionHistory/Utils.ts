import type { VersionRestoringStatus } from '.';
import type { GDevelopTheme } from '../UI/Theme';

export const getStatusColor = (
  gdevelopTheme: GDevelopTheme,
  status: VersionRestoringStatus
): string => {
  return status === 'unsavedChanges'
    ? gdevelopTheme.statusIndicator.error
    : status === 'saving'
      ? gdevelopTheme.statusIndicator.warning
      : status === 'latest'
        ? gdevelopTheme.palette.secondary
        : status === 'opened'
          ? gdevelopTheme.statusIndicator.warning
          : gdevelopTheme.statusIndicator.success;
};
