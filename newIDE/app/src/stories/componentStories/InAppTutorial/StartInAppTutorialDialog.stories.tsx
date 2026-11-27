import * as React from 'react';
import { action } from '@storybook/addon-actions';
import paperDecorator from '../../PaperDecorator';
import StartInAppTutorialDialog from '../../../MainFrame/EditorContainers/HomePage/InAppTutorials/StartInAppTutorialDialog';
import inAppTutorialDecorator from '../../InAppTutorialDecorator';

export default {
  title: 'In-app tutorial/StartInAppTutorialDialog',
  component: StartInAppTutorialDialog,
  decorators: [inAppTutorialDecorator, paperDecorator],
};

export const MultichapterTutorial = (): React.ReactNode => {
  return (
    <StartInAppTutorialDialog
      open
      tutorialId="flingGame"
      tutorialCompletionStatus={'notStarted'}
      startTutorial={async (...args) => {
        action('Start tutorial')(...args);
      }}
      onClose={() => action('On close dialog')()}
      isProjectOpening={false}
    />
  );
};

export const Default = (): React.ReactNode => {
  return (
    <StartInAppTutorialDialog
      open
      tutorialId="joystick"
      tutorialCompletionStatus={'notStarted'}
      startTutorial={async (...args) => {
        action('Start tutorial')(...args);
      }}
      onClose={() => action('On close dialog')()}
      isProjectOpening={false}
    />
  );
};

export const Opening = (): React.ReactNode => {
  return (
    <StartInAppTutorialDialog
      open
      tutorialId="flingGame"
      tutorialCompletionStatus={'notStarted'}
      startTutorial={async (...args) => {
        action('Start tutorial')(...args);
      }}
      onClose={() => action('On close dialog')()}
      isProjectOpening
    />
  );
};

export const WithTutorialAlreadyStarted = (): React.ReactNode => {
  return (
    <StartInAppTutorialDialog
      open
      tutorialId="flingGame"
      tutorialCompletionStatus={'started'}
      startTutorial={async (...args) => {
        action('Start tutorial')(...args);
      }}
      onClose={() => action('On close dialog')()}
      isProjectOpening={false}
    />
  );
};
export const WithTutorialCompleted = (): React.ReactNode => {
  return (
    <StartInAppTutorialDialog
      open
      tutorialId="flingGame"
      tutorialCompletionStatus={'complete'}
      startTutorial={async (...args) => {
        action('Start tutorial')(...args);
      }}
      onClose={() => action('On close dialog')()}
      isProjectOpening={false}
    />
  );
};
