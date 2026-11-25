import * as React from 'react';
import type { AuthenticatedUser } from '../Profile/AuthenticatedUserContext';

export type ErroredLeaderboard = {
  leaderboardId: string;
  error: Error;
};

export type UseLeaderboardReplacerOutput = {
  openLeaderboardReplacerDialogIfNeeded: (
    project: gdProject,
    sourceGameId: string
  ) => void;
  renderLeaderboardReplacerDialog: () => React.ReactNode;
};

export declare const ReplacePromptDialog: React.ComponentType<{
  leaderboardsToReplace: Array<string> | null | undefined;
  onClose: () => void;
  onTriggerReplace: () => void;
}>;

export declare const LeaderboardReplacerProgressDialog: React.ComponentType<{
  erroredLeaderboards: Array<ErroredLeaderboard>;
  onRetry: (() => void) | null | undefined;
  onAbandon: (() => void) | null | undefined;
  progress: number;
}>;

export declare const replaceLeaderboardsInProject: (options: {
  authenticatedUser: AuthenticatedUser;
  project: gdProject;
  sourceGameId: string;
  leaderboardsToReplace: Array<string>;
  setProgress: (percent: number | ((percent: number) => number)) => void;
}) => Promise<{ leaderboardsWithErrors: Array<ErroredLeaderboard> }>;

export declare const findLeaderboardsToReplaceInProject: (options: {
  project: gdProject;
}) => Array<string>;

export declare const useLeaderboardReplacer: () => UseLeaderboardReplacerOutput;
