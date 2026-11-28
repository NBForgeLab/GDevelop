// Ambient module declarations for third-party packages used by newIDE/app/scripts
// that do not ship their own TypeScript definitions.

declare module 'recursive-readdir' {
  import * as fs from 'fs';

  type IgnoreFunction = (file: string, stats: fs.Stats) => boolean;
  type Ignores = ReadonlyArray<string | IgnoreFunction>;
  type Callback = (
    error: NodeJS.ErrnoException | null,
    files: string[]
  ) => void;

  function recursiveReaddir(path: string, callback: Callback): void;
  function recursiveReaddir(
    path: string,
    ignores: Ignores,
    callback: Callback
  ): void;
  function recursiveReaddir(path: string, ignores?: Ignores): Promise<string[]>;

  export = recursiveReaddir;
}

declare module 'style-dictionary' {
  interface StyleDictionaryFileConfig {
    format: string;
    destination: string;
  }

  interface StyleDictionaryPlatformConfig {
    theme?: string;
    transformGroup: string;
    files: StyleDictionaryFileConfig[];
    actions?: string[];
  }

  interface StyleDictionaryConfig {
    source: string[];
    include?: string[];
    platforms: Record<string, StyleDictionaryPlatformConfig>;
    log?: string;
  }

  interface StyleDictionaryDictionary {
    properties: Record<string, unknown>;
    allProperties: unknown[];
  }

  interface StyleDictionaryAction {
    name: string;
    do: (
      dictionary: StyleDictionaryDictionary,
      config: StyleDictionaryPlatformConfig
    ) => void;
    undo?: (
      dictionary: StyleDictionaryDictionary,
      config: StyleDictionaryPlatformConfig
    ) => void;
  }

  interface StyleDictionaryInstance {
    registerAction(action: StyleDictionaryAction): StyleDictionaryInstance;
    extend(config: StyleDictionaryConfig | string): StyleDictionaryInstance;
    buildPlatform(platform: string): StyleDictionaryInstance;
    buildAllPlatforms(): StyleDictionaryInstance;
  }

  const styleDictionary: StyleDictionaryInstance;
  export = styleDictionary;
}

declare module 'messageformat-parser' {
  export function parse(input: string): unknown[];
  export class SyntaxError extends Error {}
}

declare module 'folder-hash' {
  export interface HashElementOptions {
    algo?: string;
    encoding?: 'base64' | 'hex' | 'binary';
    files?: {
      exclude?: string[] | ((path: string) => boolean);
      include?: string[] | ((path: string) => boolean);
      matchBasename?: boolean;
      matchPath?: boolean;
      ignoreBasename?: boolean;
      ignoreRootName?: boolean;
    };
    folders?: {
      exclude?: string[] | ((path: string) => boolean);
      include?: string[] | ((path: string) => boolean);
      matchBasename?: boolean;
      matchPath?: boolean;
      ignoreBasename?: boolean;
      ignoreRootName?: boolean;
    };
  }

  export interface HashedItem {
    name: string;
    hash: string;
    children?: HashedItem[];
    toString(padding?: string): string;
  }

  export function hashElement(
    path: string,
    options?: HashElementOptions
  ): Promise<HashedItem>;
  export function hashElement(
    path: string,
    dir: string,
    options?: HashElementOptions
  ): Promise<HashedItem>;
}

declare module 'workbox-build' {
  export interface InjectManifestConfig {
    swSrc: string;
    swDest: string;
    globDirectory: string;
    globPatterns?: string[];
    maximumFileSizeToCacheInBytes?: number;
  }

  export interface InjectManifestResult {
    count: number;
    size: number;
    warnings: string[];
  }

  export function injectManifest(
    config: InjectManifestConfig
  ): Promise<InjectManifestResult>;
}
