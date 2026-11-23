import { initializeZipJs, type ZipJs } from './Zip.js';
import { downloadUrlsToBlobs, type ItemResult } from './BlobDownloader';
import path from 'path-browserify';
import { shortenString } from './StringHelpers';

export type BlobFileDescriptor = {
  filePath: string;
  blob: Blob;
};

export type TextFileDescriptor = {
  filePath: string;
  text: string;
};

export type UrlFileDescriptor = {
  filePath: string;
  url: string;
};

function eachCallback<T>(
  array: Array<T>,
  callback: (t: T, arg1: () => void) => void,
  done: () => void
) {
  if (!array.length) {
    done();
    return;
  }
  let index = 0;

  const callNextCallback = () => {
    callback(array[index], () => {
      index++;
      if (index >= array.length) {
        done();
      } else {
        callNextCallback();
      }
    });
  };

  callNextCallback();
}

export const downloadUrlFilesToBlobFiles = async ({
  urlFiles,
  onProgress,
}: {
  urlFiles: Array<UrlFileDescriptor>;
  onProgress: (count: number, total: number) => void;
}): Promise<Array<BlobFileDescriptor>> => {
  const downloadedBlobs: Array<ItemResult<UrlFileDescriptor>> =
    await downloadUrlsToBlobs({
      urlContainers: urlFiles.filter(({ url }) => url.indexOf('.h') === -1), // Should be useless now, still keep it by safety.
      onProgress,
    });

  const erroredUrls = downloadedBlobs.filter((downloadedBlob) => {
    return !!downloadedBlob.error || !downloadedBlob.blob;
  });
  if (erroredUrls.length) {
    const errorMessages = erroredUrls
      .map(({ error }) =>
        error ? error.message : 'Unknown error during download.'
      )
      .filter(Boolean)
      .join(',\n');

    throw new Error(
      `Could not download ${erroredUrls.length} files:\n ${shortenString(
        errorMessages,
        300
      )}`
    );
  }

  return downloadedBlobs.map(({ item, blob }) => {
    return {
      // any non existing blob is discarded before.
      blob: blob as Blob,
      filePath: item.filePath,
    };
  });
};

/**
 * Archive the specified blobs and texts into a zip file,
 * returned as a blob.
 */
export const archiveFiles = async ({
  textFiles,
  blobFiles,
  basePath,
  onProgress,
  sizeLimit,
}: {
  textFiles: Array<TextFileDescriptor>;
  blobFiles: Array<BlobFileDescriptor>;
  basePath: string;
  onProgress: (count: number, total: number) => void;
  sizeLimit?: number;
}): Promise<Blob> => {
  const zipJs: ZipJs = await initializeZipJs();

  let zippedFilesCount = 0;
  let totalFilesCount = blobFiles.length + textFiles.length;

  return new Promise((resolve, reject) => {
    zipJs.createWriter(
      new zipJs.BlobWriter('application/zip'),
      function (zipWriter) {
        eachCallback(
          blobFiles,
          ({ filePath, blob }, done) => {
            // All files in a zip are relative
            const relativeFilePath: string = path.relative(basePath, filePath);

            zipWriter.add(
              relativeFilePath,
              new zipJs.BlobReader(blob),
              () => {
                zippedFilesCount++;
                onProgress(zippedFilesCount, totalFilesCount);
                done();
              },
              () => {
                /* We don't track progress at the file level */
              }
            );
          },
          () => {
            eachCallback(
              textFiles,
              ({ filePath, text }, done) => {
                // All files in a zip are relative
                const relativeFilePath = path.relative(basePath, filePath);

                zipWriter.add(
                  relativeFilePath,
                  new zipJs.TextReader(text),
                  () => {
                    zippedFilesCount++;
                    onProgress(zippedFilesCount, totalFilesCount);
                    done();
                  },
                  () => {
                    /* We don't track progress at the file level */
                  }
                );
              },
              () => {
                zipWriter.close((blob: Blob) => {
                  const fileSize = blob.size;
                  if (sizeLimit && fileSize > sizeLimit) {
                    const roundFileSizeInMb = Math.round(
                      fileSize / (1000 * 1000)
                    );
                    reject(
                      new Error(
                        `Archive is of size ${roundFileSizeInMb} MB, which is above the limit allowed of ${
                          sizeLimit / (1000 * 1000)
                        } MB.`
                      )
                    );
                  }
                  resolve(blob);
                });
              }
            );
          }
        );
      },
      (error) => {
        console.error('Error while making zip:', error);
        reject(error);
      }
    );
  });
};

