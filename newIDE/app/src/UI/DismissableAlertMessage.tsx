import * as React from 'react';
import { t } from '@lingui/macro';
import PreferencesContext, {
  type AlertMessageIdentifier,
} from '../MainFrame/Preferences/PreferencesContext';
import AlertMessage from './AlertMessage';
import useAlertDialog from './Alert/useAlertDialog';

export type DismissableAlertMessageIdentifier = AlertMessageIdentifier;

export interface DismissableAlertMessageProps {
  kind: 'info' | 'warning';
  children: React.ReactNode;
  identifier: AlertMessageIdentifier;
}

/**
 * Show an alert that can be permanently hidden. Hidden messages
 * will be stored in preferences.
 */
const DismissableAlertMessage: React.FC<DismissableAlertMessageProps> = ({
  identifier,
  kind,
  children,
}: DismissableAlertMessageProps) => {
  const { values, showAlertMessage } = React.useContext(PreferencesContext);
  const { showConfirmation } = useAlertDialog();

  if (values?.hiddenAlertMessages?.[identifier]) return null;

  return (
    <AlertMessage
      kind={kind}
      onHide={async () => {
        const answer = await showConfirmation({
          title: t`Hide this hint?`,
          message: t`Are you sure you want to hide this hint? You won't see it again, unless you re-activate it from the preferences.`,
        });

        if (!answer) return;

        showAlertMessage(identifier, false);
      }}
    >
      {children}
    </AlertMessage>
  );
};

export default DismissableAlertMessage;
