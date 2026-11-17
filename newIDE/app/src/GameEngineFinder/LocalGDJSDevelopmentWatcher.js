// @flow
import * as React from 'react';
import DesktopService from '../Utils/DesktopService';
import PreferencesContext from '../MainFrame/Preferences/PreferencesContext';

type Props = {
  onGDJSUpdated: () => Promise<void> | void,
};

/**
 * Set up some watchers for GDJS and Extensions sources.
 * Stop the watchers when the component is unmounted or `shouldWatch` prop is false.
 */
export const LocalGDJSDevelopmentWatcher = ({ onGDJSUpdated }: Props): null => {
  const preferences = React.useContext(PreferencesContext);
  const shouldWatch = preferences.values.useGDJSDevelopmentWatcher;

  React.useEffect(
    () => {
      if (!shouldWatch) {
        // Nothing to set up in the effect if watch is deactivated.
        return;
      }

      if (!DesktopService.isDesktop()) {
        console.error(
          'Unable to find desktop bridge to set up GDJS development watchers'
        );
        return;
      }

      DesktopService.gdjsWatcher.setup();
      return () => {
        DesktopService.gdjsWatcher.close();
      };
    },
    [shouldWatch]
  );

  React.useEffect(
    () => {
      if (!shouldWatch) {
        // Nothing to set up in the effect if watch is deactivated.
        return;
      }

      if (!DesktopService.isDesktop()) {
        return;
      }

      const unsubscribe = DesktopService.onIpcEvent(
        'local-gdjs-development-watcher-runtime-updated',
        () => {
          onGDJSUpdated();
        }
      );

      return () => {
        unsubscribe();
      };
    },
    [shouldWatch, onGDJSUpdated]
  );

  return null;
};
