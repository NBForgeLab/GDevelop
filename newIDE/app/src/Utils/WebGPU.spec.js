// @flow
import {
  checkWebGPUSupport,
  resetWebGPUSupportCacheForTesting,
} from './WebGPU';

const setNavigatorGpu = (gpu: any) => {
  Object.defineProperty(global.navigator, 'gpu', {
    configurable: true,
    value: gpu,
  });
};

describe('WebGPU support detection', () => {
  beforeEach(() => {
    resetWebGPUSupportCacheForTesting();
  });

  test('returns false when navigator.gpu is missing', async () => {
    setNavigatorGpu(undefined);

    expect(await checkWebGPUSupport()).toBe(false);
  });

  test('returns false when no adapter is available', async () => {
    setNavigatorGpu({
      requestAdapter: vi.fn().mockResolvedValue(null),
    });

    expect(await checkWebGPUSupport()).toBe(false);
  });

  test('returns false when a device cannot be requested', async () => {
    setNavigatorGpu({
      requestAdapter: vi.fn().mockResolvedValue({
        requestDevice: vi.fn().mockRejectedValue(new Error('blocked')),
      }),
    });

    expect(await checkWebGPUSupport()).toBe(false);
  });

  test('returns true when an adapter and device can be created', async () => {
    const destroy = vi.fn();
    setNavigatorGpu({
      requestAdapter: vi.fn().mockResolvedValue({
        requestDevice: vi.fn().mockResolvedValue({ destroy }),
      }),
    });

    expect(await checkWebGPUSupport()).toBe(true);
    expect(destroy).toHaveBeenCalled();
  });
});
