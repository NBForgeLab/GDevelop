import { loadScript } from '../LoadScript';
import { getPublicUrl } from '../BuildEnv';

export interface ZipJsReader {
  size: number;
  init(callback: () => void, onerror: (error: any) => void): void;
  readUint8Array(
    index: number,
    length: number,
    callback: (result: Uint8Array) => void,
    onerror?: (error: any) => void
  ): void;
}

export interface ZipJsZipReader {
  getEntries(callback: (entries: ZipJsEntry[]) => void): void;
  close(callback?: () => void): void;
}

export interface ZipJsWriter {
  init(callback: () => void, onerror?: (error: any) => void): void;
  writeUint8Array(
    array: Uint8Array,
    callback: () => void,
    onerror?: (error: any) => void
  ): void;
  getData(callback: (data: any) => void, onerror?: (error: any) => void): void;
}

export interface ZipJsEntry {
  filename: string;
  directory: boolean;
  compressedSize: number;
  uncompressedSize: number;
  lastModDate: Date;
  lastModDateRaw: number;
  comment: string;
  crc32: number;

  getData<T = any>(
    writer: ZipJsWriter,
    onend: (result: T) => void,
    onprogress?: (progress: number, total: number) => void,
    checkCrc32?: boolean
  ): void;
}

export interface ZipJsWriteOptions {
  directory?: boolean;
  level?: number;
  comment?: string;
  lastModDate?: Date;
  version?: number;
}

export interface ZipJsZipWriter {
  add(
    name: string,
    reader: ZipJsReader,
    onend: () => void,
    onprogress?: (progress: number, total: number) => void,
    options?: ZipJsWriteOptions
  ): void;
  close<T = any>(callback: (result: T) => void): void;
}

export interface ZipJs {
  useWebWorkers: boolean;
  workerScriptsPath: string;
  workerScripts: {
    deflater?: string[];
    inflater?: string[];
  };
  createReader: (
    reader: ZipJsReader,
    callback: (zipReader: ZipJsZipReader) => void,
    onerror?: (error: any) => void
  ) => void;

  createWriter: (
    writer: ZipJsWriter,
    callback: (zipWriter: ZipJsZipWriter) => void,
    onerror?: (error: any) => void,
    dontDeflate?: boolean
  ) => void;
  TextReader: new (text: string) => ZipJsReader;
  BlobReader: new (blob: Blob) => ZipJsReader;
  Data64URIReader: new (dataURI: string) => ZipJsReader;
  HttpReader: new (url: string) => ZipJsReader;
  ZipReader: new () => ZipJsZipReader;

  TextWriter: new (encoding?: string | null) => ZipJsWriter;
  BlobWriter: new (contentType: string) => ZipJsWriter;
  Data64URIWriter: new (mimeString?: string) => ZipJsWriter;
  ZipWriter: new () => ZipJsZipWriter;
}

const PUBLIC_URL: string = getPublicUrl();
const ZIPJS_EXTERNAL_PATH = '/external/zip.js/WebContent';
const ZLIBASM_EXTERNAL_PATH = '/external/zlib-asm';

let zipJsLoaded = false;
let zipJsLoadingPromise: Promise<ZipJs> | null | undefined = null;

/**
 * Initialize Zip.js, resolving with the instance of it.
 * Promise will be rejected if there is an error while loading Zip.js
 * (call initializeZipJs again to retry).
 */
export const initializeZipJs = (): Promise<ZipJs> => {
  if (zipJsLoaded) {
    const zip: ZipJs = (global as typeof globalThis & { zip: ZipJs }).zip;
    return Promise.resolve(zip);
  }

  if (zipJsLoadingPromise) {
    return zipJsLoadingPromise;
  }

  zipJsLoadingPromise = loadScript(
    PUBLIC_URL + ZIPJS_EXTERNAL_PATH + '/zip.js'
  ).then(() => {
    const zip: ZipJs | null | undefined = (
      global as typeof globalThis & { zip?: ZipJs }
    ).zip;
    if (!zip) {
      throw new Error(
        'Can not find "zip" in the global namespace after loading zip.js. Has the zip.js script being loaded properly?'
      );
    }

    zipJsLoadingPromise = null;
    zipJsLoaded = true;

    zip.workerScripts = {
      deflater: [
        PUBLIC_URL + ZIPJS_EXTERNAL_PATH + '/z-worker.js',
        PUBLIC_URL + ZLIBASM_EXTERNAL_PATH + '/zlib.js',
        PUBLIC_URL + ZIPJS_EXTERNAL_PATH + '/zlib-asm/codecs.js',
      ],
      inflater: [
        PUBLIC_URL + ZIPJS_EXTERNAL_PATH + '/z-worker.js',
        PUBLIC_URL + ZLIBASM_EXTERNAL_PATH + '/zlib.js',
        PUBLIC_URL + ZIPJS_EXTERNAL_PATH + '/zlib-asm/codecs.js',
      ],
    };
    return zip;
  });

  return zipJsLoadingPromise;
};
