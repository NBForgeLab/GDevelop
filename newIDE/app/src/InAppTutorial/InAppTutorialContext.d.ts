import * as React from 'react';

export type InAppTutorialState = {
  currentlyRunningInAppTutorial: Record<string, any> | null;
  startTutorial: (args: {
    tutorialId: string;
    initialStepIndex: number;
    initialProjectData: Record<string, string>;
    inAppTutorial?: Record<string, any>;
  }) => Promise<void>;
  endTutorial: () => void;
  inAppTutorialShortHeaders: Array<Record<string, any>> | null | undefined;
  getInAppTutorialShortHeader: (
    tutorialId: string
  ) => Record<string, any> | null | undefined;
  startStepIndex: number;
  startProjectData: Record<string, string>;
  inAppTutorialsFetchingError: string | null;
  fetchInAppTutorials: () => Promise<void>;
  onLoadInAppTutorialFromLocalFile: () => Promise<void>;
  [key: string]: any;
};

declare const InAppTutorialContext: React.Context<InAppTutorialState>;
export default InAppTutorialContext;
