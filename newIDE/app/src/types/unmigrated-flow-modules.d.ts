// Ambient typings for unmigrated top-level Flow subsystems, untyped third-party
// packages, and static assets.
//
// NOTE: TypeScript only allows at most a single `*` wildcard in ambient module
// names (no double-wildcard `*/Foo/*` patterns - TS5061) and forbids relative
// specifiers (`./` or `../` - TS2436). For individual unmigrated Flow modules
// imported by TypeScript files, author a companion `.d.ts` file next to the
// `.js` module instead of adding entries here.

// Top-level unmigrated Flow directory entrypoints (single wildcard only)
declare module '*/MainFrame' {
  const content: any;
  export default content;
}
declare module '*/SceneEditor' {
  const content: any;
  export default content;
}
declare module '*/EventsSheet' {
  const content: any;
  export default content;
}
declare module '*/AssetStore' {
  const content: any;
  export default content;
}
declare module '*/ObjectEditor' {
  const content: any;
  export default content;
}
declare module '*/ExportAndShare' {
  const content: any;
  export default content;
}
declare module '*/InstancesEditor' {
  const content: any;
  export default content;
}
declare module '*/GameDashboard' {
  const content: any;
  export default content;
}
declare module '*/Debugger' {
  const content: any;
  export default content;
}
declare module '*/AiGeneration' {
  const content: any;
  export default content;
}
declare module '*/BehaviorsEditor' {
  const content: any;
  export default content;
}
declare module '*/ResourcesList' {
  const content: any;
  export default content;
}
declare module '*/VariablesList' {
  const content: any;
  export default content;
}
declare module '*/PropertiesEditor' {
  const content: any;
  export default content;
}
declare module '*/EditorFunctions' {
  const content: any;
  export default content;
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

// Untyped third-party npm packages
declare module 'slugs' {
  function slugs(str: string, separator?: string): string;
  export default slugs;
}

declare module '@lingui/macro' {
  import * as React from 'react';
  export const Trans: React.ComponentType<any>;
  export const t: (strings: TemplateStringsArray, ...values: any[]) => string;
}

declare module '@lingui/core' {
  export type I18n = any;
  export const setupI18n: (config?: any) => I18n;
  const content: any;
  export default content;
}

declare module 'fontfaceobserver' {
  export default class FontFaceObserver {
    constructor(fontFamily: string, descriptors?: Record<string, any>);
    load(text?: string | null, timeout?: number): Promise<void>;
  }
}

declare module 'url-search-params' {
  const URLSearchParamsCtor: typeof globalThis.URLSearchParams;
  export default URLSearchParamsCtor;
}

declare module 'path-browserify' {
  import type * as path from 'path';
  const pathBrowserify: typeof path;
  export default pathBrowserify;
}

declare module '@lingui/react' {
  import * as React from 'react';
  export const I18n: React.ComponentType<{
    children: (args: { i18n: any }) => React.ReactNode;
  }>;
  export const I18nProvider: React.ComponentType<any>;
}

declare module 'classnames' {
  type ClassValue =
    | string
    | number
    | boolean
    | undefined
    | null
    | { [id: string]: any }
    | ClassValue[];
  function classNames(...args: ClassValue[]): string;
  export default classNames;
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

// Test and UI libraries without bundled TypeScript declarations
declare module 'react-test-renderer' {
  export const act: (callback: () => void | Promise<void>) => any;
  const content: any;
  export default content;
}
declare module 'react-measure' {
  const content: any;
  export default content;
}
declare module 'js-worker-search' {
  export default class SearchApi {
    constructor(options?: Record<string, any>);
    indexDocument(uid: string, text: string): void;
    search(query: string): Promise<Array<string>>;
  }
}
declare module 'react-color' {
  import * as React from 'react';
  export const SketchPicker: React.ComponentType<any>;
  export const ChromePicker: React.ComponentType<any>;
  export type ColorResult = any;
}
declare module 'react-virtualized' {
  import * as React from 'react';
  export const AutoSizer: React.ComponentType<any>;
  export const Grid: React.ComponentType<any>;
  export const List: React.ComponentType<any>;
  export const Table: React.ComponentType<any>;
  export const Column: React.ComponentType<any>;
  export const CellMeasurer: React.ComponentType<any>;
  export const CellMeasurerCache: any;
  export const WindowScroller: React.ComponentType<any>;
}
declare module 'three/src/math/MathUtils' {
  export function generateUUID(): string;
}
