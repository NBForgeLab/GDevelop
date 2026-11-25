import optionalRequire from '../../Utils/OptionalRequire';
import { addFinalNewline } from '../../Utils/Serializer';
const fs = optionalRequire('fs-extra');
const path = optionalRequire('path');
const remote = optionalRequire('@electron/remote');
const dialog = remote ? remote.dialog : null;

const writeJSONFile = (
  object: Record<string, any>,
  filepath: string
): Promise<void> => {
  if (!fs) return Promise.reject(new Error('Filesystem is not supported.'));

  try {
    const content = addFinalNewline(JSON.stringify(object, null, 2));
    return fs.ensureDir(path.dirname(filepath)).then(
      () =>
        new Promise<void>((resolve, reject) => {
          fs.writeFile(filepath, content, (err: Error | null | undefined) => {
            if (err) {
              return reject(err);
            }

            return resolve();
          });
        })
    );
  } catch (stringifyException) {
    return Promise.reject(stringifyException);
  }
};

export default class LocalEventsFunctionsExtensionWriter {
  static chooseEventsFunctionExtensionFile = (
    extensionName?: string
  ): Promise<string | null | undefined> => {
    if (!dialog) return Promise.reject('Not supported');
    const browserWindow = remote.getCurrentWindow();

    return dialog
      .showSaveDialog(browserWindow, {
        title: 'Export an extension of the project',
        filters: [
          {
            name: 'GDevelop 5 "events based" extension',
            extensions: ['json'],
          },
        ],
        defaultPath: (extensionName || 'Extension') + '.json',
      })
      .then(({ filePath }: { filePath?: string }) => {
        if (!filePath) return null;
        return filePath;
      });
  };

  static writeSerializedObject = (
    serializedObject: Record<string, any>,
    filepath: string
  ): Promise<void> => {
    return writeJSONFile(serializedObject, filepath).catch((err) => {
      console.error('Unable to write the events function extension:', err);
      throw err;
    });
  };
}
