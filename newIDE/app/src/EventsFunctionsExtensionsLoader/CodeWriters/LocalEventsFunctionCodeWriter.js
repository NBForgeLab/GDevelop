// @flow
import {
  type EventsFunctionCodeWriter,
  type EventsFunctionCodeWriterCallbacks,
} from '..';
import DesktopService from '../../Utils/DesktopService';
import { getUID } from '../../Utils/LocalUserInfo';
import slugs from 'slugs';

// There is a high chance of FS operations running while an Electron window is closing.
// We run into "Uncaught illegal access" errors from V8/Chrome/Electron on Electron when these
// FS operations are running while a BrowserWindow is destroyed (see WindowPortal).
// These "Uncaught illegal access" have no stacktrace, which seems to indicate a problem
// deep in Electron or related.
//
// We can't risk this.
//
// To avoid this, we use `safelyDoFsOperation` which will guard against these happening concurrently.
import { safelyDoFsOperation } from '../../Utils/ElectronConflictingOperationsMutex';

const path = DesktopService.getPath();
const fs = DesktopService.getFs();

/**
 * Create the EventsFunctionCodeWriter that writes generated code for events functions
 * to local files.
 */
export const makeLocalEventsFunctionCodeWriter = ({
  onWriteFile,
}: EventsFunctionCodeWriterCallbacks): EventsFunctionCodeWriter => {
  // The generated code for extensions will be stored in a temporary directory

  const outputDir = path
    ? path.join(
        DesktopService.getTmpDir(),
        `GDGeneratedEventsFunctions-` + getUID()
      )
    : `${DesktopService.getTmpDir()}/GDGeneratedEventsFunctions-${getUID()}`;
  try {
    if (fs) fs.mkdirSync(outputDir, { recursive: true });
  } catch (err) {
    console.error(
      'Unable to create the directory where to output events functions generated code: ',
      err
    );
  }

  const getPathFor = (codeNamespace: string) => {
    return `${outputDir}/${slugs(codeNamespace)}.js`;
  };

  return {
    getIncludeFileFor: (codeNamespace: string) => getPathFor(codeNamespace),
    writeFunctionCode: (
      functionCodeNamespace: string,
      code: string
    ): Promise<void> => {
      return safelyDoFsOperation(
        () =>
          new Promise((resolve, reject) => {
            const includeFile = getPathFor(functionCodeNamespace);
            onWriteFile({ includeFile, content: code });
            if (!fs) return reject(new Error('Filesystem is not supported.'));
            fs.writeFile(includeFile, code, err => {
              if (err) return reject(err);

              resolve();
            });
          })
      );
    },
    writeBehaviorCode: (
      behaviorCodeNamespace: string,
      code: string
    ): Promise<void> => {
      return safelyDoFsOperation(
        () =>
          new Promise((resolve, reject) => {
            const includeFile = getPathFor(behaviorCodeNamespace);
            onWriteFile({ includeFile, content: code });
            if (!fs) return reject(new Error('Filesystem is not supported.'));
            fs.writeFile(includeFile, code, err => {
              if (err) return reject(err);

              resolve();
            });
          })
      );
    },
    writeObjectCode: (
      objectCodeNamespace: string,
      code: string
    ): Promise<void> => {
      return safelyDoFsOperation(
        () =>
          new Promise((resolve, reject) => {
            const includeFile = getPathFor(objectCodeNamespace);
            onWriteFile({ includeFile, content: code });
            if (!fs) return reject(new Error('Filesystem is not supported.'));
            fs.writeFile(includeFile, code, err => {
              if (err) return reject(err);

              resolve();
            });
          })
      );
    },
  };
};
