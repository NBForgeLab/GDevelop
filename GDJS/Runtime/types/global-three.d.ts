import * as THREE from 'three';

declare global {
  namespace THREE {
    type WebGPURenderer = {
      isWebGPURenderer: true;
      backend?: { isWebGLBackend?: boolean };
      domElement: HTMLCanvasElement;
      autoClear: boolean;
      outputColorSpace: ColorSpace;
      toneMapping: ToneMapping;
      toneMappingExposure: number;
      xr: {
        isPresenting: boolean;
      };
      info: {
        autoReset: boolean;
        reset(): void;
      };
      shadowMap: {
        enabled: boolean;
        type: ShadowMapType;
        autoUpdate: boolean;
        needsUpdate: boolean;
      };
      init(): Promise<void>;
      render(scene: Object3D, camera: Camera): void;
      setSize(width: number, height: number, updateStyle?: boolean): void;
      setPixelRatio(pixelRatio: number): void;
      setClearColor(color: ColorRepresentation, alpha?: number): void;
      clear(color?: boolean, depth?: boolean, stencil?: boolean): void;
      clearDepth(): void;
      resetState?(): void;
      dispose(): void;
    };

    const WebGPURenderer: {
      new (parameters?: unknown): WebGPURenderer;
    };
  }
}

export = THREE;
export as namespace THREE;
