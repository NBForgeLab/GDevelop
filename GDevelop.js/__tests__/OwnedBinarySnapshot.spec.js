const initializeGDevelopJs = require('../../Binaries/embuild/GDevelop.js/libGD.js');

describe('owned binary snapshots', () => {
  let gd;
  let registrations;
  let finalize;

  beforeAll(async () => {
    const NativeRegistry = global.FinalizationRegistry;
    registrations = new Map();
    global.FinalizationRegistry = class {
      constructor(callback) {
        finalize = callback;
      }
      register(target, holding, token) {
        registrations.set(token, holding);
      }
      unregister(token) {
        return registrations.delete(token);
      }
    };
    try {
      gd = await initializeGDevelopJs();
    } finally {
      global.FinalizationRegistry = NativeRegistry;
    }
  });

  it('keeps independent snapshots readable after their source is deleted', () => {
    const source = new gd.SerializerElement();
    const first = gd.createOwnedBinarySnapshot(source);
    source.setStringValue('a longer snapshot');
    const second = gd.createOwnedBinarySnapshot(source);
    source.delete();
    try {
      const bytes = first.copyBytes();
      expect(second.copyBytes().length).toBeGreaterThan(bytes.length);
      expect(bytes.buffer).not.toBe(gd.HEAPU8.buffer);
      expect(first.copyBytes()).toEqual(bytes);
    } finally {
      first.dispose();
      second.dispose();
    }
  });

  it('releases an allocation exactly once on explicit or fallback disposal', () => {
    const source = new gd.SerializerElement();
    const free = jest.spyOn(gd.BinarySerializer, 'freeBinarySnapshot');
    try {
      const explicit = gd.createOwnedBinarySnapshot(source);
      const holding = registrations.get(explicit);
      expect(holding).toBeDefined();
      explicit[Symbol.dispose || Symbol.for('Symbol.dispose')]();
      expect(registrations.has(explicit)).toBe(false);
      explicit.dispose();
      finalize(holding);
      expect(free).toHaveBeenCalledTimes(1);
      expect(() => explicit.copyBytes()).toThrow(/disposed/i);
      const abandoned = gd.createOwnedBinarySnapshot(source);
      finalize(registrations.get(abandoned));
      registrations.delete(abandoned);
      expect(free).toHaveBeenCalledTimes(2);
    } finally {
      free.mockRestore();
      source.delete();
    }
  });

  it('supports explicit disposal when finalizers are unavailable', async () => {
    const NativeRegistry = global.FinalizationRegistry;
    let module;
    try {
      global.FinalizationRegistry = undefined;
      module = await initializeGDevelopJs();
    } finally {
      global.FinalizationRegistry = NativeRegistry;
    }
    const source = new module.SerializerElement();
    try {
      const snapshot = module.createOwnedBinarySnapshot(source);
      snapshot.dispose();
      expect(() => snapshot.copyBytes()).toThrow(/disposed/i);
    } finally {
      source.delete();
    }
  });
});
