import * as React from 'react';

type Props = {
  gameId: string;
  children: React.ReactNode;
};

declare const LeaderboardProvider: React.ComponentType<Props>;

export default LeaderboardProvider;
