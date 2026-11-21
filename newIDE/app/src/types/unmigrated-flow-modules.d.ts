/**
 * Wildcard ambient typings for unmigrated Flow modules and static assets.
 * Allows migrated TypeScript files to import unmigrated Flow subsystems as 'any'.
 * As modules are migrated to TypeScript, these wildcard declarations are superseded by real types.
 */

// Visual editors and major panels
declare module '*/MainFrame' {
  const content: any;
  export default content;
}
declare module '*/MainFrame/*' {
  export const getInitialPreferences: any;
  export const loadPreferencesFromLocalStorage: any;
  export type AlertMessageIdentifier = string;
  const content: any;
  export default content;
}
declare module '*/SceneEditor' {
  const content: any;
  export default content;
}
declare module '*/SceneEditor/*' {
  const content: any;
  export default content;
}
declare module '*/EventsSheet' {
  const content: any;
  export default content;
}
declare module '*/EventsSheet/*' {
  const content: any;
  export default content;
}
declare module '*/AssetStore' {
  const content: any;
  export default content;
}
declare module '*/AssetStore/*' {
  const content: any;
  export default content;
}
declare module '*/ObjectEditor' {
  const content: any;
  export default content;
}
declare module '*/ObjectEditor/*' {
  const content: any;
  export default content;
}
declare module '*/ExportAndShare' {
  const content: any;
  export default content;
}
declare module '*/ExportAndShare/*' {
  const content: any;
  export default content;
}
declare module '*/InstancesEditor' {
  const content: any;
  export default content;
}
declare module '*/InstancesEditor/*' {
  const content: any;
  export default content;
}
declare module '*/GameDashboard' {
  const content: any;
  export default content;
}
declare module '*/GameDashboard/*' {
  const content: any;
  export default content;
}
declare module '*/Debugger' {
  const content: any;
  export default content;
}
declare module '*/Debugger/*' {
  const content: any;
  export default content;
}
declare module '*/AiGeneration' {
  const content: any;
  export default content;
}
declare module '*/AiGeneration/*' {
  const content: any;
  export default content;
}
declare module '*/BehaviorsEditor' {
  const content: any;
  export default content;
}
declare module '*/BehaviorsEditor/*' {
  const content: any;
  export default content;
}
declare module '*/ResourcesList' {
  const content: any;
  export default content;
}
declare module '*/ResourcesList/*' {
  const content: any;
  export default content;
}
declare module '*/VariablesList' {
  const content: any;
  export default content;
}
declare module '*/VariablesList/*' {
  const content: any;
  export default content;
}
declare module '*/PropertiesEditor' {
  const content: any;
  export default content;
}
declare module '*/PropertiesEditor/*' {
  const content: any;
  export default content;
}
declare module '*/EditorFunctions' {
  const content: any;
  export default content;
}
declare module '*/EditorFunctions/*' {
  const content: any;
  export default content;
}
declare module '*/Analytics/*' {
  const content: any;
  export const sendErrorMessage: any;
  export default content;
}
declare module './Analytics/*' {
  const content: any;
  export const sendErrorMessage: any;
  export default content;
}
declare module '*/GDevelopServices/*' {
  const content: any;
  export const addGDevelopResourceJwtTokenToUrl: (url: string) => string;
  export default content;
}
declare module './GDevelopServices/*' {
  const content: any;
  export const addGDevelopResourceJwtTokenToUrl: (url: string) => string;
  export default content;
}

declare module 'slugs' {
  function slugs(str: string, separator?: string): string;
  export default slugs;
}

declare module '*/locales/LocalesMetadata' {
  export interface LocaleMetadata {
    languageCode: string;
    languageName: string;
    languageNativeName: string;
    translationRatio: number;
  }
  const content: LocaleMetadata[];
  export default content;
}

declare module '@lingui/macro' {
  import * as React from 'react';
  export const Trans: React.ComponentType<any>;
  export const t: (strings: TemplateStringsArray, ...values: any[]) => string;
}

declare module '@lingui/core' {
  export type I18n = any;
  const content: any;
  export default content;
}

declare module '*/Menu/Menu.flow' {
  export type MenuItemTemplate =
    | {
        id?: string;
        label: string;
        visible?: boolean;
        enabled?: boolean;
        disabled?: boolean;
        click?: (() => void | Promise<void>) | null;
        accelerator?: string;
      }
    | {
        id?: string;
        label: string;
        submenu: Array<MenuItemTemplate>;
      }
    | {
        id?: string;
        type: 'checkbox';
        label: string;
        visible?: boolean;
        enabled?: boolean;
        checked: boolean;
        click?: (() => void | Promise<void>) | null;
      }
    | {
        type: 'separator';
      };
  const content: any;
  export default content;
}
declare module './Menu/Menu.flow' {
  export type MenuItemTemplate =
    | {
        id?: string;
        label: string;
        visible?: boolean;
        enabled?: boolean;
        disabled?: boolean;
        click?: (() => void | Promise<void>) | null;
        accelerator?: string;
      }
    | {
        id?: string;
        label: string;
        submenu: Array<MenuItemTemplate>;
      }
    | {
        id?: string;
        type: 'checkbox';
        label: string;
        visible?: boolean;
        enabled?: boolean;
        checked: boolean;
        click?: (() => void | Promise<void>) | null;
      }
    | {
        type: 'separator';
      };
  const content: any;
  export default content;
}

