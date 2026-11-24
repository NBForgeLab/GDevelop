import * as React from 'react';
import type { Tutorial } from '../Utils/GDevelopServices/Tutorial';

export type TutorialState = {
  tutorials: Array<Tutorial> | null | undefined;
  fetchTutorials: () => void;
  error: Error | null | undefined;
};

export declare const TutorialContext: React.Context<TutorialState>;
