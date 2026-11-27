// Ambient declarations for third-party libraries and local runtime aliases
// that do not ship bundled TypeScript definitions.

declare module 'slugs' {
  function slugs(str: string, separator?: string): string;
  export default slugs;
}

declare module '@lingui/macro' {
  import * as React from 'react';
  export const Trans: React.ComponentType<any>;
  export const Plural: React.ComponentType<any>;
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
    update?: boolean;
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

declare module 'react-test-renderer' {
  import * as React from 'react';
  export const act: (callback: () => void | Promise<void>) => any;
  export const create: (element: React.ReactElement<any>) => any;
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

declare module 'blueimp-md5' {
  function md5(value: string, key?: string, raw?: boolean): string;
  export default md5;
}

declare module 'react-inner-image-zoom' {
  import * as React from 'react';
  const InnerImageZoom: React.ComponentType<any>;
  export default InnerImageZoom;
}

declare module 'react-window' {
  import * as React from 'react';
  export const FixedSizeList: React.ComponentType<any>;
  export const VariableSizeList: React.ComponentType<any>;
  export function areEqual(prevProps: any, nextProps: any): boolean;
}

declare module 'https://resources.gdevelop.io/a/ggm-web.js' {
  const ggm: {
    initialize: (container: HTMLElement) => Promise<void>;
    [key: string]: any;
  };
  export default ggm;
}

declare module 'xxhashjs' {
  const xxhashjs: {
    h32: (input: string, seed: number) => { toNumber: () => number };
    [key: string]: any;
  };
  export default xxhashjs;
}

declare module 'libGD.js-for-tests-only' {
  const initializeGDevelopJs: (options?: {
    wasmBinary?: Uint8Array | Buffer;
    locateFile?: (path: string, prefix: string) => string;
  }) => Promise<any>;
  export = initializeGDevelopJs;
}

declare module 'GDJS-for-web-app-only/*' {
  const extensionModule: any;
  export = extensionModule;
}
