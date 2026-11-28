import { Trans } from '@lingui/macro';
import * as React from 'react';
import type {
  ResourceKind,
  ResourceImportationBehavior,
} from '../../ResourcesList/ResourceSource';
import { type EditorMosaicNode } from '../../UI/EditorMosaic';
import { type FileMetadataAndStorageProviderName } from '../../ProjectsStorage';
import { type ShortcutMap } from '../../KeyboardShortcuts/DefaultShortcuts';
import { type CommandName } from '../../CommandPalette/CommandsList';
import { type EditorTabsPersistedState } from '../EditorTabs/EditorTabsHandler';
import { type GamesDashboardOrderBy } from '../../GameDashboard/GamesList';
import optionalRequire from '../../Utils/OptionalRequire';
import { findDefaultFolder } from '../../ProjectsStorage/LocalFileStorageProvider/LocalPathFinder';
import { isWebGL2Supported } from '../../Utils/WebGL';

const electron = optionalRequire('electron');
const remote = optionalRequire('@electron/remote');
const app = remote ? remote.app : null;

export type AlertMessageIdentifier =
  | 'default-additional-work'
  | 'automatic-lighting-layer'
  | 'object-moved-in-lighting-layer'
  | 'use-non-smoothed-textures'
  | 'use-pixel-rounding'
  | 'use-nearest-scale-mode'
  | 'maximum-fps-too-low'
  | 'minimum-fps-too-low'
  | 'function-extractor-explanation'
  | 'events-based-behavior-explanation'
  | 'empty-events-based-behavior-explanation'
  | 'events-based-object-explanation'
  | 'empty-events-based-object-explanation'
  | 'too-much-effects'
  | 'effects-usage'
  | 'lighting-layer-usage'
  | 'resource-properties-panel-explanation'
  | 'physics2-shape-collisions'
  | 'lifecycle-events-function-included-only-if-extension-used'
  | 'p2p-is-networking'
  | 'p2p-dataloss'
  | 'command-palette-shortcut'
  | 'asset-installed-explanation'
  | 'extension-installed-explanation'
  | 'project-should-have-unique-package-name'
  | 'slow-graphics-rendering';

export type EditorMosaicName =
  | 'scene-editor'
  | 'debugger'
  | 'resources-editor'
  | 'events-functions-extension-editor'
  | 'gameplay-test-editor';

export type InAppTutorialUserProgress = {
  step: number;
  /** Rounded progress in percentage */
  progress: Array<number>;
  fileMetadataAndStorageProviderName?: FileMetadataAndStorageProviderName;
  projectData: {
    [key: string]: string;
  };
};

export type InAppTutorialProgressDatabase = {
  [tutorialId: string]: {
    [userId: string]: InAppTutorialUserProgress;
  };
};

