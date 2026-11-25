import * as React from 'react';

type Props = {
  displayPurchaseAction: boolean;
  actionButtonLabel?: React.ReactNode;
  onActionButtonClick?: () => void;
};

declare const CreditsStatusBanner: React.ComponentType<Props>;

export default CreditsStatusBanner;
