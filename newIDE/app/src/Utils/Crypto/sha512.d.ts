export type Sha512Variant = 'SHA-384' | 'SHA-512';
export type Sha512InputFormat =
  'HEX' | 'TEXT' | 'B64' | 'BYTES' | 'ARRAYBUFFER' | 'UINT8ARRAY';
export type Sha512OutputFormat =
  'HEX' | 'B64' | 'BYTES' | 'ARRAYBUFFER' | 'UINT8ARRAY';
export type Sha512Encoding = 'UTF8' | 'UTF16BE' | 'UTF16LE';

export interface Sha512Options {
  encoding?: Sha512Encoding;
  numRounds?: number;
  hmacKey?: {
    value: string | ArrayBuffer | Uint8Array;
    format: Sha512InputFormat;
    encoding?: Sha512Encoding;
  };
}

export interface Sha512OutputOptions {
  outputUpper?: boolean;
  b64Pad?: string;
}

export default class jsSHA {
  constructor(
    variant: Sha512Variant,
    inputFormat: Sha512InputFormat,
    options?: Sha512Options
  );
  update(input: string | ArrayBuffer | Uint8Array): this;
  getHash(
    format: 'HEX' | 'B64' | 'BYTES',
    options?: Sha512OutputOptions
  ): string;
  getHash(format: 'ARRAYBUFFER', options?: Sha512OutputOptions): ArrayBuffer;
  getHash(format: 'UINT8ARRAY', options?: Sha512OutputOptions): Uint8Array;
  getHash(
    format: Sha512OutputFormat,
    options?: Sha512OutputOptions
  ): string | ArrayBuffer | Uint8Array;
  setHMACKey(
    key: string | ArrayBuffer | Uint8Array,
    inputFormat: Sha512InputFormat,
    options?: { encoding?: Sha512Encoding }
  ): void;
  getHMAC(
    format: 'HEX' | 'B64' | 'BYTES',
    options?: Sha512OutputOptions
  ): string;
  getHMAC(format: 'ARRAYBUFFER', options?: Sha512OutputOptions): ArrayBuffer;
  getHMAC(format: 'UINT8ARRAY', options?: Sha512OutputOptions): Uint8Array;
  getHMAC(
    format: Sha512OutputFormat,
    options?: Sha512OutputOptions
  ): string | ArrayBuffer | Uint8Array;
}
