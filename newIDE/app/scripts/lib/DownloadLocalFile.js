// @ts-check
const fs = require('fs');
const { default: axios } = require('axios');

let temporaryFileCounter = 0;

/**
 * Download a file to `outputPath`. The download is done to a temporary file
 * which is renamed at the end, so that `outputPath` is never left with a
 * partially downloaded (i.e: corrupted) file - even if the download fails
 * or if multiple downloads to the same `outputPath` are attempted.
 *
 * @param {string} url
 * @param {string} outputPath
 * @returns {Promise<void>}
 */
const downloadLocalFile = async (url, outputPath) => {
  const temporaryPath = `${outputPath}.${
    process.pid
  }-${temporaryFileCounter++}.tmp`;
  try {
    const response = await axios.get(url, {
      responseType: 'stream',
    });

    await new Promise((resolve, reject) => {
      const writer = fs.createWriteStream(temporaryPath);
      let error = null;
      let settled = false;

      const rejectOnce = err => {
        if (settled) return;
        settled = true;
        reject(err);
      };

      const onError = err => {
        if (error) return;
        error = err;
        if (typeof response.data.unpipe === 'function') {
          response.data.unpipe(writer);
        }
        if (typeof response.data.destroy === 'function') {
          response.data.destroy();
        }
        writer.close(() => rejectOnce(err));
      };
      // Watch for errors on the response stream too: they are not forwarded
      // to the writer by `pipe`, and would otherwise leave the promise
      // pending forever.
      response.data.on('error', onError);
      writer.on('error', onError);
      writer.on('close', () => {
        if (!error && !settled) {
          settled = true;
          resolve(undefined);
        } else if (error) {
          rejectOnce(error);
        }
      });
      response.data.pipe(writer);
    });

    await fs.promises.rename(temporaryPath, outputPath);
  } catch (error) {
    await fs.promises
      .rm(temporaryPath, { force: true, maxRetries: 3, retryDelay: 50 })
      .catch(() => {});
    throw error;
  }
};

module.exports = {
  downloadLocalFile,
};