export const allAlertMessages: Array<{
  key: AlertMessageIdentifier;
  label: React.ReactNode;
}> = [
  {
    key: 'use-non-smoothed-textures',
    label: <Trans>Using non smoothed textures</Trans>,
  },
  {
    key: 'use-pixel-rounding',
    label: <Trans>Using pixel rounding</Trans>,
  },
  {
    key: 'use-nearest-scale-mode',
    label: <Trans>Using Nearest Scale Mode</Trans>,
  },
  {
    key: 'maximum-fps-too-low',
    label: <Trans>Maximum Fps is too low</Trans>,
  },
  {
    key: 'minimum-fps-too-low',
    label: <Trans>Minimum Fps is too low</Trans>,
  },
  {
    key: 'function-extractor-explanation',
    label: <Trans>Using function extractor</Trans>,
  },
  {
    key: 'events-based-behavior-explanation',
    label: <Trans>Using events based behavior</Trans>,
  },
  {
    key: 'empty-events-based-behavior-explanation',
    label: <Trans>Using empty events based behavior</Trans>,
  },
  {
    key: 'events-based-object-explanation',
    label: <Trans>Using events based object</Trans>,
  },
  {
    key: 'empty-events-based-object-explanation',
    label: <Trans>Using empty events based object</Trans>,
  },
  {
    key: 'too-much-effects',
    label: <Trans>Using too much effects</Trans>,
  },
  {
    key: 'effects-usage',
    label: <Trans>Using effects</Trans>,
  },
  {
    key: 'lighting-layer-usage',
    label: <Trans>Using lighting layer</Trans>,
  },
  {
    key: 'automatic-lighting-layer',
    label: <Trans>Automatic creation of lighting layer</Trans>,
  },
  {
    key: 'object-moved-in-lighting-layer',
    label: <Trans>Light object automatically put in lighting layer</Trans>,
  },
  {
    key: 'resource-properties-panel-explanation',
    label: <Trans>Using the resource properties panel</Trans>,
  },
  {
    key: 'physics2-shape-collisions',
    label: <Trans>Collisions handling with the Physics engine</Trans>,
  },
  {
    key: 'lifecycle-events-function-included-only-if-extension-used',
    label: <Trans>Lifecycle functions only included when extension used</Trans>,
  },
  {
    key: 'p2p-is-networking',
    label: (
      <Trans>Peer to peer IP address leak warning/THNK recommendation</Trans>
    ),
  },
  {
    key: 'p2p-dataloss',
    label: <Trans>Peer to peer data-loss notice</Trans>,
  },
  {
    key: 'command-palette-shortcut',
    label: <Trans>Command palette keyboard shortcut</Trans>,
  },
  {
    key: 'asset-installed-explanation',
    label: (
      <Trans>Explanation after an object is installed from the store</Trans>
    ),
  },
  {
    key: 'project-should-have-unique-package-name',
    label: (
      <Trans>Project package names should not begin with com.example</Trans>
    ),
  },
];

export type EditorStateForPropertyPanel = {
  scrollPosition: number;
  collapsedSections: {
    [key: string]: boolean;
  };
};

/**
 * All the preferences of GDevelop. To add a new preference, add it into this
 * type and add a setter into `Preferences` type. Then, update the
 * preference dialog.
 */
export type EditorStateForProject = {
  editorTabs: EditorTabsPersistedState | null;
  propertiesPanel: {
    [key: string]: {
      [key: string]: EditorStateForPropertyPanel;
    };
  };
};

export type EditorStateForProjectUpdate = Partial<EditorStateForProject>;

