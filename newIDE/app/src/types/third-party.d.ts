// Ambient declarations for genuinely untyped libraries and local/URL runtime aliases.

declare module 'slugs' {
  function slugs(str: string, separator?: string): string;
  export default slugs;
}

declare module 'https://resources.gdevelop.io/a/ggm-web.js' {
  const ggm: {
    initialize: (container: HTMLElement) => Promise<void>;
    [key: string]: any;
  };
  export default ggm;
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
