import * as React from 'react';
import PreferencesContext, {
  initialPreferences,
  type Preferences,
  type AlertMessageIdentifier,
  type EditorStateForProject,
  type EditorStateForProjectUpdate,
  type EditorStateForPropertyPanel,
} from './PreferencesContext';
import optionalRequire from '../../Utils/OptionalRequire';
import { getIDEVersion } from '../../Version';
import {
  type PreferencesValues,
  type EditorMosaicName,
  type ProjectSpecificPreferencesValues,
} from './PreferencesContext';
import type {
  ResourceKind,
  ResourceImportationBehavior,
} from '../../ResourcesList/ResourceSource';
import { type EditorMosaicNode } from '../../UI/EditorMosaic';
import { type FileMetadataAndStorageProviderName } from '../../ProjectsStorage';
import defaultShortcuts from '../../KeyboardShortcuts/DefaultShortcuts';
import { type CommandName } from '../../CommandPalette/CommandsList';
import {
  getBrowserLanguageOrLocale,
  setLanguageInDOM,
  selectLanguageOrLocale,
} from '../../Utils/Language';
import { type GamesDashboardOrderBy } from '../../GameDashboard/GamesList';
import { isWebGL2Supported } from '../../Utils/WebGL';
import {
  CHECK_APP_UPDATES_TIMEOUT,
  PERIODIC_APP_UPDATES_TIMEOUT,
} from '../../Utils/GlobalFetchTimeouts';
const electron = optionalRequire('electron');
const ipcRenderer = electron ? electron.ipcRenderer : null;

type Props = {
  children: React.ReactNode;
  disableCheckForUpdates: boolean;
};

type State = Preferences;

const localStorageItem = 'gd-preferences';

export const loadPreferencesFromLocalStorage = ():
  PreferencesValues | null | undefined => {
  try {
    const persistedState = localStorage.getItem(localStorageItem);
    if (!persistedState) return null;

    const values = JSON.parse(persistedState);

    // "Migrate" non existing properties to their default values
    // (useful when upgrading the preferences to a new version where
    // a new preference was added).
    for (const key in initialPreferences.values) {
      if (
        initialPreferences.values.hasOwnProperty(key) &&
        typeof values[key] === 'undefined'
      ) {
        values[key] = (initialPreferences.values as Record<string, any>)[key];
      }
    }

    // Migrate renamed themes.
    if (values.themeName === 'GDevelop default') {
      values.themeName = 'GDevelop default Light';
    } else if (values.themeName === 'Dark') {
      values.themeName = 'Blue Dark';
    }

    if (typeof values.showDeprecatedInstructionWarning === 'boolean') {
      values.showDeprecatedInstructionWarning =
        values.showDeprecatedInstructionWarning ? 'icon' : 'no';
    }

    // 3D rendering requires WebGL2 (the preference used to only require WebGL1).
    if (values.use3DEditor && !isWebGL2Supported()) {
      values.use3DEditor = false;
    }

    return values;
  } catch {
    return null;
  }
};

export const getInitialPreferences = (): PreferencesValues => {
  let languageOrLocale = 'en';
  const browserLanguageOrLocale = getBrowserLanguageOrLocale();
  if (browserLanguageOrLocale)
    languageOrLocale = selectLanguageOrLocale(
      browserLanguageOrLocale,
      languageOrLocale
    );

  return { ...initialPreferences.values, language: languageOrLocale };
};

const getPreferences = (): PreferencesValues => {
  const preferences =
    loadPreferencesFromLocalStorage() || getInitialPreferences();
  setLanguageInDOM(preferences.language);
  return preferences;
};

export default class PreferencesProvider extends React.Component<Props, State> {
  _periodicUpdateCheckTimeout:
    ReturnType<typeof setTimeout> | null | undefined = null;
  _periodicUpdateCheckInterval:
    ReturnType<typeof setInterval> | null | undefined = null;

