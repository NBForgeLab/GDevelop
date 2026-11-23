// Mock for BackgroundSerializerWorkerFactory.ts to prevent "self is not defined" errors in tests

type MockWorkerMessage = {
  type?: string;
  binary?: Uint8Array | ArrayBuffer;
  requestId?: number;
};

type MockWorker = {
  postMessage: (message: MockWorkerMessage) => void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((error: unknown) => void) | null;
  terminate: jest.Mock;
};

export const createMockBackgroundSerializerWorker = (): MockWorker => {
  const mockWorker: MockWorker = {
    // Plain function (not jest.fn()) so Jest `resetMocks: true` does not clear
    // it between tests when BackgroundSerializer reuses its singleton worker.
    postMessage: (message: MockWorkerMessage) => {
      if (
        !message ||
        (message.type !== 'SERIALIZE_TO_JSON' &&
          message.type !== 'SERIALIZE_TO_JS_OBJECT')
      ) {
        return;
      }

      setTimeout(() => {
        if (!mockWorker.onmessage) return;
        try {
          const gd: libGDevelop = (
            global as typeof globalThis & { gd: libGDevelop }
          ).gd;
          if (!gd || !gd.BinarySerializer || !gd.HEAPU8 || !gd.Serializer) {
            throw new Error('libGDevelop is not initialized in test.');
          }
          if (!message.binary) {
            throw new Error('Missing binary payload.');
          }

          const binaryArray =
            message.binary instanceof Uint8Array
              ? message.binary
              : new Uint8Array(message.binary);
          const binarySize = binaryArray.byteLength || binaryArray.length;
          const binaryPtr = gd._malloc(binarySize);
          gd.HEAPU8.set(binaryArray, binaryPtr);

          const element = gd.BinarySerializer.deserializeBinarySnapshot(
            binaryPtr,
            binarySize
          );
          gd._free(binaryPtr);

          if (element.ptr === 0) {
            throw new Error('Failed to deserialize binary snapshot.');
          }

          const json = gd.Serializer.toJSON(element);
          element.delete();
          const result =
            message.type === 'SERIALIZE_TO_JSON' ? json : JSON.parse(json);

          mockWorker.onmessage({
            data: {
              type: 'DONE',
              requestId: message.requestId,
              result,
            },
          });
        } catch (error) {
          mockWorker.onmessage({
            data: {
              type: 'ERROR',
              requestId: message.requestId,
              message: error instanceof Error ? error.message : String(error),
            },
          });
        }
      }, 0);
    },
    onmessage: null,
    onerror: null,
    terminate: jest.fn(),
  };

  return mockWorker;
};

export const createBackgroundSerializerWorker: jest.Mock<MockWorker, []> =
  jest.fn(createMockBackgroundSerializerWorker);
