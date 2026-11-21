import * as React from 'react';

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
  | 'slow-graphics-rendering'
  | (string & {});

export interface PreferencesValues {
  hiddenAlertMessages: { [identifier: string]: boolean };
  [key: string]: any;
}

export interface Preferences {
  values: PreferencesValues;
  showAlertMessage: (identifier: AlertMessageIdentifier, show: boolean) => void;
  [key: string]: any;
}

declare const PreferencesContext: React.Context<Preferences>;
export default PreferencesContext;
