import * as React from 'react';

export type Props = {
  onClose: () => void;
  title: React.ReactNode;
  message: React.ReactNode;
  onConfirm: () => Promise<void>;
  successMessage: React.ReactNode;
  closeAutomaticallyAfterSuccess?: boolean;
};

declare const CreditsUsageDialog: React.ComponentType<Props>;
export default CreditsUsageDialog;
