import type {
  CreditsPackageDialogDisplayConfig,
  CreditsPackageDialogVariantConfig,
} from '../Utils/GDevelopServices/Usage';

export type CreditsPackagePlacementId =
  | 'ai-requests'
  | 'asset-store'
  | 'game-featuring'
  | 'profile'
  | 'unknown';

export type CreditsPackageDialogVariant = 'standard' | 'ai' | 'compact';

export type CreditsPackageDialogDisplay = {
  dialogVariant: CreditsPackageDialogVariant;
};

export declare const resolveCreditsPackageDialogDisplay: (params: {
  placementId: CreditsPackagePlacementId;
  displayConfig: CreditsPackageDialogDisplayConfig | null | undefined;
  pickVariant?: (
    variants: Array<CreditsPackageDialogVariantConfig>
  ) => CreditsPackageDialogVariantConfig | null | undefined;
}) => CreditsPackageDialogDisplay;
