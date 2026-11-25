declare class jsSHA {
  constructor(
    variant: 'SHA-224' | 'SHA-256',
    inputFormat:
      | 'HEX'
      | 'TEXT'
      | 'B64'
      | 'BYTES'
      | 'ARRAYBUFFER'
      | 'UINT8ARRAY',
    options?: {
      encoding?: string;
      numRounds?: number;
      hmacKey?: { value: any; format: string };
    }
  );
  update(srcString: string | ArrayBuffer | Uint8Array): void;
  getHash(
    format: 'HEX' | 'TEXT' | 'B64' | 'BYTES' | 'ARRAYBUFFER' | 'UINT8ARRAY',
    options?: { outputUpper?: boolean; b64Pad?: string }
  ): string;
}

export default jsSHA;