  state: State = {
    values: getPreferences(),
    setMultipleValues: this._setMultipleValues.bind(this),
    setLanguage: this._setLanguage.bind(this),
    setThemeName: this._setThemeName.bind(this),
    setCodeEditorThemeName: this._setCodeEditorThemeName.bind(this),
    setAutoDownloadUpdates: this._setAutoDownloadUpdates.bind(this),
    checkUpdates: (forceDownload?: boolean) =>
      this._checkUpdates(forceDownload, true),
    setAutoDisplayChangelog: this._setAutoDisplayChangelog.bind(this),
    showAlertMessage: this._showAlertMessage.bind(this),
    showAllAlertMessages: this._showAllAlertMessages.bind(this),
    showTutorialHint: this._showTutorialHint.bind(this),
    showAllTutorialHints: this._showAllTutorialHints.bind(this),
    showAnnouncement: this._showAnnouncement.bind(this),
    showAllAnnouncements: this._showAllAnnouncements.bind(this),
    showAskAiStandAloneForm: this._showAskAiStandAloneForm.bind(this),
    showAllAskAiStandAloneForms: this._showAllAskAiStandAloneForms.bind(this),
    verifyIfIsNewVersion: this._verifyIfIsNewVersion.bind(this),
    setEventsSheetShowObjectThumbnails:
      this._setEventsSheetShowObjectThumbnails.bind(this),
    setAutosaveOnPreview: this._setAutosaveOnPreview.bind(this),
    setUseGDJSDevelopmentWatcher: this._setUseGDJSDevelopmentWatcher.bind(this),
    setEventsSheetUseAssignmentOperators:
      this._setEventsSheetUseAssignmentOperators.bind(this),
    setEventsSheetIndentScale: this._setEventsSheetIndentScale.bind(this),
    setEventsSheetZoomLevel: this._setEventsSheetZoomLevel.bind(this),
    setShowEffectParameterNames: this._setShowEffectParameterNames.bind(this),
    getLastUsedPath: this._getLastUsedPath.bind(this),
    setLastUsedPath: this._setLastUsedPath.bind(this),
    getDefaultEditorMosaicNode: this._getDefaultEditorMosaicNode.bind(this),
    setDefaultEditorMosaicNode: this._setDefaultEditorMosaicNode.bind(this),
    getRecentProjectFiles: this._getRecentProjectFiles.bind(this),
    insertRecentProjectFile: this._insertRecentProjectFile.bind(this),
    removeRecentProjectFile: this._removeRecentProjectFile.bind(this),
    getAutoOpenMostRecentProject: this._getAutoOpenMostRecentProject.bind(this),
    setAutoOpenMostRecentProject: this._setAutoOpenMostRecentProject.bind(this),
    hadProjectOpenedDuringLastSession:
      this._hadProjectOpenedDuringLastSession.bind(this),
    setHasProjectOpened: this._setHasProjectOpened.bind(this),
    setShortcutForCommand: this._setShortcutForCommand.bind(this),
    resetShortcutsToDefault: this._resetShortcutsToDefault.bind(this),
    getNewObjectDialogDefaultTab: this._getNewObjectDialogDefaultTab.bind(this),
    setNewObjectDialogDefaultTab: this._setNewObjectDialogDefaultTab.bind(this),
    getNewEffectDialogDefaultTab: this._getNewEffectDialogDefaultTab.bind(this),
    setNewEffectDialogDefaultTab: this._setNewEffectDialogDefaultTab.bind(this),
    getShareDialogDefaultTab: this._getShareDialogDefaultTab.bind(this),
    setShareDialogDefaultTab: this._setShareDialogDefaultTab.bind(this),
    getIsMenuBarHiddenInPreview: this._getIsMenuBarHiddenInPreview.bind(this),
    setIsMenuBarHiddenInPreview: this._setIsMenuBarHiddenInPreview.bind(this),
    setBackdropClickBehavior: this._setBackdropClickBehavior.bind(this),
    setResourcesImporationBehavior:
      this._setResourcesImporationBehavior.bind(this),
    getIsAlwaysOnTopInPreview: this._getIsAlwaysOnTopInPreview.bind(this),
    setIsAlwaysOnTopInPreview: this._setIsAlwaysOnTopInPreview.bind(this),
    setEventsSheetCancelInlineParameter:
      this._setEventsSheetCancelInlineParameter.bind(this),
    setShowExperimentalExtensions: this._setShowCommunityExtensions.bind(this),
    setShowCreateSectionByDefault:
      this._setShowCreateSectionByDefault.bind(this),
    setShowInAppTutorialDeveloperMode:
      this._setShowInAppTutorialDeveloperMode.bind(this),
    setOpenDiagnosticReportAutomatically:
      this._setOpenDiagnosticReportAutomatically.bind(this),
    getOpenDiagnosticReportAutomatically:
      this._getOpenDiagnosticReportAutomatically.bind(this),
    setBlockPreviewAndExportOnDiagnosticErrors:
      this._setBlockPreviewAndExportOnDiagnosticErrors.bind(this),
    getBlockPreviewAndExportOnDiagnosticErrors:
      this._getBlockPreviewAndExportOnDiagnosticErrors.bind(this),
    setShowDeprecatedInstructionWarning:
      this._setShowDeprecatedInstructionWarning.bind(this),
    getShowDeprecatedInstructionWarning:
      this._getShowDeprecatedInstructionWarning.bind(this),
    setUse3DEditor: this._setUse3DEditor.bind(this),
    getUse3DEditor: this._getUse3DEditor.bind(this),
    setShowBasicProfilingCounters:
      this._setShowBasicProfilingCounters.bind(this),
    setDisableNpmScriptConfirmation:
      this._setDisableNpmScriptConfirmation.bind(this),
    saveTutorialProgress: this._saveTutorialProgress.bind(this),
    getTutorialProgress: this._getTutorialProgress.bind(this),
    setNewProjectsDefaultFolder: this._setNewProjectsDefaultFolder.bind(this),
    setNewProjectsDefaultStorageProviderName:
      this._setNewProjectsDefaultStorageProviderName.bind(this),
    setUseShortcutToClosePreviewWindow:
      this._setUseShortcutToClosePreviewWindow.bind(this),
    setWatchProjectFolderFilesForLocalProjects:
      this._setWatchProjectFolderFilesForLocalProjects.bind(this),
    setLastClaimableProductsDialogMonth:
      this._setLastClaimableProductsDialogMonth.bind(this),
    setAutoDisplayClaimableProductsDialog:
      this._setAutoDisplayClaimableProductsDialog.bind(this),
    setNewFeaturesAcknowledgements:
      this._setNewFeaturesAcknowledgements.bind(this),
    setDisplaySaveReminder: this._setDisplaySaveReminder.bind(this),
    getEditorStateForProject: this._getEditorStateForProject.bind(this),
    setEditorStateForProject: this._setEditorStateForProject.bind(this),
    setFetchPlayerTokenForPreviewAutomatically:
      this._setFetchPlayerTokenForPreviewAutomatically.bind(this),
    setPreviewCrashReportUploadLevel:
      this._setPreviewCrashReportUploadLevel.bind(this),
    setGamesDashboardOrderBy: this._setGamesDashboardOrderBy.bind(this),
    setTakeScreenshotOnPreview: this._setTakeScreenshotOnPreview.bind(this),
    setGameplayTestFramePosition: this._setGameplayTestFramePosition.bind(this),
    setGameplayTestFrameZoomFactor:
      this._setGameplayTestFrameZoomFactor.bind(this),
    setShowAiAskButtonInTitleBar: this._setShowAiAskButtonInTitleBar.bind(this),
    setAutomaticallyUseCreditsForAiRequests:
      this._setAutomaticallyUseCreditsForAiRequests.bind(this),
    setAutomaticallyApplyAiRequestEditsForProjectId:
      this._setAutomaticallyApplyAiRequestEditsForProjectId.bind(this),
    setUseBackgroundSerializerForSaving:
      this._setUseBackgroundSerializerForSaving.bind(this),
    setShowJsTypeError: this._setShowJsTypeError.bind(this),
    setCanonicalEventSerialization:
      this._setCanonicalEventSerialization.bind(this),
  };

