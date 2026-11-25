import { type CommandName } from '../CommandPalette/CommandsList';

export type InGameEditorSettings = {
  theme: {
    iconButtonSelectedBackgroundColor: string;
    iconButtonSelectedColor: string;
    toolbarBackgroundColor: string;
    toolbarSeparatorColor: string;
    textColorPrimary: string;
  };
  shortcuts: { [key in CommandName]?: string };
};

export declare const useInGameEditorSettings: () => InGameEditorSettings;
