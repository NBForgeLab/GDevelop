// @flow
import DesktopService from '../../Utils/DesktopService';
import debounce from 'lodash/debounce';
import wrap from 'lodash/wrap';
import memoize from 'lodash/memoize';
import { splittedProjectFolderNames } from './LocalProjectWriter';

const path = DesktopService.getPath();

export const setupResourcesWatcher:
  | (({
      callback: ({ identifier: string }) => void,
      fileIdentifier: string,
      options?: { isProjectSplitInMultipleFiles: boolean },
    }) => () => void)
  | void =
  DesktopService.isDesktop() && path
    ? ({
        fileIdentifier,
        callback,
        options,
      }: {
        fileIdentifier: string,
        callback: ({| identifier: string |}) => void,
        options?: {| isProjectSplitInMultipleFiles: boolean |},
      }) => {
        // We can't just debounce the whole callback, it has to be done file-wise,
        // otherwise we would miss all the debounced calls but the last one.
        // See https://stackoverflow.com/questions/28787436/debounce-a-function-with-argument
        const debouncedCallback = wrap(
          memoize(() =>
            debounce(
              filePath => {
                const relativePath = path
                  .relative(folderPath, filePath)
                  .replace(/\\/g, '/');

                callback({ identifier: relativePath });
              },
              200,
              { leading: false, trailing: true }
            )
          ),
          (getMemoizedFunc, obj) => getMemoizedFunc(obj)(obj)
        );
        const folderPath = path.dirname(fileIdentifier);
        const gameFile = path.basename(fileIdentifier);
        const autosaveFile = gameFile + '.autosave';
        const unsubscribe = DesktopService.onIpcEvent(
          'project-file-changed',
          changedPath => {
            // TODO: Is it safe to let it like that since the OS could for some reason
            // do never-ending operations on the folder or its children, making the debounce
            // never ending.
            debouncedCallback(changedPath);
          }
        );

        // Note: this ignore list is not a list of glob. Any file that matches a string in this list will be ignored.
        // This could be improved to separate this in a list of paths, filenames, etc.
        const ignore = [
          path.sep + '.DS_Store', // macOS folder attributes file
          path.sep + '.git', // For projects using git as a versioning tool.
          path.sep + 'node_modules', // For projects using npm (node_modules has way too many files and would crash the watcher on macOS)
          path.join(folderPath, gameFile),
          path.join(folderPath, autosaveFile),
        ];
        if (options && options.isProjectSplitInMultipleFiles) {
          ignore.push(
            ...splittedProjectFolderNames.map(folderName =>
              path.join(folderPath, folderName)
            )
          );
        }
        const subscriptionIdPromise = DesktopService.fsWatcher.setup(
          folderPath,
          JSON.stringify({
            ignore,
          })
        );

        return () => {
          unsubscribe();
          subscriptionIdPromise.then(subscriptionId => {
            if (subscriptionId) {
              DesktopService.fsWatcher.disable(subscriptionId);
            }
          });
        };
      }
    : undefined;
