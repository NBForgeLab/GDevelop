import * as React from 'react';

export type PublicProfileState = {
  openUserPublicProfile: (args: {
    userId: string;
    callbacks?: Record<string, any>;
  }) => void;
  configureNewProjectActions: (actions: Record<string, any>) => void;
};

declare const PublicProfileContext: React.Context<PublicProfileState>;
export default PublicProfileContext;
