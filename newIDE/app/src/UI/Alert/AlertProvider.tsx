import * as React from 'react';
import AlertContext from './AlertContext';
import AlertDialog from './AlertDialog';
import ConfirmDialog from './ConfirmDialog';
import ConfirmDeleteDialog from './ConfirmDeleteDialog';
import {
  type ShowAlertDialogOptionsWithCallback,
  type ShowConfirmDeleteDialogOptionsWithCallback,
  type ShowConfirmDialogOptionsWithCallback,
  type ShowYesNoCancelDialogOptionsWithCallback,
} from './AlertContext';
import YesNoCancelDialog from './YesNoCancelDialog';
import Window from '../../Utils/Window';

type Props = {
  children: React.ReactNode;
};

function ConfirmProvider({ children }: Props): React.ReactNode {
  const isCli = Window.isRunningCommandFromCli();

  // Alert
  const [alertDialogOpen, setAlertDialogOpen] = React.useState<boolean>(false);
  const [alertDialogConfig, setAlertDialogConfig] = React.useState<
    ShowAlertDialogOptionsWithCallback | null | undefined
  >(null);
  const openAlertDialog = React.useCallback(
    (options: ShowAlertDialogOptionsWithCallback) => {
      if (isCli) {
        options.callback();
        return;
      }
      setAlertDialogOpen(true);
      setAlertDialogConfig(options);
    },
    [isCli]
  );

  // Confirm
  const [confirmDialogOpen, setConfirmDialogOpen] =
    React.useState<boolean>(false);
  const [confirmDialogConfig, setConfirmDialogConfig] = React.useState<
    ShowConfirmDialogOptionsWithCallback | null | undefined
  >(null);
  const openConfirmDialog = React.useCallback(
    (options: ShowConfirmDialogOptionsWithCallback) => {
      if (isCli) {
        options.callback(false);
        return;
      }
      setConfirmDialogOpen(true);
      setConfirmDialogConfig(options);
    },
    [isCli]
  );

  // Confirm Delete
  const [confirmDeleteDialogOpen, setConfirmDeleteDialogOpen] =
    React.useState<boolean>(false);
  const [confirmDeleteDialogConfig, setConfirmDeleteDialogConfig] =
    React.useState<
      ShowConfirmDeleteDialogOptionsWithCallback | null | undefined
    >(null);
  const openConfirmDeleteDialog = React.useCallback(
    (options: ShowConfirmDeleteDialogOptionsWithCallback) => {
      if (isCli) {
        options.callback(false);
        return;
      }
      setConfirmDeleteDialogOpen(true);
      setConfirmDeleteDialogConfig(options);
    },
    [isCli]
  );

  // YesNoCancel
  const [yesNoCancelDialogOpen, setYesNoCancelDialogOpen] =
    React.useState<boolean>(false);
  const [yesNoCancelDialogConfig, setYesNoCancelDialogConfig] = React.useState<
    ShowYesNoCancelDialogOptionsWithCallback | null | undefined
  >(null);
  const openYesNoCancelDialog = React.useCallback(
    (options: ShowYesNoCancelDialogOptionsWithCallback) => {
      if (isCli) {
        options.callback(2); // Cancel
        return;
      }
      setYesNoCancelDialogOpen(true);
      setYesNoCancelDialogConfig(options);
    },
    [isCli]
  );

  const value = React.useMemo(
    () => ({
      showAlertDialog: openAlertDialog,
      showConfirmDialog: openConfirmDialog,
      showConfirmDeleteDialog: openConfirmDeleteDialog,
      showYesNoCancelDialog: openYesNoCancelDialog,
    }),
    [
      openAlertDialog,
      openConfirmDialog,
      openConfirmDeleteDialog,
      openYesNoCancelDialog,
    ]
  );

  return (
    <AlertContext.Provider value={value}>
      {children}
      {alertDialogConfig && (
        <AlertDialog
          open={alertDialogOpen}
          onDismiss={() => {
            setAlertDialogOpen(false);
            alertDialogConfig.callback();
          }}
          dismissButtonLabel={alertDialogConfig.dismissButtonLabel}
          title={alertDialogConfig.title}
          message={alertDialogConfig.message}
        />
      )}
      {confirmDialogConfig && (
        <ConfirmDialog
          open={confirmDialogOpen}
          onConfirm={() => {
            setConfirmDialogOpen(false);
            confirmDialogConfig.callback(true);
          }}
          confirmButtonLabel={confirmDialogConfig.confirmButtonLabel}
          onDismiss={() => {
            setConfirmDialogOpen(false);
            confirmDialogConfig.callback(false);
          }}
          dismissButtonLabel={confirmDialogConfig.dismissButtonLabel}
          title={confirmDialogConfig.title}
          message={confirmDialogConfig.message}
          level={confirmDialogConfig.level || 'info'}
          maxWidth={confirmDialogConfig.maxWidth}
          makeDismissButtonPrimary={
            confirmDialogConfig.makeDismissButtonPrimary
          }
        />
      )}
      {confirmDeleteDialogConfig && (
        <ConfirmDeleteDialog
          open={confirmDeleteDialogOpen}
          onConfirm={() => {
            setConfirmDeleteDialogOpen(false);
            confirmDeleteDialogConfig.callback(true);
          }}
          confirmButtonLabel={confirmDeleteDialogConfig.confirmButtonLabel}
          onDismiss={() => {
            setConfirmDeleteDialogOpen(false);
            confirmDeleteDialogConfig.callback(false);
          }}
          dismissButtonLabel={confirmDeleteDialogConfig.dismissButtonLabel}
          title={confirmDeleteDialogConfig.title}
          message={confirmDeleteDialogConfig.message}
          fieldMessage={confirmDeleteDialogConfig.fieldMessage}
          confirmText={confirmDeleteDialogConfig.confirmText}
          header={confirmDeleteDialogConfig.header}
        />
      )}
      {yesNoCancelDialogConfig && (
        <YesNoCancelDialog
          open={yesNoCancelDialogOpen}
          onClickYes={() => {
            setYesNoCancelDialogOpen(false);
            yesNoCancelDialogConfig.callback(0);
          }}
          yesButtonLabel={yesNoCancelDialogConfig.yesButtonLabel}
          onClickNo={() => {
            setYesNoCancelDialogOpen(false);
            yesNoCancelDialogConfig.callback(1);
          }}
          noButtonLabel={yesNoCancelDialogConfig.noButtonLabel}
          onClickCancel={() => {
            setYesNoCancelDialogOpen(false);
            yesNoCancelDialogConfig.callback(2);
          }}
          cancelButtonLabel={yesNoCancelDialogConfig.cancelButtonLabel}
          title={yesNoCancelDialogConfig.title}
          message={yesNoCancelDialogConfig.message}
        />
      )}
    </AlertContext.Provider>
  );
}

export default ConfirmProvider;