declare module '*/Responsive/ResponsiveWindowMeasurer' {
  export type WindowSizeType = 'small' | 'medium' | 'large' | 'xlarge';
  export interface WindowSize {
    windowSize: WindowSizeType;
    isMobile: boolean;
    isMediumScreen: boolean;
    isLandscape: boolean;
  }
  export const useResponsiveWindowSize: () => WindowSize;
  const content: any;
  export default content;
}
declare module './Responsive/ResponsiveWindowMeasurer' {
  export type WindowSizeType = 'small' | 'medium' | 'large' | 'xlarge';
  export interface WindowSize {
    windowSize: WindowSizeType;
    isMobile: boolean;
    isMediumScreen: boolean;
    isLandscape: boolean;
  }
  export const useResponsiveWindowSize: () => WindowSize;
  const content: any;
  export default content;
}

declare module '*/UI/IconButton' {
  const content: any;
  export default content;
}
declare module '../IconButton' {
  const content: any;
  export default content;
}
declare module './IconButton' {
  const content: any;
  export default content;
}
declare module '*/Utils/HelpLink' {
  export const getHelpLink: (path: string) => string;
  const content: any;
  export default content;
}
declare module '../../Utils/HelpLink' {
  export const getHelpLink: (path: string) => string;
  const content: any;
  export default content;
}
declare module '*/Utils/Window' {
  const content: any;
  export default content;
}
declare module '../../Utils/Window' {
  const content: any;
  export default content;
}
declare module '*/UI/Text' {
  const content: any;
  export default content;
}
declare module './Text' {
  const content: any;
  export default content;
}
declare module '*/UI/Paper' {
  const content: any;
  export default content;
}
declare module './Paper' {
  const content: any;
  export default content;
}
declare module '*/UI/Theme/GDevelopThemeContext' {
  const content: any;
  export default content;
}
declare module './Theme/GDevelopThemeContext' {
  const content: any;
  export default content;
}

declare module '*/UI/Alert/useAlertDialog' {
  export interface ConfirmOptions {
    title: any;
    message: any;
    confirmButtonLabel?: any;
    dismissButtonLabel?: any;
  }
  const useAlertDialog: () => {
    showAlert: (options: any) => Promise<void>;
    showConfirmation: (options: ConfirmOptions) => Promise<boolean>;
    showDeleteConfirmation: (options: any) => Promise<boolean>;
    showYesNoCancel: (options: any) => Promise<boolean>;
  };
  export default useAlertDialog;
}
declare module './Alert/useAlertDialog' {
  export interface ConfirmOptions {
    title: any;
    message: any;
    confirmButtonLabel?: any;
    dismissButtonLabel?: any;
  }
  const useAlertDialog: () => {
    showAlert: (options: any) => Promise<void>;
    showConfirmation: (options: ConfirmOptions) => Promise<boolean>;
    showDeleteConfirmation: (options: any) => Promise<boolean>;
    showYesNoCancel: (options: any) => Promise<boolean>;
  };
  export default useAlertDialog;
}

declare module '*/UI/RaisedButton' {
  const content: any;
  export default content;
}
declare module '../UI/RaisedButton' {
  const content: any;
  export default content;
}
declare module './RaisedButton' {
  const content: any;
  export default content;
}
declare module '*/UI/FlatButton' {
  const content: any;
  export default content;
}
declare module '../UI/FlatButton' {
  const content: any;
  export default content;
}
declare module './FlatButton' {
  const content: any;
  export default content;
}
declare module '*/UI/HelpButton' {
  const content: any;
  export default content;
}
declare module '../UI/HelpButton' {
  const content: any;
  export default content;
}
declare module './HelpButton' {
  const content: any;
  export default content;
}
declare module '*/UI/TutorialButton' {
  const content: any;
  export default content;
}
declare module './TutorialButton' {
  const content: any;
  export default content;
}
declare module '*/UI/CircularProgress' {
  const content: any;
  export default content;
}
declare module './CircularProgress' {
  const content: any;
  export default content;
}
declare module '*/UI/RaisedButtonWithSplitMenu' {
  const content: any;
  export default content;
}
declare module './RaisedButtonWithSplitMenu' {
  const content: any;
  export default content;
}

// Media and static assets
declare module '*.svg' {
  const content: any;
  export default content;
}
declare module '*.png' {
  const content: string;
  export default content;
}
declare module '*.jpg' {
  const content: string;
  export default content;
}
declare module '*.css' {
  const content: { [className: string]: string };
  export default content;
}

// Test libraries
declare module 'react-test-renderer' {
  export const act: (callback: () => void | Promise<void>) => any;
  const content: any;
  export default content;
}
declare module 'react-measure' {
  const content: any;
  export default content;
}