export type PreferencesValues = {
  language: string;
  autoDownloadUpdates: boolean;
  themeName: string;
  codeEditorThemeName: string;
  hiddenAlertMessages: {
    [key: string]: boolean;
  };
  hiddenTutorialHints: {
    [key: string]: boolean;
  };
  hiddenAnnouncements: {
    [key: string]: boolean;
  };
  hiddenAskAiStandAloneForms: {
    [key: string]: boolean;
  };
  autoDisplayChangelog: boolean;
  lastLaunchedVersion: string | null | undefined;
  eventsSheetShowObjectThumbnails: boolean;
  autosaveOnPreview: boolean;
  useGDJSDevelopmentWatcher: boolean;
  eventsSheetUseAssignmentOperators: boolean;
  eventsSheetIndentScale: number;
  eventsSheetZoomLevel: number;
  showEffectParameterNames: boolean;
  projectLastUsedPaths: {
    [key: string]: {
      [key in ResourceKind]?: string;
    };
  };
  defaultEditorMosaicNodes: {
    [key in EditorMosaicName]?: EditorMosaicNode | null | undefined;
  };
  recentProjectFiles: Array<FileMetadataAndStorageProviderName>;
  autoOpenMostRecentProject: boolean;
  hasProjectOpened: boolean;
  userShortcutMap: ShortcutMap;
  newObjectDialogDefaultTab: 'asset-store' | 'new-object';
  newEffectDialogDefaultTab: 'asset-store' | 'from-scratch';
  shareDialogDefaultTab: 'invite' | 'publish';
  isMenuBarHiddenInPreview: boolean;
  isAlwaysOnTopInPreview: boolean;
  backdropClickBehavior: 'nothing' | 'apply' | 'cancel';
  resourcesImporationBehavior: ResourceImportationBehavior;
  eventsSheetCancelInlineParameter: 'cancel' | 'apply';
  showExperimentalExtensions: boolean;
  showCreateSectionByDefault: boolean;
  showInAppTutorialDeveloperMode: boolean;
  showDeprecatedInstructionWarning:
    'no' | 'icon' | 'icon-and-deprecated-warning-text';
  openDiagnosticReportAutomatically: boolean;
  blockPreviewAndExportOnDiagnosticErrors: boolean;
  use3DEditor: boolean;
  showBasicProfilingCounters: boolean;
  inAppTutorialsProgress: InAppTutorialProgressDatabase;
  newProjectsDefaultFolder: string;
  newProjectsDefaultStorageProviderName: string;
  useShortcutToClosePreviewWindow: boolean;
  watchProjectFolderFilesForLocalProjects: boolean;
  /** The month (YYYY-MM) when the claimable products dialog was last shown. */
  lastClaimableProductsDialogMonth: string | null | undefined;
  autoDisplayClaimableProductsDialog: boolean;
  newFeaturesAcknowledgements: {
    [featureId: string]: {
      dates: Array<number>;
    };
  };
  // Store as object in case we need to add options.
  displaySaveReminder: {
    activated: boolean;
  };
  editorStateByProject: {
    [key: string]: EditorStateForProject;
  };
  fetchPlayerTokenForPreviewAutomatically: boolean;
  previewCrashReportUploadLevel: string;
  gamesDashboardOrderBy: GamesDashboardOrderBy;
  takeScreenshotOnPreview: boolean;
  gameplayTestFramePosition: {
    left: number;
    bottom: number;
  } | null;
  gameplayTestFrameZoomFactor: number | null;
  showAiAskButtonInTitleBar: boolean;
  automaticallyUseCreditsForAiRequests: boolean;
  automaticallyApplyAiRequestEditsByProjectId: {
    [key: string]: boolean;
  };
  useBackgroundSerializerForSaving: boolean;
  disableNpmScriptConfirmation: boolean;
  showJsTypeError: boolean;
  canonicalEventSerialization: boolean;
};

/**
 * Partial PreferencesValues that can be overridden per-project via preferences block in gdevelop-settings.yaml.
 */
export type ProjectSpecificPreferencesValues = Partial<PreferencesValues>;

/**
 * Type containing all the preferences of GDevelop and their setters.
 */
