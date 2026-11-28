const fileWatcher = require('chokidar');
const path = require('path');

/** @type {Record<string, () => void>} */
let subscriptionCancelers = {};
let newSubscriptionId = 1;

const getNewSubscriptionId = () => {
  const id = newSubscriptionId++;
  return id.toString();
};

/** @param {string} filePath */
const normalizePath = (filePath) => {
  if (!filePath) return ''; // Safety check

  return filePath.replace(/\\/g, '/');
};

/**
 * @param {string} folderPath
 * @param {(filePath: string) => void} fileWiseCallback
 * @param {string} serializedOptions
 * @returns {string}
 */
const setupWatcher = (folderPath, fileWiseCallback, serializedOptions) => {
  const options = JSON.parse(serializedOptions);
  const newSubscriptionId = getNewSubscriptionId();
  const watcher = fileWatcher
    .watch(folderPath, {
      ignored: (candidatePath) => {
        // Normalize the path to avoid issues with different path separators (\ on Windows, / on other OSes).
        // Even on Windows, "candidatePath" returned by chokidar is always using "/".
        // So we normalize all paths (candidatePath and ignore paths) to avoid missing ignored files on Windows.
        const normalizedCandidatePath = normalizePath(candidatePath);

        if (
          /** @type {string[]} */ (options.ignore || []).some((ignore) =>
            normalizedCandidatePath.includes(normalizePath(ignore))
          ) ||
          // Force ignore, for safety, any node_modules folder as they are too big and would crash the watcher on macOS.
          // Note that this will ignore any folder whose name is prefixed by "node_modules".
          normalizedCandidatePath.includes('/node_modules') ||
          // Same for git repositories (and any file starting by ".git").
          normalizedCandidatePath.includes('/.git')
        ) {
          console.info(
            `Local file watcher has ignored path "${normalizedCandidatePath}".`
          );
          return true;
        }

        return false;
      },
      ignoreInitial: true,
      awaitWriteFinish: {
        stabilityThreshold: 250,
        pollInterval: 100,
      },
    })
    .on(
      'change',
      // TODO: Is it safe to let it like that since the OS could for some reason
      // do never-ending operations on the folder or its children, making the debounce
      // never ending.
      fileWiseCallback
    )
    .on('unlink', fileWiseCallback)
    .on('add', fileWiseCallback);

  subscriptionCancelers[newSubscriptionId] = () => watcher.unwatch(folderPath);

  return newSubscriptionId;
};

/** @param {string} id */
const disableWatcher = (id) => {
  const subscriptionCanceler = subscriptionCancelers[id];
  if (!subscriptionCanceler) {
    console.log('No watcher subscription to disable.');
    return;
  }
  subscriptionCanceler();
  delete subscriptionCancelers[id];
};

module.exports = {
  setupWatcher,
  disableWatcher,
};
