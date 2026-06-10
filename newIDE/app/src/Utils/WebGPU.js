// @flow
let webGPUSupportPromise: Promise<boolean> | null = null;
let isWebGPUAvailable: boolean | null = null;

export const isWebGPUSupported = (): boolean => {
  if (isWebGPUAvailable !== null) return isWebGPUAvailable;

  isWebGPUAvailable =
    typeof navigator !== 'undefined' && !!(navigator: any).gpu;

  return isWebGPUAvailable;
};

export const checkWebGPUSupport = async (): Promise<boolean> => {
  if (webGPUSupportPromise) return webGPUSupportPromise;

  webGPUSupportPromise = (async () => {
    if (
      typeof navigator === 'undefined' ||
      !(navigator: any).gpu ||
      typeof (navigator: any).gpu.requestAdapter !== 'function'
    ) {
      isWebGPUAvailable = false;
      return false;
    }

    try {
      const adapter = await (navigator: any).gpu.requestAdapter();
      if (!adapter || typeof adapter.requestDevice !== 'function') {
        isWebGPUAvailable = false;
        return false;
      }

      const device = await adapter.requestDevice();
      if (device && typeof device.destroy === 'function') {
        device.destroy();
      }

      isWebGPUAvailable = true;
      return true;
    } catch (error) {
      isWebGPUAvailable = false;
      return false;
    }
  })();

  return webGPUSupportPromise;
};

export const resetWebGPUSupportCacheForTesting = () => {
  webGPUSupportPromise = null;
  isWebGPUAvailable = null;
};
