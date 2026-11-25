import type { EditorTabsState } from './EditorTabs/EditorTabsHandler';
import type { ElectronUpdateStatus } from './UpdaterTools';
import type { FileMetadata } from '../ProjectsStorage';
import type { ToolbarButtonConfig } from './CustomToolbarButton';

export type State = {
  currentProject: gdProject | null | undefined;
  currentFileMetadata: FileMetadata | null | undefined;
  editorTabs: EditorTabsState;
  snackMessage: string;
  snackMessageOpen: boolean;
  snackDuration: number | null | undefined;
  updateStatus: ElectronUpdateStatus;
  openFromStorageProviderDialogOpen: boolean;
  saveToStorageProviderDialogOpen: boolean;
  gdjsDevelopmentWatcherEnabled: boolean;
  toolbarButtons: Array<ToolbarButtonConfig>;
};