export type Preferences = {
  values: PreferencesValues;
  setMultipleValues: (updates: ProjectSpecificPreferencesValues) => void;
  setLanguage: (language: string) => void;
  setThemeName: (themeName: string) => void;
  setCodeEditorThemeName: (codeEditorThemeName: string) => void;
  setAutoDownloadUpdates: (enabled: boolean) => void;
  checkUpdates: (forceDownload?: boolean) => void;
  setAutoDisplayChangelog: (enabled: boolean) => void;
  showAlertMessage: (identifier: AlertMessageIdentifier, show: boolean) => void;
  showAllAlertMessages: () => void;
  showTutorialHint: (identifier: string, show: boolean) => void;
  showAllTutorialHints: () => void;
  showAnnouncement: (identifier: string, show: boolean) => void;
  showAllAnnouncements: () => void;
  showAskAiStandAloneForm: (identifier: string, show: boolean) => void;
  showAllAskAiStandAloneForms: () => void;
  verifyIfIsNewVersion: () => boolean;
  setEventsSheetShowObjectThumbnails: (enabled: boolean) => void;
  setAutosaveOnPreview: (enabled: boolean) => void;
  setUseGDJSDevelopmentWatcher: (enabled: boolean) => void;
  setEventsSheetUseAssignmentOperators: (enabled: boolean) => void;
  setEventsSheetIndentScale: (scale: number) => void;
  setEventsSheetZoomLevel: (zoomLevel: number) => void;
  setShowEffectParameterNames: (enabled: boolean) => void;
  getLastUsedPath: (project: gdProject, kind: ResourceKind) => string;
  setLastUsedPath: (
    project: gdProject,
    kind: ResourceKind,
    path: string
  ) => void;
  getDefaultEditorMosaicNode: (
    name: EditorMosaicName
  ) => EditorMosaicNode | null | undefined;
  setDefaultEditorMosaicNode: (
    name: EditorMosaicName,
    node: EditorMosaicNode | null | undefined
  ) => void;
  getRecentProjectFiles: (
    options?:
      | {
          limit: number;
        }
      | null
      | undefined
  ) => Array<FileMetadataAndStorageProviderName>;
  insertRecentProjectFile: (
    fileMetadata: FileMetadataAndStorageProviderName
  ) => void;
  removeRecentProjectFile: (
    fileMetadata: FileMetadataAndStorageProviderName
  ) => void;
  getAutoOpenMostRecentProject: () => boolean;
  setAutoOpenMostRecentProject: (enabled: boolean) => void;
  hadProjectOpenedDuringLastSession: () => boolean;
  setHasProjectOpened: (enabled: boolean) => void;
  resetShortcutsToDefault: () => void;
  setShortcutForCommand: (commandName: CommandName, shortcut: string) => void;
  getNewObjectDialogDefaultTab: () => 'asset-store' | 'new-object';
  setNewObjectDialogDefaultTab: (arg0: 'asset-store' | 'new-object') => void;
  getNewEffectDialogDefaultTab: () => 'asset-store' | 'from-scratch';
  setNewEffectDialogDefaultTab: (arg0: 'asset-store' | 'from-scratch') => void;
  getShareDialogDefaultTab: () => 'invite' | 'publish';
  setShareDialogDefaultTab: (arg0: 'invite' | 'publish') => void;
  getIsMenuBarHiddenInPreview: () => boolean;
  setIsMenuBarHiddenInPreview: (enabled: boolean) => void;
  setBackdropClickBehavior: (value: 'nothing' | 'apply' | 'cancel') => void;
  setResourcesImporationBehavior: (value: ResourceImportationBehavior) => void;
  getIsAlwaysOnTopInPreview: () => boolean;
  setIsAlwaysOnTopInPreview: (enabled: boolean) => void;
  setEventsSheetCancelInlineParameter: (value: 'cancel' | 'apply') => void;
  setShowExperimentalExtensions: (enabled: boolean) => void;
  setShowCreateSectionByDefault: (enabled: boolean) => void;
  setShowInAppTutorialDeveloperMode: (enabled: boolean) => void;
  setOpenDiagnosticReportAutomatically: (enabled: boolean) => void;
  getOpenDiagnosticReportAutomatically: () => boolean;
  setBlockPreviewAndExportOnDiagnosticErrors: (enabled: boolean) => void;
  getBlockPreviewAndExportOnDiagnosticErrors: () => boolean;
  setShowDeprecatedInstructionWarning: (
    value: 'no' | 'icon' | 'icon-and-deprecated-warning-text'
  ) => void;
  getShowDeprecatedInstructionWarning: () =>
    'no' | 'icon' | 'icon-and-deprecated-warning-text';
  setUse3DEditor: (enabled: boolean) => void;
  getUse3DEditor: () => boolean;
  setShowBasicProfilingCounters: (enabled: boolean) => void;
  setDisableNpmScriptConfirmation: (enabled: boolean) => void;
  setNewProjectsDefaultStorageProviderName: (name: string) => void;
  saveTutorialProgress: (
    arg0: InAppTutorialUserProgress & {
      tutorialId: string;
      userId: string | null | undefined;
    }
  ) => void;
  getTutorialProgress: (arg0: {
    tutorialId: string;
    userId: string | null | undefined;
  }) => InAppTutorialUserProgress | null | undefined;
  setNewProjectsDefaultFolder: (newProjectsDefaultFolder: string) => void;
  setUseShortcutToClosePreviewWindow: (enabled: boolean) => void;
  setWatchProjectFolderFilesForLocalProjects: (enabled: boolean) => void;
  setLastClaimableProductsDialogMonth: (month: string) => void;
  setAutoDisplayClaimableProductsDialog: (enabled: boolean) => void;
  setNewFeaturesAcknowledgements: (arg0: {
    [featureId: string]: {
      dates: Array<number>;
    };
  }) => void;
  setDisplaySaveReminder: (arg0: { activated: boolean }) => void;
  getEditorStateForProject: (
    projectId: string
  ) => EditorStateForProject | null | undefined;
  setEditorStateForProject: (
    projectId: string,
    editorState: EditorStateForProjectUpdate | null
  ) => void;
  setFetchPlayerTokenForPreviewAutomatically: (enabled: boolean) => void;
  setPreviewCrashReportUploadLevel: (level: string) => void;
  setGamesDashboardOrderBy: (
    orderBy: 'lastModifiedAt' | 'totalSessions' | 'weeklySessions'
  ) => void;
  setTakeScreenshotOnPreview: (enabled: boolean) => void;
  setGameplayTestFramePosition: (position: {
    left: number;
    bottom: number;
  }) => void;
  setGameplayTestFrameZoomFactor: (zoomFactor: number) => void;
  setShowAiAskButtonInTitleBar: (enabled: boolean) => void;
  setAutomaticallyUseCreditsForAiRequests: (enabled: boolean) => void;
  setAutomaticallyApplyAiRequestEditsForProjectId: (
    projectId: string,
    enabled: boolean
  ) => void;
  setUseBackgroundSerializerForSaving: (enabled: boolean) => void;
  setShowJsTypeError: (enabled: boolean) => void;
  setCanonicalEventSerialization: (enabled: boolean) => void;
};

