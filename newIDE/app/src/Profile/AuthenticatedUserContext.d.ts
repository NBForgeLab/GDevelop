import * as React from 'react';
import type { User as FirebaseUser } from 'firebase/auth';
import type {
  Profile,
  LoginForm,
  RegisterForm,
  ForgotPasswordForm,
  AuthError,
  IdentityProvider,
} from '../Utils/GDevelopServices/Authentication';
import type { PreferencesValues } from '../MainFrame/Preferences/PreferencesContext';
import type { CloudProjectWithUserAccessInfo } from '../Utils/GDevelopServices/Project';
import type { Badge, Achievement } from '../Utils/GDevelopServices/Badge';
import type {
  Recommendation,
  EditUserChanges,
} from '../Utils/GDevelopServices/User';
import type { Notification } from '../Utils/GDevelopServices/Notification';
import type {
  Limits,
  Usages,
  Subscription,
  SubscriptionPlanPricingSystem,
  UserEarningsBalance,
} from '../Utils/GDevelopServices/Usage';
import type {
  AssetShortHeader,
  PrivateAssetPack,
  PrivateGameTemplate,
  Bundle,
} from '../Utils/GDevelopServices/Asset';
import type { Purchase } from '../Utils/GDevelopServices/Shop';

type ClaimedProductOptions = any;

export type AuthenticatedUser = {
  authenticated: boolean;
  firebaseUser: FirebaseUser | null | undefined;
  profile: Profile | null | undefined;
  loginState: null | 'loggingIn' | 'done';
  creatingOrLoggingInAccount: boolean;
  badges: Array<Badge> | null | undefined;
  cloudProjects: Array<CloudProjectWithUserAccessInfo> | null | undefined;
  cloudProjectsFetchingErrorLabel: React.ReactNode;
  receivedAssetPacks: Array<PrivateAssetPack> | null | undefined;
  receivedAssetShortHeaders: Array<AssetShortHeader> | null | undefined;
  receivedGameTemplates: Array<PrivateGameTemplate> | null | undefined;
  receivedBundles: Array<Bundle> | null | undefined;
  gameTemplatePurchases: Array<Purchase> | null | undefined;
  assetPackPurchases: Array<Purchase> | null | undefined;
  coursePurchases: Array<Purchase> | null | undefined;
  bundlePurchases: Array<Purchase> | null | undefined;
  recommendations: Array<Recommendation> | null | undefined;
  notifications: Array<Notification> | null | undefined;
  userEarningsBalance: UserEarningsBalance | null | undefined;
  limits: Limits | null | undefined;
  authenticationError: AuthError | null | undefined;
  usages: Usages | null | undefined;
  subscription: Subscription | null | undefined;
  subscriptionPricingSystem: SubscriptionPlanPricingSystem | null | undefined;
  onLogin: (form: LoginForm) => Promise<void>;
  onLoginWithProvider: (provider: IdentityProvider) => Promise<void>;
  onCancelLoginOrSignUp: () => void;
  onLogout: () => Promise<void>;
  onCreateAccount: (
    form: RegisterForm,
    preferences: PreferencesValues
  ) => Promise<void>;
  onEditProfile: (
    changes: EditUserChanges,
    preferences: PreferencesValues
  ) => Promise<void>;
  onResetPassword: (form: ForgotPasswordForm) => Promise<void>;
  onOpenLoginDialog: () => void;
  onOpenLoginWithPurchaseClaimDialog: (
    claimedProductOptions: ClaimedProductOptions
  ) => void;
  onOpenEditProfileDialog: () => void;
  onOpenChangeEmailDialog: () => void;
  onOpenCreateAccountDialog: () => void;
  onOpenCreateAccountWithPurchaseClaimDialog: (
    claimedProductOptions: ClaimedProductOptions
  ) => void;
  onOpenPurchaseClaimDialog: (
    claimedProductOptions: ClaimedProductOptions
  ) => void;
  claimedProductOptions: ClaimedProductOptions | null | undefined;
  onClosePurchaseClaimDialog: () => void;
  onBadgesChanged: () => Promise<void>;
  onCloudProjectsChanged: () => Promise<void>;
  onRefreshUserProfile: () => Promise<void>;
  onRefreshFirebaseProfile: () => Promise<void>;
  onRefreshSubscription: () => Promise<void>;
  onRefreshLimits: () => Promise<void>;
  onRefreshGameTemplatePurchases: () => Promise<void>;
  onRefreshAssetPackPurchases: () => Promise<void>;
  onRefreshCoursePurchases: () => Promise<void>;
  onRefreshBundlePurchases: () => Promise<void>;
  onRefreshEarningsBalance: () => Promise<void>;
  onRefreshNotifications: () => Promise<void>;
  onPurchaseSuccessful: () => Promise<void>;
  onSendEmailVerification: () => Promise<void>;
  onOpenEmailVerificationDialog: (options: {
    sendEmailAutomatically: boolean;
    showSendEmailButton: boolean;
  }) => void;
  onAcceptGameStatsEmail: (value: boolean) => Promise<void>;
  getAuthorizationHeader: () => Promise<string>;
  achievements: Array<Achievement> | null | undefined;
};

declare const AuthenticatedUserContext: React.Context<AuthenticatedUser>;

export default AuthenticatedUserContext;
