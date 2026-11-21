import * as React from 'react';

export interface AlertContextType {
  showAlertDialog: (options: any) => void;
  showConfirmDialog: (options: any) => void;
  showConfirmDeleteDialog: (options: any) => void;
  showYesNoCancelDialog: (options: any) => void;
}

declare const AlertContext: React.Context<AlertContextType>;
export default AlertContext;
