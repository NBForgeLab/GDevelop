// @flow
import { type Tutorial } from '../Utils/GDevelopServices/Tutorial';
import { type Preferences } from '../MainFrame/Preferences/PreferencesContext';

/**
 * Returns a tutorial if it can be found, otherwise returns null.
 */
const getTutorial = (
  preferences: Preferences,
  tutorials: ?Array<Tutorial>,
  tutorialId: string
): null | Tutorial => {
  if (!tutorials) return null; // Loading or errored, do not display the tutorial.

  const { values } = preferences;
  if (values.hiddenTutorialHints[tutorialId]) return null;
  const tutorial: ?Tutorial = tutorials.find(
    tutorial => tutorial.id === tutorialId
  );
  if (!tutorial) {
    return null;
  }

  return tutorial;
};

export default getTutorial;
