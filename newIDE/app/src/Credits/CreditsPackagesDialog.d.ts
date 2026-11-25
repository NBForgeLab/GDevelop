import * as React from 'react';
import type { CreditsPackageListingData } from '../Utils/GDevelopServices/Shop';
import type { CreditsPackageDialogVariant } from './CreditsPackagesDialogDisplay';

export type Props = {
  onClose: () => void;
  suggestedPackage: CreditsPackageListingData | null | undefined;
  missingCredits: number | null | undefined;
  showCalloutTip?: boolean;
  dialogVariant?: CreditsPackageDialogVariant;
};

declare const CreditsPackagesDialog: React.ComponentType<Props>;
export default CreditsPackagesDialog;
