export declare const sendErrorMessage: (
  message: string,
  type:
    | 'error'
    | 'error-boundary_mainframe'
    | 'error-boundary_list-search-result'
    | 'error-boundary_box-search-result'
    | 'error-boundary_app'
    | 'error-boundary_extension-loader',
  rawError: any,
  errorId: string
) => void;

export declare const sendExternalEditorOpened: (editorName: string) => void;

export declare const sendBehaviorAdded: (metadata: {
  behaviorType: string;
  parentEditor: 'behaviors-editor' | 'instruction-editor-dialog';
}) => void;

export declare const sendBehaviorsEditorShown: (metadata: {
  parentEditor: 'object-editor-dialog';
}) => void;

export declare const sendAiRequestStarted: (metadata: {
  simplifiedProjectJsonLength: number;
  projectSpecificExtensionsSummaryJsonLength: number;
  payWithCredits: boolean;
  storageProviderName: string | null;
  mode: string;
  aiRequestId: string;
}) => void;

export declare const sendAiRequestMessageSent: (metadata: {
  simplifiedProjectJsonLength: number;
  projectSpecificExtensionsSummaryJsonLength: number;
  payWithCredits: boolean;
  mode: string;
  aiRequestId: string;
  outputLength: number;
}) => void;

export type SubscriptionDialogDisplayReason =
  | 'Disable GDevelop splash at startup'
  | 'Debugger'
  | 'Hot reloading'
  | 'Preview over wifi'
  | 'Landing dialog at opening'
  | 'Leaderboard count per game limit reached'
  | 'Cloud Project limit reached'
  | 'Consult profile'
  | 'Build limit reached'
  | 'Leaderboard customization'
  | 'Generate project from prompt'
  | 'Version history'
  | 'Add collaborators on project'
  | 'Claim asset pack'
  | 'Callout in Classroom tab'
  | 'Unlock build type'
  | 'Manage subscription as teacher'
  | 'Unlock course chapter'
  | 'Account get premium'
  | 'AI requests (subscribe)'
  | 'AI requests (upgrade)'
  | 'AI requests history'
  | 'Coupon code entered'
  | 'Restore deleted project';

export type SubscriptionPlacementId =
  | 'builds'
  | 'debugger'
  | 'gdevelop-branding'
  | 'generate-from-prompt'
  | 'hot-reloading'
  | 'leaderboards-customization'
  | 'leaderboards'
  | 'max-projects-reached'
  | 'opening-from-link'
  | 'preview-wifi'
  | 'profile'
  | 'invite-collaborators'
  | 'version-history'
  | 'claim-asset-pack'
  | 'unlock-course-chapter'
  | 'account-get-premium'
  | 'education'
  | 'ai-requests'
  | 'redeem-code'
  | 'restore-deleted-project';

export declare const sendCloudProjectCouldNotBeOpened: (metadata: {
  userId: string;
  cloudProjectId: string;
}) => void;

export declare const sendExportLaunched: (exportKind: string) => void;

export declare const sendAssetSwapFinished: (options: {
  originalObjectName: string;
  newObjectName: string;
  objectType: string;
}) => void;

export declare const sendAssetSwapStart: (options: {
  originalObjectName: string;
  objectType: string;
}) => void;

export declare const sendExtensionAddedToProject: (name: string) => void;

export declare const sendBundleBuyClicked: (options: {
  bundleId: string;
  bundleName: string;
  bundleTag: string;
  usageType: string;
  priceValue: number | undefined;
  priceCurrency: string | undefined;
}) => void;

export declare const sendBundleInformationOpened: (options: {
  bundleId: string;
  bundleName: string;
  source: 'store' | 'learn' | 'web-link';
  priceValue: number | undefined;
  priceCurrency: string | undefined;
}) => void;

export declare const sendExampleDetailsOpened: (slug: string) => void;

export declare const sendGameTemplateInformationOpened: (options: {
  gameTemplateId: string;
  gameTemplateName: string;
  source: 'store' | 'examples-list' | 'homepage' | 'web-link';
  priceValue: number | undefined;
  priceCurrency: string | undefined;
}) => void;

export declare const sendExtensionDetailsOpened: (name: string) => void;

export declare const sendAssetOpened: (options: {
  id: string;
  name: string;
  assetPackName: string | null;
  assetPackTag: string | null;
  assetPackId: string | null;
  assetPackKind: 'public' | 'private' | 'unknown';
}) => void;

export declare const sendAssetPackInformationOpened: (options: {
  assetPackId: string;
  assetPackName: string;
  assetPackKind: 'public' | 'private' | 'unknown';
  priceValue: number | undefined;
  priceCurrency: string | undefined;
}) => void;

export declare const sendAssetPackOpened: (options: {
  assetPackId: string | null;
  assetPackName: string;
  assetPackTag: string | null;
  assetPackKind: 'public' | 'private' | 'unknown';
  source: 'store-home' | 'author-profile' | 'new-object';
}) => void;

export declare const sendCourseInformationOpened: (options: {
  courseId: string;
  courseName: string;
  source: 'store' | 'learn';
  priceValue: number | undefined;
  priceCurrency: string | undefined;
}) => void;

export declare const sendAssetAddedToProject: (options: {
  id: string;
  name: string;
  assetPackName: string | null;
  assetPackTag: string | null;
  assetPackId: string | null;
  assetPackKind: 'public' | 'private' | 'unknown';
}) => void;

export declare const sendNewObjectCreated: (name: string) => void;

export declare const sendAssetPackBuyClicked: (options: {
  assetPackId: string;
  assetPackName: string;
  assetPackTag: string;
  assetPackKind: 'public' | 'private' | 'unknown';
  priceValue: number | undefined;
  priceCurrency: string | undefined;
  usageType: string;
}) => void;

export declare const sendGameTemplateBuyClicked: (options: {
  gameTemplateId: string;
  gameTemplateName: string;
  gameTemplateTag: string;
  usageType: string;
  priceValue: number | undefined;
  priceCurrency: string | undefined;
}) => void;

export declare const sendTutorialOpened: (tutorialName: string) => void;
