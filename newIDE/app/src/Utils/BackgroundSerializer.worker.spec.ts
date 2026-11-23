// Run the classic worker script with its real message handler and an isolated heap.
import fs from 'fs';
import path from 'path';
import vm from 'vm';
import { transformSync } from 'esbuild';

const rawWorkerSource = fs.readFileSync(
  path.join(__dirname, 'BackgroundSerializer.worker.ts'),
  'utf8'
);
const { code: workerSource } = transformSync(rawWorkerSource, {
  loader: 'ts',
  format: 'iife',
});

type MockWorkerGd = {
  _malloc: (size: number) => number;
  _free?: jest.Mock;
  HEAPU8: Uint8Array;
  BinarySerializer?: {
    deserializeBinarySnapshot: () => { ptr: number; delete: jest.Mock };
  };
  Serializer?: {
    toJSON: () => string;
  };
};

async function runWorkerSave(gd: MockWorkerGd) {
  const self: {
    postMessage: jest.Mock;
    onmessage?: (event: {
      data: {
        type: string;
        binary: Uint8Array;
        requestId: number;
      };
    }) => Promise<void>;
  } = { postMessage: jest.fn() };
  vm.runInNewContext(workerSource, {
    self,
    Uint8Array,
    importScripts: () => {},
    initializeGDevelopJs: async () => gd,
  });
  if (!self.onmessage) {
    throw new Error('Worker did not register self.onmessage.');
  }
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
    const gd: MockWorkerGd = { _malloc: () => 0, HEAPU8: new Uint8Array(8) };
    const reply = await runWorkerSave(gd);
    expect(reply.type).toBe('ERROR');
    expect(gd.HEAPU8[0]).toBe(0);
  });

  it('frees the worker input when deserialization throws', async () => {
    const gd: MockWorkerGd = {
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
    expect(gd._free?.mock.calls).toEqual([[4]]);
  });

  it('releases the decoded element when JSON conversion throws', async () => {
    const element = { ptr: 8, delete: jest.fn() };
    const gd: MockWorkerGd = {
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
