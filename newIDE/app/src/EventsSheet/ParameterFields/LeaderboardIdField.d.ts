import * as React from 'react';
import { type Leaderboard } from '../../Utils/GDevelopServices/Play';

export declare const useFetchLeaderboards: () =>
  | Array<Leaderboard>
  | null
  | undefined;

declare const LeaderboardIdField: React.ComponentType<any>;

export default LeaderboardIdField;
