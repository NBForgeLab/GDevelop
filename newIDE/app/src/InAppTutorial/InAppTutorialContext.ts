import * as React from 'react';
import {
  type InAppTutorialShortHeader,
  type InAppTutorial,
} from '../Utils/GDevelopServices/InAppTutorial';

export type InAppTutorialState = {
  currentlyRunningInAppTutorial: InAppTutorial | null;
  startTutorial: (arg0: {
    tutorialId: string;
    initialStepIndex: number;
    initialProjectData: {
      [key: string]: string;
    };
    inAppTutorial?: InAppTutorial;
  }) => Promise<void>;
  endTutorial: () => void;
  inAppTutorialShortHeaders: Array<InAppTutorialShortHeader> | null | undefined;
  getInAppTutorialShortHeader: (
    tutorialId: string
  ) => InAppTutorialShortHeader | null | undefined;
  startStepIndex: number;
  startProjectData: {
    [key: string]: string;
  };
  inAppTutorialsFetchingError: string | null;
  fetchInAppTutorials: () => Promise<void>;
  onLoadInAppTutorialFromLocalFile: () => Promise<void>;
};

export const initialInAppTutorialState: InAppTutorialState = {
  currentlyRunningInAppTutorial: null,
  getInAppTutorialShortHeader: (tutorialId: string) => null,
  startTutorial: async () => {},
  endTutorial: () => {},
  inAppTutorialShortHeaders: null,
  startStepIndex: 0,
  startProjectData: {},
  inAppTutorialsFetchingError: null,
  fetchInAppTutorials: async () => {},
  onLoadInAppTutorialFromLocalFile: async () => {},
};

const InAppTutorialContext: React.Context<InAppTutorialState> =
  React.createContext<InAppTutorialState>(initialInAppTutorialState);

export default InAppTutorialContext;
