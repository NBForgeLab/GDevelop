import * as React from 'react';
import { type CreditsPackageListingData } from '../../Utils/GDevelopServices/Shop';

type CreditsPackageDialogOpeningOptions = any;
type CreditsUsageDialogOptions = any;

type CreditsPackageStoreState = {
  fetchCreditsPackages: () => void;
  creditsPackageListingDatas:
    | Array<CreditsPackageListingData>
    | null
    | undefined;
  error: Error | null | undefined;
  openCreditsPackageDialog: (
    options?: CreditsPackageDialogOpeningOptions | null
  ) => void;
  closeCreditsPackageDialog: () => void;
  openCreditsUsageDialog: (options: CreditsUsageDialogOptions) => void;
};

export declare const initialCreditsPackageStoreState: CreditsPackageStoreState;

export declare const CreditsPackageStoreContext: React.Context<CreditsPackageStoreState>;

export declare const getCreditsAmountFromId: (id: string) => number;

export declare const CreditsPackageStoreStateProvider: React.ComponentType<{
  children: React.ReactNode;
}>;
