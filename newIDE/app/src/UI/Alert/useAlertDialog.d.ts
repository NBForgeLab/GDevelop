export interface ShowAlertDialogOptions {
  title: any;
  message: any;
  dismissButtonLabel?: any;
}

export interface ShowConfirmDialogOptions {
  title: any;
  message: any;
  confirmButtonLabel?: any;
  dismissButtonLabel?: any;
  level?: 'info' | 'warning';
  maxWidth?: 'xs' | 'sm' | 'md';
  makeDismissButtonPrimary?: boolean;
}

export interface ShowConfirmDeleteDialogOptions {
  title: any;
  message: any;
  fieldMessage?: any;
  confirmText?: string;
  header?: any;
  confirmButtonLabel?: any;
  dismissButtonLabel?: any;
}

export interface ShowYesNoCancelDialogOptions {
  title: any;
  message: any;
  yesButtonLabel?: any;
  noButtonLabel?: any;
  cancelButtonLabel?: any;
}

declare const useAlertDialog: () => {
  showAlert: (options: ShowAlertDialogOptions) => Promise<void>;
  showConfirmation: (options: ShowConfirmDialogOptions) => Promise<boolean>;
  showDeleteConfirmation: (
    options: ShowConfirmDeleteDialogOptions
  ) => Promise<boolean>;
  showYesNoCancel: (options: ShowYesNoCancelDialogOptions) => Promise<boolean>;
};

export default useAlertDialog;
