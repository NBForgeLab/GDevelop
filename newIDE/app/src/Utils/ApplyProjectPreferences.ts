import {
  type Preferences,
  type PreferencesValues,
} from '../MainFrame/Preferences/PreferencesContext';
import { type CommandName } from '../CommandPalette/CommandsList';
import { type ParsedProjectSettings } from './ProjectSettingsReader';

type ProjectSpecificPreferencesValues = Partial<PreferencesValues>;

/** Allowlist of preference keys that can be overridden per-project. */
const allowedPreferenceKeys: ReadonlyArray<
  Extract<keyof ProjectSpecificPreferencesValues, string>
> = [
  'language',
  'autoDownloadUpdates',
  'themeName',
  'codeEditorThemeName',
  'autoDisplayChangelog',
  'lastLaunchedVersion',
  'eventsSheetShowObjectThumbnails',
  'autosaveOnPreview',
  'useGDJSDevelopmentWatcher',
  'eventsSheetUseAssignmentOperators',
  'eventsSheetIndentScale',
  'eventsSheetZoomLevel',
  'showEffectParameterNames',
  'autoOpenMostRecentProject',
  'hasProjectOpened',
  'newObjectDialogDefaultTab',
  'newEffectDialogDefaultTab',
  'shareDialogDefaultTab',
  'isMenuBarHiddenInPreview',
  'isAlwaysOnTopInPreview',
  'backdropClickBehavior',
  'eventsSheetCancelInlineParameter',
  'showExperimentalExtensions',
  'showCreateSectionByDefault',
  'showInAppTutorialDeveloperMode',
  'showDeprecatedInstructionWarning',
  'openDiagnosticReportAutomatically',
  'blockPreviewAndExportOnDiagnosticErrors',
  'use3DEditor',
  'showBasicProfilingCounters',
  'newProjectsDefaultFolder',
  'newProjectsDefaultStorageProviderName',
  'useShortcutToClosePreviewWindow',
  'watchProjectFolderFilesForLocalProjects',
  'fetchPlayerTokenForPreviewAutomatically',
  'previewCrashReportUploadLevel',
  'takeScreenshotOnPreview',
  'showAiAskButtonInTitleBar',
  'automaticallyUseCreditsForAiRequests',
  'canonicalEventSerialization',
];

const allowedPreferences: Set<string> = new Set(allowedPreferenceKeys);

/**
 * Filters parsed preferences to only include allowed keys.
 */
export const filterAllowedPreferences = (parsedPreferences: {
  [key: string]: boolean | string | number;
}): ProjectSpecificPreferencesValues => {
  const filtered: ProjectSpecificPreferencesValues = {};

  for (const [key, value] of Object.entries(parsedPreferences)) {
    if (allowedPreferences.has(key)) {
      filtered[key] = value;
    }
  }

  return filtered;
};

/** Normalize legacy boolean to enum for preferences that were changed from boolean to enum. */
const normalizeDeprecatedInstructionWarning = (
  value: boolean | string
): 'no' | 'icon' | 'icon-and-deprecated-warning-text' => {
  if (typeof value === 'boolean') {
    return value ? 'icon' : 'no';
  }
  if (
    value === 'no' ||
    value === 'icon' ||
    value === 'icon-and-deprecated-warning-text'
  ) {
    return value;
  }
  return 'no';
};

/**
 * Applies project-specific preferences and shortcuts from a gdevelop-settings.yaml file to the editor.
 */
export const applyProjectPreferences = (
  parsedProjectSettings: ParsedProjectSettings,
  preferences: Preferences
): void => {
  const rawPreferences = parsedProjectSettings.preferences;
  if (rawPreferences) {
    const filtered = filterAllowedPreferences(rawPreferences);
    if (
      Object.prototype.hasOwnProperty.call(
        filtered,
        'showDeprecatedInstructionWarning'
      )
    ) {
      filtered.showDeprecatedInstructionWarning =
        normalizeDeprecatedInstructionWarning(
          filtered.showDeprecatedInstructionWarning
        );
    }
    preferences.setMultipleValues(filtered);
  }

  if (parsedProjectSettings.shortcuts) {
    const shortcuts = parsedProjectSettings.shortcuts;
    for (const key of Object.keys(shortcuts)) {
      const commandName = key as CommandName;
      preferences.setShortcutForCommand(commandName, shortcuts[key]);
    }
  }
};
