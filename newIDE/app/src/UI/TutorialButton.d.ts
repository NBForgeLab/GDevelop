import * as React from 'react';

export interface TutorialButtonProps {
  tutorialId: string;
  label?: React.ReactNode;
  renderIfNotFound?: React.ReactNode;
  [key: string]: any;
}

declare const TutorialButton: React.FC<TutorialButtonProps>;
export default TutorialButton;
