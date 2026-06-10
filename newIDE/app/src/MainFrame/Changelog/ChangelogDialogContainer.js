// @flow
import * as React from 'react';
import ChangelogDialog from './ChangelogDialog';
import PreferencesContext from '../Preferences/PreferencesContext';
import { getIDEVersion } from '../../Version';

type InnerContainerProps = {|
  defaultOpen: boolean,
  verifyIfIsNewVersion: () => boolean,
|};

const ChangelogDialogInnerContainer = ({
  defaultOpen,
  verifyIfIsNewVersion,
}: InnerContainerProps) => {
  const [open, setOpen] = React.useState(defaultOpen);

  React.useEffect(
    () => {
      verifyIfIsNewVersion();
    },
    [verifyIfIsNewVersion]
  );

  React.useEffect(
    () => {
      if (defaultOpen) {
        setOpen(true);
      }
    },
    [defaultOpen]
  );

  return <ChangelogDialog open={open} onClose={() => setOpen(false)} />;
};

/**
 * The container showing the ChangelogDialog only if a a new version
 * of GDevelop is detected.
 */
const ChangelogDialogContainer = (props: {||}): React.Node => (
  <PreferencesContext.Consumer>
    {({ values, verifyIfIsNewVersion }) => {
      const isNewVersion =
        values.lastLaunchedVersion !== undefined &&
        values.lastLaunchedVersion !== getIDEVersion();

      return (
        <ChangelogDialogInnerContainer
          defaultOpen={isNewVersion && values.autoDisplayChangelog}
          verifyIfIsNewVersion={verifyIfIsNewVersion}
        />
      );
    }}
  </PreferencesContext.Consumer>
);

export default ChangelogDialogContainer;
