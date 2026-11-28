import optionalRequire from './OptionalRequire';
const path = optionalRequire('path');
const fs = optionalRequire('fs');

const readLocalFileToArrayBuffer = async (
  filePath: string
): Promise<ArrayBuffer> => {
  const buffer: Buffer = await new Promise((resolve, reject) => {
    fs.readFile(
      filePath,
      function (err: NodeJS.ErrnoException | null, buffer: Buffer) {
        if (err) {
          reject(err);
          return;
        }

        resolve(buffer);
      }
    );
  });

  // Copy into a dedicated ArrayBuffer because small Node Buffers (< 4 kB) share an internal slab
  // and Buffer.buffer is typed as ArrayBufferLike (ArrayBuffer | SharedArrayBuffer).
  const arrayBuffer = new ArrayBuffer(buffer.byteLength);
  new Uint8Array(arrayBuffer).set(buffer);
  return arrayBuffer;
};

// See https://developer.mozilla.org/en-US/docs/Web/HTTP/Basics_of_HTTP/MIME_types/Common_types.
const extensionToMimeType: { [extension: string]: string } = {
  // Common audio extensions:
  aac: 'audio/aac',
  m4a: 'audio/x-m4a',
  wav: 'audio/wav',
  mp3: 'audio/mp3',
  ogg: 'audio/ogg',

  // Common image extensions:
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  webp: 'image/webp',

  // Common font extensions:
  ttf: 'font/ttf',
  otf: 'font/otf',

  // Common video extensions:
  mp4: 'video/mp4',
  webm: 'video/webm',

  // Other common extensions:
  json: 'application/json',
  xml: 'application/xml',
  gz: 'application/gzip',
  js: 'application/javascript',
};

export const readLocalFileToFile = async (filePath: string): Promise<File> => {
  const arrayBuffer = await readLocalFileToArrayBuffer(filePath);
  const extensionWithoutLeadingDot: string = path
    .extname(filePath)
    .replace(/^\./, '');
  return new File([arrayBuffer], path.basename(filePath), {
    type:
      extensionToMimeType[extensionWithoutLeadingDot] ||
      'application/octet-stream',
  });
};