  componentDidMount() {
    this._periodicUpdateCheckTimeout = setTimeout(
      () => this._checkUpdates(),
      CHECK_APP_UPDATES_TIMEOUT
    );
    this._periodicUpdateCheckInterval = setInterval(
      () => this._checkUpdates(),
      PERIODIC_APP_UPDATES_TIMEOUT
    );
  }

  componentWillUnmount() {
    if (this._periodicUpdateCheckTimeout) {
      clearTimeout(this._periodicUpdateCheckTimeout);
    }
    if (this._periodicUpdateCheckInterval) {
      clearInterval(this._periodicUpdateCheckInterval);
    }
  }

  _setMultipleValues(updates: ProjectSpecificPreferencesValues) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          ...updates,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setLanguage(language: string) {
    setLanguageInDOM(language);
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          language,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setEventsSheetShowObjectThumbnails(
    eventsSheetShowObjectThumbnails: boolean
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          eventsSheetShowObjectThumbnails,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutosaveOnPreview(autosaveOnPreview: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          autosaveOnPreview,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _saveTutorialProgress({
    tutorialId,
    userId,
    ...tutorialProgress
  }: {
    tutorialId: string;
    userId: string | null | undefined;
    step: number;
    progress: Array<number>;
    fileMetadataAndStorageProviderName?: FileMetadataAndStorageProviderName;
    projectData: {
      [key: string]: string;
    };
  }) {
    const userIdKey: string = userId || 'anonymous';
    this.setState(
      ({ values }) => {
        return {
          values: {
            ...values,
            inAppTutorialsProgress: {
              ...values.inAppTutorialsProgress,
              [tutorialId]: {
                ...values.inAppTutorialsProgress[tutorialId],
                [userIdKey]: tutorialProgress,
              },
            },
          },
        };
      },
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getTutorialProgress({
    tutorialId,
    userId,
  }: {
    tutorialId: string;
    userId: string | null | undefined;
  }): PreferencesValues['inAppTutorialsProgress'][string][string] | undefined {
    const userIdKey: string = userId || 'anonymous';
    const tutorialProgresses =
      this.state.values.inAppTutorialsProgress[tutorialId];
    if (!tutorialProgresses) return undefined;
    return tutorialProgresses[userIdKey];
  }

  _setUseGDJSDevelopmentWatcher(useGDJSDevelopmentWatcher: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          useGDJSDevelopmentWatcher,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setEventsSheetUseAssignmentOperators(
    eventsSheetUseAssignmentOperators: boolean
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          eventsSheetUseAssignmentOperators,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setEventsSheetIndentScale(eventsSheetIndentScale: number) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          eventsSheetIndentScale,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setEventsSheetZoomLevel(eventsSheetZoomLevel: number) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          eventsSheetZoomLevel,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setShowEffectParameterNames(showEffectParameterNames: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          showEffectParameterNames,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setShowCreateSectionByDefault(showCreateSectionByDefault: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          showCreateSectionByDefault,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setThemeName(themeName: string) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          themeName,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setCodeEditorThemeName(codeEditorThemeName: string) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          codeEditorThemeName,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutoDownloadUpdates(autoDownloadUpdates: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          autoDownloadUpdates,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutoDisplayChangelog(autoDisplayChangelog: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          autoDisplayChangelog,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setEventsSheetCancelInlineParameter(
    eventsSheetCancelInlineParameter: 'apply' | 'cancel'
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          eventsSheetCancelInlineParameter,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setUseShortcutToClosePreviewWindow(
    useShortcutToClosePreviewWindow: boolean
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          useShortcutToClosePreviewWindow,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setShowCommunityExtensions(showExperimentalExtensions: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          showExperimentalExtensions,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setShowInAppTutorialDeveloperMode(showInAppTutorialDeveloperMode: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          showInAppTutorialDeveloperMode,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setOpenDiagnosticReportAutomatically(
    openDiagnosticReportAutomatically: boolean
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          openDiagnosticReportAutomatically,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getOpenDiagnosticReportAutomatically(): boolean {
    return this.state.values.openDiagnosticReportAutomatically;
  }

  _setBlockPreviewAndExportOnDiagnosticErrors(
    blockPreviewAndExportOnDiagnosticErrors: boolean
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          blockPreviewAndExportOnDiagnosticErrors,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getBlockPreviewAndExportOnDiagnosticErrors(): boolean {
    return this.state.values.blockPreviewAndExportOnDiagnosticErrors;
  }

  _setShowDeprecatedInstructionWarning(
    showDeprecatedInstructionWarning:
      'no' | 'icon' | 'icon-and-deprecated-warning-text'
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          showDeprecatedInstructionWarning,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getShowDeprecatedInstructionWarning():
    'no' | 'icon' | 'icon-and-deprecated-warning-text' {
    return this.state.values.showDeprecatedInstructionWarning;
  }

  _setUse3DEditor(use3DEditor: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          use3DEditor,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getUse3DEditor(): boolean {
    return this.state.values.use3DEditor;
  }

  _setShowBasicProfilingCounters(showBasicProfilingCounters: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          showBasicProfilingCounters,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setDisableNpmScriptConfirmation(disableNpmScriptConfirmation: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          disableNpmScriptConfirmation,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _checkUpdates(forceDownload?: boolean, explicit?: boolean) {
    // Checking for updates is only done on Electron.
    // Note: This could be abstracted away later if other updates mechanisms
    // should be supported.
    const { disableCheckForUpdates } = this.props;
    if (!ipcRenderer || disableCheckForUpdates) return;

    if (!!forceDownload || this.state.values.autoDownloadUpdates) {
      ipcRenderer.send('updates-check-and-download', { explicit: !!explicit });
    } else {
      ipcRenderer.send('updates-check', { explicit: !!explicit });
    }
  }

  _verifyIfIsNewVersion(): boolean {
    const currentVersion = getIDEVersion();
    const { lastLaunchedVersion } = this.state.values;
    if (lastLaunchedVersion === currentVersion) {
      // This is not a new version
      return false;
    }

    // This is a new version: store the version number
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          lastLaunchedVersion: currentVersion,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );

    if (lastLaunchedVersion === undefined) {
      // This is the first time GDevelop is launched, don't
      // warn about this version being new.
      return false;
    }

    return true;
  }

  _showAlertMessage(identifier: AlertMessageIdentifier, show: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hiddenAlertMessages: {
            ...state.values.hiddenAlertMessages,
            // Flow won't typecheck this because of https://medium.com/flow-type/spreads-common-errors-fixes-9701012e9d58
            [identifier]: !show,
          },
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _showAllAlertMessages() {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hiddenAlertMessages: {},
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _showTutorialHint(identifier: string, show: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hiddenTutorialHints: {
            ...state.values.hiddenTutorialHints,
            [identifier]: !show,
          },
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _showAllTutorialHints() {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hiddenTutorialHints: {},
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _showAnnouncement(identifier: string, show: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hiddenAnnouncements: {
            ...state.values.hiddenAnnouncements,
            [identifier]: !show,
          },
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _showAllAnnouncements() {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hiddenAnnouncements: {},
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _showAskAiStandAloneForm(identifier: string, show: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hiddenAskAiStandAloneForms: {
            ...state.values.hiddenAskAiStandAloneForms,
            [identifier]: !show,
          },
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _showAllAskAiStandAloneForms() {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hiddenAskAiStandAloneForms: {},
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _persistValuesToLocalStorage(preferences: Preferences): Preferences {
    try {
      localStorage.setItem(
        localStorageItem,
        JSON.stringify(preferences.values)
      );
    } catch (e) {
      console.warn('Unable to persist preferences', e);
    }

    return preferences;
  }

  _getLastUsedPath(project: gdProject, kind: ResourceKind): string {
    const projectPath = project.getProjectFile();
    const { values } = this.state;
    const projectPaths = values.projectLastUsedPaths[projectPath];
    if (projectPaths && projectPaths[kind]) {
      return projectPaths[kind] || '';
    }
    return '';
  }

  _setLastUsedPath(project: gdProject, kind: ResourceKind, latestPath: string) {
    const projectPath = project.getProjectFile();

    const { values } = this.state;
    const newProjectLastUsedPaths =
      values.projectLastUsedPaths[projectPath] || {};
    newProjectLastUsedPaths[kind] = latestPath;

    this.setState(
      {
        values: {
          ...values,
          projectLastUsedPaths: {
            ...values.projectLastUsedPaths,
            [projectPath]: newProjectLastUsedPaths,
          },
        },
      },
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getDefaultEditorMosaicNode(
    name: EditorMosaicName
  ): EditorMosaicNode | null | undefined {
    return this.state.values.defaultEditorMosaicNodes[name] || null;
  }

  _setDefaultEditorMosaicNode(
    name: EditorMosaicName,
    node: EditorMosaicNode | null | undefined
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          defaultEditorMosaicNodes: {
            ...state.values.defaultEditorMosaicNodes,
            // Flow errors on unions in computed properties
            [name]: node,
          },
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getRecentProjectFiles(
    options?:
      | {
          limit: number;
        }
      | null
      | undefined
  ): Array<FileMetadataAndStorageProviderName> {
    const limit = options ? options.limit : undefined;
    const recentProjectFiles = this.state.values.recentProjectFiles;
    return limit ? recentProjectFiles.slice(0, limit) : recentProjectFiles;
  }

  _setRecentProjectFiles(recents: Array<FileMetadataAndStorageProviderName>) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          recentProjectFiles: recents,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _insertRecentProjectFile(newRecentFile: FileMetadataAndStorageProviderName) {
    // Do not store recent project in preferences as they will be accessible only from user account.
    if (newRecentFile.storageProviderName === 'Cloud') return;

    let recentProjectFiles = this._getRecentProjectFiles();
    const isNotNewRecentFile = (
      recentFile: FileMetadataAndStorageProviderName
    ) =>
      recentFile.fileMetadata.fileIdentifier !==
      newRecentFile.fileMetadata.fileIdentifier;
    this._setRecentProjectFiles([
      newRecentFile,
      ...recentProjectFiles.filter(isNotNewRecentFile),
    ]);
  }

  _removeRecentProjectFile(recentFile: FileMetadataAndStorageProviderName) {
    const isNotRemovedRecentFile = (
      recentFileItem: FileMetadataAndStorageProviderName
    ) =>
      recentFileItem.fileMetadata.fileIdentifier !==
      recentFile.fileMetadata.fileIdentifier;
    this._setRecentProjectFiles([
      ...this._getRecentProjectFiles().filter(isNotRemovedRecentFile),
    ]);
  }

  _getAutoOpenMostRecentProject(): boolean {
    return this.state.values.autoOpenMostRecentProject;
  }

  _setAutoOpenMostRecentProject(enabled: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          autoOpenMostRecentProject: enabled,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _hadProjectOpenedDuringLastSession(): boolean {
    return this.state.values.hasProjectOpened;
  }

  _setHasProjectOpened(enabled: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          hasProjectOpened: enabled,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _resetShortcutsToDefault() {
    this.setState(
      (state) => ({
        values: { ...state.values, userShortcutMap: {} },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setShortcutForCommand(commandName: CommandName, shortcutString: string) {
    const defaultShortcut = defaultShortcuts[commandName] || '';
    const setToDefault = defaultShortcut === shortcutString;

    const updatedShortcutMap = { ...this.state.values.userShortcutMap };
    if (setToDefault) delete updatedShortcutMap[commandName];
    else updatedShortcutMap[commandName] = shortcutString;

    this.setState(
      (state) => ({
        values: { ...state.values, userShortcutMap: updatedShortcutMap },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getNewObjectDialogDefaultTab(): 'asset-store' | 'new-object' {
    return this.state.values.newObjectDialogDefaultTab;
  }

  _setNewObjectDialogDefaultTab(
    newObjectDialogDefaultTab: 'asset-store' | 'new-object'
  ) {
    this.setState(
      (state) => ({
        values: { ...state.values, newObjectDialogDefaultTab },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getNewEffectDialogDefaultTab(): 'asset-store' | 'from-scratch' {
    return this.state.values.newEffectDialogDefaultTab;
  }

  _setNewEffectDialogDefaultTab(
    newEffectDialogDefaultTab: 'asset-store' | 'from-scratch'
  ) {
    this.setState(
      (state) => ({
        values: { ...state.values, newEffectDialogDefaultTab },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getShareDialogDefaultTab(): 'invite' | 'publish' {
    return this.state.values.shareDialogDefaultTab;
  }

  _setShareDialogDefaultTab(shareDialogDefaultTab: 'invite' | 'publish') {
    this.setState(
      (state) => ({
        values: { ...state.values, shareDialogDefaultTab },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getIsMenuBarHiddenInPreview(): boolean {
    return this.state.values.isMenuBarHiddenInPreview;
  }

  _setIsMenuBarHiddenInPreview(enabled: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          isMenuBarHiddenInPreview: enabled,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setBackdropClickBehavior(
    backdropClickBehavior: 'nothing' | 'apply' | 'cancel'
  ) {
    this.setState(
      (state) => ({
        values: { ...state.values, backdropClickBehavior },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setResourcesImporationBehavior(
    resourcesImporationBehavior: ResourceImportationBehavior
  ) {
    this.setState(
      (state) => ({
        values: { ...state.values, resourcesImporationBehavior },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getIsAlwaysOnTopInPreview(): boolean {
    return this.state.values.isAlwaysOnTopInPreview;
  }

  _setIsAlwaysOnTopInPreview(enabled: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          isAlwaysOnTopInPreview: enabled,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setNewProjectsDefaultFolder(newProjectsDefaultFolder: string) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          newProjectsDefaultFolder,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setNewProjectsDefaultStorageProviderName(newStorageProviderName: string) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          newProjectsDefaultStorageProviderName: newStorageProviderName,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setWatchProjectFolderFilesForLocalProjects(enable: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          watchProjectFolderFilesForLocalProjects: enable,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutoDisplayClaimableProductsDialog(
    autoDisplayClaimableProductsDialog: boolean
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          autoDisplayClaimableProductsDialog,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setLastClaimableProductsDialogMonth(month: string) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          lastClaimableProductsDialogMonth: month,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setNewFeaturesAcknowledgements(newFeaturesAcknowledgements: {
    [featureId: string]: {
      dates: Array<number>;
    };
  }) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          newFeaturesAcknowledgements,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setDisplaySaveReminder(newValue: { activated: boolean }) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          displaySaveReminder: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setUseBackgroundSerializerForSaving(newValue: boolean) {
    this.setState(
      (state) => ({
        values: { ...state.values, useBackgroundSerializerForSaving: newValue },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setShowJsTypeError(newValue: boolean) {
    this.setState(
      (state) => ({
        values: { ...state.values, showJsTypeError: newValue },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setCanonicalEventSerialization(newValue: boolean) {
    this.setState(
      (state) => ({
        values: { ...state.values, canonicalEventSerialization: newValue },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _getEditorStateForProject(
    projectId: string
  ): EditorStateForProject | null | undefined {
    const editorState = this.state.values.editorStateByProject[projectId];
    if (!editorState) return null;

    const defaultState: EditorStateForPropertyPanel = {
      scrollPosition: 0,
      collapsedSections: {},
    };
    for (const panelType in editorState.propertiesPanel) {
      const states = editorState.propertiesPanel[panelType];
      for (const id in states) {
        states[id] = {
          ...defaultState,
          ...states[id],
        };
      }
    }

    return {
      editorTabs:
        editorState.editorTabs == null ? null : editorState.editorTabs,
      propertiesPanel: editorState.propertiesPanel || {},
    };
  }

  _setEditorStateForProject(
    projectId: string,
    editorState: EditorStateForProjectUpdate | null
  ) {
    this.setState(
      (state) => {
        const nextEditorStateByProject = {
          ...state.values.editorStateByProject,
        };

        if (editorState === null) {
          delete nextEditorStateByProject[projectId];
        } else {
          const previousEditorState = state.values.editorStateByProject[
            projectId
          ] || {
            editorTabs: null,
            propertiesPanel: {},
          };
          const mergedEditorState: EditorStateForProject = {
            ...previousEditorState,
            ...editorState,
          };

          nextEditorStateByProject[projectId] = mergedEditorState;
        }

        return {
          values: {
            ...state.values,
            editorStateByProject: nextEditorStateByProject,
          },
        };
      },
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setFetchPlayerTokenForPreviewAutomatically(newValue: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          fetchPlayerTokenForPreviewAutomatically: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setPreviewCrashReportUploadLevel(newValue: string) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          previewCrashReportUploadLevel: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setGamesDashboardOrderBy(newValue: GamesDashboardOrderBy) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          gamesDashboardOrderBy: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setTakeScreenshotOnPreview(newValue: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          takeScreenshotOnPreview: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setGameplayTestFramePosition(newValue: { left: number; bottom: number }) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          gameplayTestFramePosition: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setGameplayTestFrameZoomFactor(newValue: number) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          gameplayTestFrameZoomFactor: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setShowAiAskButtonInTitleBar(newValue: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          showAiAskButtonInTitleBar: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutomaticallyUseCreditsForAiRequests(newValue: boolean) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          automaticallyUseCreditsForAiRequests: newValue,
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  _setAutomaticallyApplyAiRequestEditsForProjectId(
    projectId: string,
    newValue: boolean
  ) {
    this.setState(
      (state) => ({
        values: {
          ...state.values,
          automaticallyApplyAiRequestEditsByProjectId: {
            ...state.values.automaticallyApplyAiRequestEditsByProjectId,
            [projectId]: newValue,
          },
        },
      }),
      () => this._persistValuesToLocalStorage(this.state)
    );
  }

  render(): React.ReactNode {
    return (
      <PreferencesContext.Provider value={this.state}>
        {this.props.children}
      </PreferencesContext.Provider>
    );
  }
}
