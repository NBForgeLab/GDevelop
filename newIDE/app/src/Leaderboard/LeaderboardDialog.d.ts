import * as React from 'react';

type Props = {
  onClose: () => void;
  open: boolean;
  project: gdProject;
  leaderboardId?: string;
};

declare const LeaderboardDialog: React.ComponentType<Props>;

export default LeaderboardDialog;
