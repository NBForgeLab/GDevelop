import { Trans } from '@lingui/macro';
import DesktopService from '../Utils/DesktopService';
import Dialog from './Dialog';
import Text from './Text';
import FlatButton from './FlatButton';

export const ExternalEditorOpenedDialog = ({
  onClose,
}: {|
  onClose?: () => Promise<void>,
|}) => {
  if (DesktopService.isDesktop()) return null;

  return (
    <Dialog
      title={<Trans>An external editor is opened.</Trans>}
      cannotBeDismissed
      fullscreen="never-even-on-mobile"
      open
      maxWidth="sm"
      id="external-editor-opened-dialog"
      actions={
        onClose
          ? [
              <FlatButton
                label={<Trans>Cancel</Trans>}
                onClick={onClose}
                key="close"
              />,
            ]
          : null
      }
    >
      <Text>
        <Trans>
          Save your changes or close the external editor to continue.
        </Trans>
      </Text>
    </Dialog>
  );
};
