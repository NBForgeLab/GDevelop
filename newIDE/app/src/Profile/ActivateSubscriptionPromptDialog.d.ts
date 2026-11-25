import * as React from 'react';
import type { BundleListingData } from '../Utils/GDevelopServices/Shop';

export type Props = {
  bundleListingData: BundleListingData;
  onActivateNow: () => void;
  onClose: () => void;
};

declare const ActivateSubscriptionPromptDialog: React.ComponentType<Props>;
export default ActivateSubscriptionPromptDialog;
