import * as React from 'react';
import type {
  RenderEditorContainerPropsWithRef,
  EditorContainerExtraProps,
} from '../EditorContainers/BaseEditor';
import type { HTMLDataset } from '../../Utils/HTMLDataset';

type TabOptions = {
  data?: HTMLDataset;
};

export type EditorKind =
  | 'layout'
  | 'layout events'
  | 'external layout'
  | 'external events'
  | 'events functions extension'
  | 'custom object'
  | 'gameplay-test'
  | 'debugger'
  | 'resources'
  | 'global-search'
  | 'ask-ai'
  | 'start page';

export type EditorTab = {
  kind: EditorKind;
  renderEditorContainer: (
    props: RenderEditorContainerPropsWithRef
  ) => React.ReactNode;
  editorRef: any;
  label?: string;
  icon?: React.ReactNode;
  renderCustomIcon:
    | ((brightness: number) => React.ReactNode)
    | null
    | undefined;
  tabOptions?: TabOptions;
  projectItemName: string | null | undefined;
  key: string;
  id: string;
  extraEditorProps: EditorContainerExtraProps | null | undefined;
  closable: boolean;
  originalPaneIdentifier?: string;
};

export type EditorTabsState = {
  panes: {
    [paneIdentifier: string]: {
      editors: Array<EditorTab>;
      currentTab: number;
    };
  };
};

export declare const getCurrentTabForPane: (
  state: EditorTabsState,
  paneIdentifier: string
) => EditorTab | null;
