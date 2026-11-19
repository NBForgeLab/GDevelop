// Run the classic worker script with its real message handler and an isolated heap.
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const workerSource = fs.readFileSync(
  path.join(__dirname, 'BackgroundSerializer.worker.js'),
  'utf8'
);

async function runWorkerSave(gd) {
  const self = { postMessage: jest.fn() };
  vm.runInNewContext(workerSource, {
    self,
    Uint8Array,
    importScripts: () => {},
    initializeGDevelopJs: async () => gd,
  });
  await self.onmessage({
    data: {
      type: 'SERIALIZE_TO_JSON',
      binary: Uint8Array.of(1),
      requestId: 1,
    },
  });
  return self.postMessage.mock.calls[0][0];
}

describe('background serializer worker resource ownership', () => {
  it('rejects allocation failure before writing to the heap', async () => {
    const gd = { _malloc: () => 0, HEAPU8: new Uint8Array(8) };
    const reply = await runWorkerSave(gd);
    expect(reply.type).toBe('ERROR');
    expect(gd.HEAPU8[0]).toBe(0);
  });

  it('frees the worker input when deserialization throws', async () => {
    const gd = {
      _malloc: () => 4,
      _free: jest.fn(),
      HEAPU8: new Uint8Array(8),
      BinarySerializer: {
        deserializeBinarySnapshot() {
          throw new Error('Read failed');
        },
      },
    };
    expect((await runWorkerSave(gd)).message).toBe('Read failed');
    expect(gd._free.mock.calls).toEqual([[4]]);
  });

  it('releases the decoded element when JSON conversion throws', async () => {
    const element = { ptr: 8, delete: jest.fn() };
    const gd = {
      _malloc: () => 4,
      _free: jest.fn(),
      HEAPU8: new Uint8Array(8),
      BinarySerializer: { deserializeBinarySnapshot: () => element },
      Serializer: {
        toJSON() {
          throw new Error('Conversion failed');
        },
      },
    };
    expect((await runWorkerSave(gd)).message).toBe('Conversion failed');
    expect(element.delete).toHaveBeenCalledTimes(1);
  });
});
