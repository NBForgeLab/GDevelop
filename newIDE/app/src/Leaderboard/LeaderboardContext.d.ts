import * as React from 'react';
import {
  type Leaderboard,
  type LeaderboardSortOption,
  type LeaderboardEntry,
  type LeaderboardUpdatePayload,
} from '../Utils/GDevelopServices/Play';

export type LeaderboardState = {
  leaderboards: Array<Leaderboard> | null | undefined;
  currentLeaderboard: Leaderboard | null | undefined;
  displayOnlyBestEntry: boolean;
  browsing: {
    entries: Array<LeaderboardEntry> | null | undefined;
    goToNextPage: (() => Promise<void>) | null | undefined;
    goToPreviousPage: (() => Promise<void>) | null | undefined;
    goToFirstPage: (() => Promise<void>) | null | undefined;
  };
  createLeaderboard: (options: {
    name: string;
    sort: LeaderboardSortOption;
  }) => Promise<Leaderboard | null | undefined>;
  listLeaderboards: (
    options?: {
      shouldClearBeforeFetching?: boolean;
    } | null
  ) => Promise<void>;
  selectLeaderboard: (id: string) => void;
  setDisplayOnlyBestEntry: (displayOnlyBestEntry: boolean) => void;
  updateLeaderboard: (payload: LeaderboardUpdatePayload) => Promise<void>;
  resetLeaderboard: () => Promise<void>;
  deleteLeaderboard: () => Promise<void>;
  deleteLeaderboardEntry: (entryId: string) => Promise<void>;
  fetchLeaderboardEntries: () => Promise<void>;
};

export declare const initialLeaderboardState: LeaderboardState;

declare const LeaderboardContext: React.Context<LeaderboardState>;

export default LeaderboardContext;
