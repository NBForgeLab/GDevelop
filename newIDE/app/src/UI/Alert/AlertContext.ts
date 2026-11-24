import * as React from 'react';
import { type MessageDescriptor } from '../../Utils/i18n/MessageDescriptor.flow';

// Alert
export type ShowAlertDialogOptions = {
  title: MessageDescriptor;
  dismissButtonLabel?: MessageDescriptor;
  message: MessageDescriptor;
};
export type ShowAlertDialogOptionsWithCallback = ShowAlertDialogOptions & {
  callback: (...args: Array<any>) => any;
};
export type ShowAlertFunction = (
  showAlertDialogOptions: ShowAlertDialogOptions
) => Promise<void>;

// Confirm
export type ShowConfirmDialogOptions = {
  title: MessageDescriptor;
  confirmButtonLabel?: MessageDescriptor;
  dismissButtonLabel?: MessageDescriptor;
  message: MessageDescriptor;
  level?: 'info' | 'warning';
  maxWidth?: 'xs' | 'sm' | 'md';
  makeDismissButtonPrimary?: boolean;
};
export type ShowConfirmDialogOptionsWithCallback = ShowConfirmDialogOptions & {
  callback: (...args: Array<any>) => any;
};
export type ShowConfirmFunction = (
  showConfirmDialogOptions: ShowConfirmDialogOptions
) => Promise<boolean>;

// Confirm Delete
export type ShowConfirmDeleteDialogOptions = {
  title: MessageDescriptor;
  confirmButtonLabel?: MessageDescriptor;
  dismissButtonLabel?: MessageDescriptor;
  message: MessageDescriptor;
  fieldMessage?: MessageDescriptor;
  confirmText?: string;
  header?: React.ReactNode;
};
export type ShowConfirmDeleteDialogOptionsWithCallback =
  ShowConfirmDeleteDialogOptions & {
    callback: (...args: Array<any>) => any;
  };
export type ShowConfirmDeleteFunction = (
  showConfirmDeleteDialogOptions: ShowConfirmDeleteDialogOptions
) => Promise<boolean>;

// Yes No Cancel
export type ShowYesNoCancelDialogOptions = {
  title: MessageDescriptor;
  yesButtonLabel?: MessageDescriptor;
  noButtonLabel?: MessageDescriptor;
  cancelButtonLabel?: MessageDescriptor;
  message: MessageDescriptor;
};
export type ShowYesNoCancelDialogOptionsWithCallback =
  ShowYesNoCancelDialogOptions & {
    callback: (...args: Array<any>) => any;
  };

export type ConfirmState = {
  showAlertDialog: (
    showAlertDialogOptionsWithCallback: ShowAlertDialogOptionsWithCallback
  ) => void;
  showConfirmDialog: (
    showConfirmDialogOptionsWithCallback: ShowConfirmDialogOptionsWithCallback
  ) => void;
  showConfirmDeleteDialog: (
    showConfirmDeleteDialogOptionsWithCallback: ShowConfirmDeleteDialogOptionsWithCallback
  ) => void;
  showYesNoCancelDialog: (
    showYesNoCancelDialogOptionsWithCallback: ShowYesNoCancelDialogOptionsWithCallback
  ) => void;
};

const initialConfirmState: ConfirmState = {
  showAlertDialog: () => {},
  showConfirmDialog: () => {},
  showConfirmDeleteDialog: () => {},
  showYesNoCancelDialog: () => {},
};

const AlertContext: React.Context<ConfirmState> =
  React.createContext<ConfirmState>(initialConfirmState);

export default AlertContext;
