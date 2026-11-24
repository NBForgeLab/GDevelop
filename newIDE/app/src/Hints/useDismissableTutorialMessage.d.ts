import * as React from 'react';

declare const useDismissableTutorialMessage: (tutorialId: string) => {
  DismissableTutorialMessage: React.ReactElement | null;
};

export default useDismissableTutorialMessage;
