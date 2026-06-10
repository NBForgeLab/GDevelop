// @flow

// Three.js Addons Stubs for Flow
declare module 'three/addons/loaders/GLTFLoader' {
  declare export type GLTF = any;
  declare export class GLTFLoader {
    constructor(): void;
    withCredentials: boolean;
    load(
      url: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    parse(
      data: ArrayBuffer | string,
      path: string,
      onLoad: (gltf: GLTF) => void,
      onProgress?: any,
      onError?: (event: any) => void
    ): void;
    setDRACOLoader(dracoLoader: any): GLTFLoader;
  }
}

declare module 'three/addons/utils/SkeletonUtils' {
  declare module.exports: any;
}

declare module 'three/addons/utils/BufferGeometryUtils' {
  declare module.exports: any;
}

declare module 'three/webgpu' {
  declare module.exports: any;
}

declare var vi: any;

declare module 'fs' {
  declare module.exports: any;
}

declare module 'path' {
  declare module.exports: any;
}

declare var process: any;

declare var WebGL2RenderingContext: any;