export const listArchiveFiles = async ({
  archiveBlob,
  onProgress,
  sizeLimit,
}: {
  archiveBlob: Blob;
  onProgress: (count: number, total: number) => void;
  sizeLimit?: number;
}): Promise<Array<string>> => {
  const zipJs: ZipJs = await initializeZipJs();

  return new Promise((resolve, reject) => {
    zipJs.createReader(
      new zipJs.BlobReader(archiveBlob),
      function (zipReader) {
        zipReader.getEntries((entries) => {
          const enumeratedEntries = entries.map((entry) => entry.filename);
          zipReader.close(() => {
            resolve(enumeratedEntries);
          });
        });
      },
      (error) => {
        console.error('Error while making zip:', error);
        reject(error);
      }
    );
  });
};

export type ArchiveReader = {
  getFileBlob: (filePath: string, contentType: string) => Promise<Blob>;
  close: () => Promise<void>;
};

/**
 * Open an archive once to read several files from it,
 * instead of reading the whole archive index for each file.
 */
export const openArchive = async (
  archiveBlob: Blob
): Promise<ArchiveReader> => {
  const zipJs: ZipJs = await initializeZipJs();

  return new Promise((resolve, reject) => {
    let isOpened = false;
    // Zip.js reports reading errors through the reader error callback,
    // so the file being read must be rejected from there.
    let rejectCurrentFile: ((error: any) => void) | null | undefined = null;
    zipJs.createReader(
      new zipJs.BlobReader(archiveBlob),
      function (zipReader) {
        zipReader.getEntries((entries) => {
          const entriesByFilePath = new Map(
            entries.map((entry) => [entry.filename, entry])
          );
          isOpened = true;
          resolve({
            getFileBlob: (filePath: string, contentType: string) =>
              new Promise((resolveFile, rejectFile) => {
                const entry = entriesByFilePath.get(filePath);
                if (!entry) {
                  rejectFile(
                    new Error(`The archive doesn't contain: ${filePath}`)
                  );
                  return;
                }
                rejectCurrentFile = rejectFile;
                entry.getData(new zipJs.BlobWriter(contentType), (blob) => {
                  rejectCurrentFile = null;
                  resolveFile(blob);
                });
              }),
            close: () =>
              new Promise((resolveClose) => {
                zipReader.close(resolveClose);
              }),
          });
        });
      },
      (error) => {
        console.error('Error while reading zip:', error);
        if (!isOpened) {
          reject(error);
        } else if (rejectCurrentFile) {
          rejectCurrentFile(error);
          rejectCurrentFile = null;
        }
      }
    );
  });
};

export const getFileBlob = async ({
  archiveBlob,
  filePath,
  contentType,
  onProgress,
  sizeLimit,
}: {
  archiveBlob: Blob;
  filePath: string;
  contentType: string;
  onProgress: (count: number, total: number) => void;
  sizeLimit?: number;
}): Promise<Blob> => {
  const zipJs: ZipJs = await initializeZipJs();

  return new Promise((resolve, reject) => {
    zipJs.createReader(
      new zipJs.BlobReader(archiveBlob),
      function (zipReader) {
        zipReader.getEntries((entries) => {
          const entry = entries.find((entry) => entry.filename === filePath);
          if (!entry) {
            const error = `The archive doesn't contain: ${filePath}`;
            console.error(error);
            reject(error);
            return;
          }
          entry.getData(new zipJs.BlobWriter(contentType), (result) => {
            zipReader.close(() => {
              resolve(result);
            });
          });
        });
      },
      (error) => {
        console.error('Error while making zip:', error);
        reject(error);
      }
    );
  });
};
