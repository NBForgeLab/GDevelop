/* eslint-env worker */

declare function importScripts(...urls: string[]): void;
declare function initializeGDevelopJs(options?: {
  locateFile?: (path: string, prefix: string) => string;
}): Promise<libGDevelop>;

type BackgroundSerializerWorkerInMessage = {
  type?: string;
  binary?: Uint8Array | ArrayBuffer;
  requestId?: number;
  versionWithHash?: string;
};

let modulePromise: Promise<libGDevelop> | null = null;

const log = (message: string) => {
  console.log(`[BackgroundSerializerWorker] ${message}`);
};

const getErrorMessage = (error: unknown): string => {
  if (error instanceof Error) {
    return error.message;
  }
  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof (error as { message: unknown }).message === 'string'
  ) {
    return (error as { message: string }).message;
  }
  return String(error);
};

const getLibGDevelop = (versionWithHash?: string): Promise<libGDevelop> => {
  if (modulePromise) return modulePromise;

  modulePromise = new Promise<libGDevelop>((resolve, reject) => {
    try {
      const url = `/libGD.js?cache-buster=${versionWithHash}`;
      // Load libGD.js in the worker context.
      // eslint-disable-next-line no-undef
      importScripts(url);

      if (typeof initializeGDevelopJs !== 'function') {
        reject(new Error('Missing initializeGDevelopJs in worker'));
        return;
      }

      initializeGDevelopJs({
        // Override the resolved URL for the .wasm file,
        // to ensure a new version is fetched when the version changes.
        locateFile: (path: string, _prefix: string) => {
          // This function is called by Emscripten to locate the .wasm file only.
          // As the wasm is at the root of the public folder, we can just return
          // the path to the file.
          // Plus, on Electron, the prefix seems to be pointing to the root of the
          // app.asar archive, which is completely wrong.
          return path + `?cache-buster=${versionWithHash}`;
        },
      })
        .then((module) => {
          resolve(module);
        })
        .catch(reject);
    } catch (error) {
      reject(error);
      return;
    }
  });

  return modulePromise;
};

const unserializeBinarySnapshotToJson = (
  gd: libGDevelop,
  binary: Uint8Array | ArrayBuffer
): string => {
  const binaryArray =
    binary instanceof Uint8Array ? binary : new Uint8Array(binary);
  const binarySize = binaryArray.byteLength || binaryArray.length;

  // Allocate memory in Emscripten heap and copy binary data
  const binaryPtr = gd._malloc(binarySize);
  if (!binaryPtr) throw new Error('Failed to allocate binary snapshot buffer.');

  let element: gdSerializerElement;
  try {
    gd.HEAPU8.set(binaryArray, binaryPtr);
    element = gd.BinarySerializer.deserializeBinarySnapshot(
      binaryPtr,
      binarySize
    );
  } finally {
    gd._free(binaryPtr);
  }

  if (element.ptr === 0) {
    throw new Error('Failed to deserialize binary snapshot.');
  }

  try {
    return gd.Serializer.toJSON(element);
  } finally {
    element.delete();
  }
};

// eslint-disable-next-line no-restricted-globals
self.onmessage = async (
  event: MessageEvent<BackgroundSerializerWorkerInMessage>
) => {
  const { type, binary, requestId, versionWithHash } = event.data || {};

  const startTime = Date.now();

  log(`Request #${requestId} received (${type}).`);
  if (type !== 'SERIALIZE_TO_JSON' && type !== 'SERIALIZE_TO_JS_OBJECT') return;

  try {
    const gd = await getLibGDevelop(versionWithHash);
    if (!binary) {
      throw new Error('Missing binary payload.');
    }

    const json = unserializeBinarySnapshotToJson(gd, binary);
    const result = type === 'SERIALIZE_TO_JSON' ? json : JSON.parse(json);

    log(`Request #${requestId} done in ${Date.now() - startTime}ms.`);

    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'DONE',
      result,
      requestId,
      duration: Date.now() - startTime,
    });
  } catch (error) {
    // eslint-disable-next-line no-restricted-globals
    self.postMessage({
      type: 'ERROR',
      requestId,
      message: getErrorMessage(error),
    });
  }
};

const BackgroundSerializerWorkerConstructor = null as unknown as {
  new (): Worker;
};
export default BackgroundSerializerWorkerConstructor;
