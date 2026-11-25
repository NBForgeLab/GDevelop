import type { I18n as I18nType } from '@lingui/core';
import type { ElectronUpdateStatus } from './UpdaterTools';
import type {
  FileMetadata,
  FileMetadataAndStorageProviderName,
} from '../ProjectsStorage';
import type { ShortcutMap } from '../KeyboardShortcuts/DefaultShortcuts';
import type {
  MenuDeclarativeItemTemplate,
  MenuItemTemplate,
} from '../UI/Menu/Menu.flow';

export type BuildMainMenuProps = {
  i18n: I18nType;
  project: gdProject | null | undefined;
  canSaveProjectAs: boolean;
  recentProjectFiles: Array<FileMetadataAndStorageProviderName>;
  shortcutMap: ShortcutMap;
  isApplicationTopLevelMenu: boolean;
  hideAskAi: boolean;
};

export type MainMenuCallbacks = {
  onChooseProject: () => void;
  onOpenRecentFile: (
    fileMetadataAndStorageProviderName: FileMetadataAndStorageProviderName
  ) => Promise<void>;
  onSaveProject: () => Promise<FileMetadata | null | undefined>;
  onSaveProjectAs: () => void;
  onShowVersionHistory: () => void;
  onCloseProject: () => Promise<boolean>;
  onCloseApp: () => void;
  onExportProject: () => void;
  onInviteCollaborators: () => void;
  onCreateProject: () => void;
  onOpenProjectManager: (open?: boolean) => void;
  onOpenHomePage: () => void;
  onOpenDebugger: () => void;
  onOpenGlobalSearch: () => void;
  onOpenAbout: (open?: boolean) => void;
  onOpenPreferences: (open?: boolean) => void;
  onOpenLanguage: (open?: boolean) => void;
  onOpenProfile: (open?: boolean) => void;
  onOpenAskAi: () => void;
  onSelectAll: () => void;
  setElectronUpdateStatus: (status: ElectronUpdateStatus) => void;
};

export type MainMenuExtraCallbacks = {
  onClosePreview?: ((windowId: number) => void) | null | undefined;
};

export type MainMenuEvent =
  | 'main-menu-open'
  | 'main-menu-open-recent'
  | 'main-menu-save'
  | 'main-menu-save-as'
  | 'main-menu-show-version-history'
  | 'main-menu-close'
  | 'main-menu-close-app'
  | 'main-menu-export'
  | 'main-menu-invite-collaborators'
  | 'main-menu-create-project'
  | 'main-menu-create-blank'
  | 'main-menu-open-project-manager'
  | 'main-menu-open-home-page'
  | 'main-menu-open-debugger'
  | 'main-menu-open-global-search'
  | 'main-menu-open-about'
  | 'main-menu-open-preferences'
  | 'main-menu-open-language'
  | 'main-menu-open-profile'
  | 'main-menu-open-ask-ai'
  | 'main-menu-select-all'
  | 'update-status';

export declare const buildMainMenuDeclarativeTemplate: (
  props: BuildMainMenuProps
) => Array<MenuDeclarativeItemTemplate>;

export declare const adaptFromDeclarativeTemplate: (
  menuDeclarativeTemplate: Array<MenuDeclarativeItemTemplate>,
  callbacks: MainMenuCallbacks
) => Array<MenuItemTemplate>;