export const initialPreferences = {
  values: {
    language: 'en',
    autoDownloadUpdates: true,
    themeName: (typeof window !== 'undefined' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'GDevelop default Dark' // TODO: Use the light theme back when it's adapted to the modern theme.
      : 'GDevelop default Dark') as string,
    codeEditorThemeName: 'vs-dark',
    hiddenAlertMessages: {},
    hiddenTutorialHints: {},
    hiddenAnnouncements: {},
    hiddenAskAiStandAloneForms: {},
    autoDisplayChangelog: true,
    lastLaunchedVersion: undefined,
    eventsSheetShowObjectThumbnails: true,
    autosaveOnPreview: true,
    useGDJSDevelopmentWatcher: true,
    eventsSheetUseAssignmentOperators: false,
    eventsSheetZoomLevel: 14,
    eventsSheetIndentScale: 1,
    showEffectParameterNames: false,
    projectLastUsedPaths: {},
    defaultEditorMosaicNodes: {},
    recentProjectFiles: [] as Array<never>,
    autoOpenMostRecentProject: true,
    hasProjectOpened: false,
    userShortcutMap: {},
    newObjectDialogDefaultTab: (electron ? 'new-object' : 'asset-store') as
      'asset-store' | 'new-object',
    // Show the effects of the store first, as they are not otherwise visible.
    newEffectDialogDefaultTab: 'asset-store' as 'asset-store' | 'from-scratch',
    shareDialogDefaultTab: 'publish' as 'invite' | 'publish',
    isMenuBarHiddenInPreview: true,
    isAlwaysOnTopInPreview: false,
    backdropClickBehavior: 'nothing' as 'nothing' | 'apply' | 'cancel',
    resourcesImporationBehavior: 'ask' as ResourceImportationBehavior,
    eventsSheetCancelInlineParameter: 'apply' as 'cancel' | 'apply',
    showExperimentalExtensions: false,
    showCreateSectionByDefault: false,
    showInAppTutorialDeveloperMode: false,
    openDiagnosticReportAutomatically: true,
    blockPreviewAndExportOnDiagnosticErrors: false,
    showDeprecatedInstructionWarning: 'no' as
      'no' | 'icon' | 'icon-and-deprecated-warning-text',
    use3DEditor: isWebGL2Supported() as boolean,
    showBasicProfilingCounters: false,
    inAppTutorialsProgress: {},
    newProjectsDefaultFolder: (app ? findDefaultFolder(app) : '') as string,
    newProjectsDefaultStorageProviderName: 'Cloud',
    useShortcutToClosePreviewWindow: true,
    watchProjectFolderFilesForLocalProjects: true,
    lastClaimableProductsDialogMonth: null,
    autoDisplayClaimableProductsDialog: true,
    newFeaturesAcknowledgements: {},
    displaySaveReminder: { activated: true },
    editorStateByProject: {},
    fetchPlayerTokenForPreviewAutomatically: true,
    previewCrashReportUploadLevel: 'exclude-javascript-code-events',
    gamesDashboardOrderBy: 'lastModifiedAt' as
      'lastModifiedAt' | 'totalSessions' | 'weeklySessions',
    takeScreenshotOnPreview: true,
    gameplayTestFramePosition: null,
    gameplayTestFrameZoomFactor: null,
    showAiAskButtonInTitleBar: true,
    automaticallyUseCreditsForAiRequests: false,
    automaticallyApplyAiRequestEditsByProjectId: {},
    useBackgroundSerializerForSaving: false,
    disableNpmScriptConfirmation: false,
    showJsTypeError: false,
    canonicalEventSerialization: false,
  },
  setMultipleValues: () => {},
  setLanguage: () => {},
  setThemeName: () => {},
  setCodeEditorThemeName: () => {},
  setAutoDownloadUpdates: () => {},
  checkUpdates: () => {},
  setAutoDisplayChangelog: () => {},
  showAlertMessage: (identifier: AlertMessageIdentifier, show: boolean) => {},
  showAllAlertMessages: () => {},
  showTutorialHint: (identifier: string, show: boolean) => {},
  showAllTutorialHints: () => {},
  showAnnouncement: (identifier: string, show: boolean) => {},
  showAllAnnouncements: () => {},
  showAskAiStandAloneForm: (identifier: string, show: boolean) => {},
  showAllAskAiStandAloneForms: () => {},
  verifyIfIsNewVersion: (): boolean => false,
  setEventsSheetShowObjectThumbnails: () => {},
  setAutosaveOnPreview: () => {},
  setUseGDJSDevelopmentWatcher: (enabled: boolean) => {},
  setEventsSheetUseAssignmentOperators: (enabled: boolean) => {},
  setEventsSheetIndentScale: (scale: number) => {},
  setEventsSheetZoomLevel: (zoomLevel: number) => {},
  setShowEffectParameterNames: (enabled: boolean) => {},
  getLastUsedPath: (project: gdProject, kind: ResourceKind): string => '',
  setLastUsedPath: (project: gdProject, kind: ResourceKind, path: string) => {},
  getDefaultEditorMosaicNode: (name: EditorMosaicName): null => null,
  setDefaultEditorMosaicNode: (
    name: EditorMosaicName,
    node: EditorMosaicNode | null | undefined
  ) => {},
  getRecentProjectFiles: (options?: any): any => [],
  insertRecentProjectFile: () => {},
  removeRecentProjectFile: () => {},
  getAutoOpenMostRecentProject: (): boolean => true,
  setAutoOpenMostRecentProject: () => {},
  hadProjectOpenedDuringLastSession: (): boolean => false,
  setHasProjectOpened: () => {},
  resetShortcutsToDefault: () => {},
  setShortcutForCommand: (commandName: CommandName, shortcut: string) => {},
  getNewObjectDialogDefaultTab: (): 'asset-store' | 'new-object' =>
    'asset-store',
  setNewObjectDialogDefaultTab: () => {},
  getNewEffectDialogDefaultTab: (): 'asset-store' | 'from-scratch' =>
    'asset-store',
  setNewEffectDialogDefaultTab: () => {},
  getShareDialogDefaultTab: (): 'invite' | 'publish' => 'invite',
  setShareDialogDefaultTab: () => {},
  getIsMenuBarHiddenInPreview: (): boolean => true,
  setIsMenuBarHiddenInPreview: () => {},
  setBackdropClickBehavior: () => {},
  setResourcesImporationBehavior: () => {},
  getIsAlwaysOnTopInPreview: (): boolean => true,
  setIsAlwaysOnTopInPreview: () => {},
  setEventsSheetCancelInlineParameter: () => {},
  setShowExperimentalExtensions: () => {},
  setShowCreateSectionByDefault: (enabled: boolean) => {},
  setShowInAppTutorialDeveloperMode: (enabled: boolean) => {},
  setShowDeprecatedInstructionWarning: (
    value: 'no' | 'icon' | 'icon-and-deprecated-warning-text'
  ) => {},
  getOpenDiagnosticReportAutomatically: (): boolean => true,
  setOpenDiagnosticReportAutomatically: (enabled: boolean) => {},
  getBlockPreviewAndExportOnDiagnosticErrors: (): boolean => false,
  setBlockPreviewAndExportOnDiagnosticErrors: (enabled: boolean) => {},
  getShowDeprecatedInstructionWarning: ():
    'no' | 'icon' | 'icon-and-deprecated-warning-text' => 'no',
  setUse3DEditor: (enabled: boolean) => {},
  getUse3DEditor: (): boolean => false,
  setShowBasicProfilingCounters: (enabled: boolean) => {},
  setDisableNpmScriptConfirmation: (enabled: boolean) => {},
  saveTutorialProgress: () => {},
  getTutorialProgress: (): null => null,
  setNewProjectsDefaultFolder: () => {},
  setNewProjectsDefaultStorageProviderName: () => {},
  setUseShortcutToClosePreviewWindow: () => {},
  setWatchProjectFolderFilesForLocalProjects: () => {},
  setLastClaimableProductsDialogMonth: () => {},
  setAutoDisplayClaimableProductsDialog: () => {},
  setNewFeaturesAcknowledgements: () => {},
  setDisplaySaveReminder: () => {},
  getEditorStateForProject: (projectId: any): any => {},
  setEditorStateForProject: (projectId: any, editorState: any) => {},
  setFetchPlayerTokenForPreviewAutomatically: (enabled: boolean) => {},
  setPreviewCrashReportUploadLevel: (level: string) => {},
  setGamesDashboardOrderBy: (
    orderBy: 'lastModifiedAt' | 'totalSessions' | 'weeklySessions'
  ) => {},
  setTakeScreenshotOnPreview: (enabled: boolean) => {},
  setGameplayTestFramePosition: (position: {
    left: number;
    bottom: number;
  }) => {},
  setGameplayTestFrameZoomFactor: (zoomFactor: number) => {},
  setShowAiAskButtonInTitleBar: (enabled: boolean) => {},
  setAutomaticallyUseCreditsForAiRequests: (enabled: boolean) => {},
  setAutomaticallyApplyAiRequestEditsForProjectId: (
    projectId: string,
    enabled: boolean
  ) => {},
  setUseBackgroundSerializerForSaving: (enabled: boolean) => {},
  setShowJsTypeError: (enabled: boolean) => {},
  setCanonicalEventSerialization: (enabled: boolean) => {},
};

const PreferencesContext: React.Context<Preferences> =
  React.createContext<Preferences>(initialPreferences);

export default PreferencesContext;
