import * as React from 'react';
import {
  type Profile,
  type LoginForm,
  type RegisterForm,
  type ForgotPasswordForm,
  type AuthError,
  type IdentityProvider,
} from '../Utils/GDevelopServices/Authentication';
import { type PreferencesValues } from '../MainFrame/Preferences/PreferencesContext';
import { type CloudProjectWithUserAccessInfo } from '../Utils/GDevelopServices/Project';
import { type User as FirebaseUser } from 'firebase/auth';
import { type Badge, type Achievement } from '../Utils/GDevelopServices/Badge';
import {
  type Recommendation,
  type EditUserChanges,
} from '../Utils/GDevelopServices/User';
import { type Notification } from '../Utils/GDevelopServices/Notification';
import {
  type Limits,
  type Usages,
  type Subscription,
  type SubscriptionPlanPricingSystem,
  type UserEarningsBalance,
} from '../Utils/GDevelopServices/Usage';
import {
  type AssetShortHeader,
  type PrivateAssetPack,
  type PrivateGameTemplate,
  type Bundle,
} from '../Utils/GDevelopServices/Asset';
import { type Purchase } from '../Utils/GDevelopServices/Shop';
import { type ClaimedProductOptions } from './PurchaseClaimDialog';

export type AuthenticatedUser = {
  authenticated: boolean;
  firebaseUser: FirebaseUser | null | undefined;
  profile: Profile | null | undefined;
  loginState: null | 'loggingIn' | 'done';
  creatingOrLoggingInAccount: boolean;
  badges: Array<Badge> | null | undefined;
  cloudProjects: Array<CloudProjectWithUserAccessInfo> | null | undefined;
  cloudProjectsFetchingErrorLabel: React.ReactNode | null | undefined;
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
  onResetPassword: (forgotPasswordForm: ForgotPasswordForm) => Promise<void>;
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
  onOpenEmailVerificationDialog: (arg0: {
    sendEmailAutomatically: boolean;
    showSendEmailButton: boolean;
  }) => void;
  onAcceptGameStatsEmail: (value: boolean) => Promise<void>;
  getAuthorizationHeader: () => Promise<string>;
  achievements: Array<Achievement> | null | undefined;
};

export const authenticatedUserPropertiesLoadingState = {
  cloudProjects: null,
  receivedAssetPacks: null,
  receivedAssetShortHeaders: null,
  receivedGameTemplates: null,
  receivedBundles: null,
  badges: null,
  notifications: null,
};

export const initialAuthenticatedUser: AuthenticatedUser = {
  authenticated: false,
  firebaseUser: null,
  profile: null,
  loginState: null,
  creatingOrLoggingInAccount: false,
  cloudProjectsFetchingErrorLabel: null,
  gameTemplatePurchases: null,
  assetPackPurchases: null,
  coursePurchases: null,
  bundlePurchases: null,
  recommendations: null,
  subscription: null,
  subscriptionPricingSystem: null,
  usages: null,
  userEarningsBalance: null,
  limits: null,
  ...authenticatedUserPropertiesLoadingState,
  authenticationError: null,
  onLogin: async () => {},
  onLoginWithProvider: async () => {},
  onCancelLoginOrSignUp: () => {},
  onLogout: async () => {},
  onCreateAccount: async () => {},
  onEditProfile: async () => {},
  onResetPassword: async () => {},
  onOpenLoginDialog: () => {},
  onOpenLoginWithPurchaseClaimDialog: () => {},
  onOpenEditProfileDialog: () => {},
  onOpenChangeEmailDialog: () => {},
  onOpenCreateAccountDialog: () => {},
  onOpenCreateAccountWithPurchaseClaimDialog: () => {},
  onOpenPurchaseClaimDialog: () => {},
  claimedProductOptions: null,
  onClosePurchaseClaimDialog: () => {},
  onBadgesChanged: async () => {},
  onCloudProjectsChanged: async () => {},
  onRefreshUserProfile: async () => {},
  onRefreshFirebaseProfile: async () => {},
  onRefreshSubscription: async () => {},
  onRefreshLimits: async () => {},
  onRefreshGameTemplatePurchases: async () => {},
  onRefreshAssetPackPurchases: async () => {},
  onRefreshCoursePurchases: async () => {},
  onRefreshBundlePurchases: async () => {},
  onRefreshEarningsBalance: async () => {},
  onRefreshNotifications: async () => {},
  onPurchaseSuccessful: async () => {},
  onSendEmailVerification: async () => {},
  onOpenEmailVerificationDialog: () => {},
  onAcceptGameStatsEmail: async () => {},
  getAuthorizationHeader: (): Promise<string> =>
    Promise.reject(new Error('Unimplemented')),
  achievements: null,
};

export const authenticatedUserLoggedOutAttributes = {
  authenticated: false as const,
  firebaseUser: null,
  profile: null,
  // A logged out user is not the same a user being loaded (which can be the case at startup).
  // Use this loginState to make sure this is understood by the app as a user logged out, and not loading.
  loginState: 'done' as const,
  badges: null,
  cloudProjects: [] as Array<never>, // Initialize to empty array to indicate that the loading is done.
  cloudProjectsFetchingErrorLabel: null,
  receivedAssetPacks: [] as Array<never>, // Initialize to empty array to indicate that the loading is done.
  receivedAssetShortHeaders: [] as Array<never>, // Initialize to empty array to indicate that the loading is done.
  receivedGameTemplates: [] as Array<never>, // Initialize to empty array to indicate that the loading is done.
  receivedBundles: [] as Array<never>, // Initialize to empty array to indicate that the loading is done.
  subscription: null,
  subscriptionPricingSystem: null,
  userEarningsBalance: null,
  usages: null,
  limits: null,
};

const AuthenticatedUserContext: React.Context<AuthenticatedUser> =
  React.createContext<AuthenticatedUser>(initialAuthenticatedUser);

export default AuthenticatedUserContext;
