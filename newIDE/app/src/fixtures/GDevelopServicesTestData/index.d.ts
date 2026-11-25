import type {
  Asset,
  AssetShortHeader,
} from '../../Utils/GDevelopServices/Asset';
import type { ExtensionShortHeader } from '../../Utils/GDevelopServices/Extension';
import type {
  PrivateAssetPackListingData,
  PrivateGameTemplateListingData,
} from '../../Utils/GDevelopServices/Shop';
import type { Subscription } from '../../Utils/GDevelopServices/Usage';
import type { GameMetrics } from '../../Utils/GDevelopServices/Analytics';
import type { AuthenticatedUser } from '../../Profile/AuthenticatedUserContext';

export declare const fakeAssetShortHeader1: AssetShortHeader;
export declare const fakeAsset1: Asset;
export declare const fakePixelArtAsset1: Asset;
export declare const fakeAssetWithUnknownExtension1: Asset;
export declare const fakeAssetWithFlashExtensionDependency1: Asset;
export declare const flashExtensionShortHeader: ExtensionShortHeader;
export declare const incompatibleFlashExtensionShortHeader: ExtensionShortHeader;
export declare const fireBulletExtensionShortHeader: ExtensionShortHeader;
export declare const fakeAssetWithCustomObject: Asset;
export declare const fakeSkyboxAsset: Asset;
export declare const buttonV1ExtensionShortHeader: ExtensionShortHeader;
export declare const buttonV2ExtensionShortHeader: ExtensionShortHeader;
export declare const breakingButtonV3ExtensionShortHeader: ExtensionShortHeader;
export declare const breakingButtonV31ExtensionShortHeader: ExtensionShortHeader;
export declare const incompatibleButtonV4ExtensionShortHeader: ExtensionShortHeader;
export declare const fakePrivateAssetPack1ListingData: PrivateAssetPackListingData;
export declare const fakePrivateGameTemplateListingData: PrivateGameTemplateListingData;
export declare const subscriptionForGoldUser: Subscription;
export declare const subscriptionForSilverUser: Subscription;
export declare const fakeSilverAuthenticatedUser: AuthenticatedUser;
export declare const gameRollingMetricsWithHoles: Array<GameMetrics>;
export declare const gameRollingMetricsWithOnly19Days: Array<GameMetrics>;
