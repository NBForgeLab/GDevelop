// @flow
import { Trans } from '@lingui/macro';
import { t } from '@lingui/macro';

import * as React from 'react';
import TextField from '../TextField';
import DesktopService from '../../Utils/DesktopService';
import {
  getLastUsedDialogDirectory,
  rememberLastUsedDialogDirectory,
} from '../../Utils/FileSystem';
import FlatButton from '../FlatButton';

const styles = {
  container: {
    position: 'relative',
    display: 'flex',
    alignItems: 'baseline',
  },
  button: {
    marginLeft: 10,
  },
  textField: {
    flex: 1,
  },
};

type Props = {|
  value: string,
  onChange: string => void,
  title: string,
  message: string,
  defaultPath?: string,
  fullWidth?: boolean,
  filters: Array<{
    name: string,
    extensions: Array<string>,
  }>,
|};

const LocalFilePicker = ({
  value,
  onChange,
  title,
  message,
  defaultPath,
  fullWidth,
  filters,
}: Props): React.MixedElement => {
  const onChooseFolder = async () => {
    if (!DesktopService.isDesktop()) return;

    const result = await DesktopService.showSaveDialog({
      title: title,
      filters: filters,
      message: message,
      defaultPath: defaultPath || getLastUsedDialogDirectory(),
    });
    const filePath = result ? result.filePath : '';
    if (filePath) rememberLastUsedDialogDirectory(filePath);
    onChange(filePath || '');
  };

  return (
    <div
      style={{
        ...styles.container,
        width: fullWidth ? '100%' : undefined,
      }}
    >
      {/* $FlowFixMe[incompatible-type] */}
      <TextField
        margin="dense"
        style={styles.textField}
        type="text"
        translatableHintText={t`Choose a file`}
        value={value}
        onChange={(event, value) => onChange(value)}
      />
      <FlatButton
        label={<Trans>Choose</Trans>}
        // $FlowFixMe[incompatible-type]
        style={styles.button}
        onClick={onChooseFolder}
      />
    </div>
  );
};

export default LocalFilePicker;
