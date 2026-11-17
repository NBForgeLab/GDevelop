// @flow
import DesktopService from '../../Utils/DesktopService';
import { addFinalNewline } from '../../Utils/Serializer';
const fs = DesktopService.getFs();
const path = DesktopService.getPath();

const writeJSONFile = (object: Object, filepath: string): Promise<void> => {
  if (!fs || !path)
    return Promise.reject(new Error('Filesystem is not supported.'));

  try {
    const content = addFinalNewline(JSON.stringify(object, null, 2));
    return fs.ensureDir(path.dirname(filepath)).then(
      () =>
        new Promise((resolve, reject) => {
          fs.writeFile(filepath, content, (err: ?Error) => {
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
  ): Promise<?string> => {
    if (!DesktopService.isDesktop()) return Promise.reject('Not supported');

    return DesktopService.showSaveDialog({
      title: 'Export an extension of the project',
      filters: [
        {
          name: 'GDevelop 5 "events based" extension',
          extensions: ['json'],
        },
      ],
      defaultPath: (extensionName || 'Extension') + '.json',
    }).then(saveDialogResult => {
      const filePath = saveDialogResult ? saveDialogResult.filePath : null;
      if (!filePath) return null;
      return filePath;
    });
  };

  static writeSerializedObject = (
    serializedObject: Object,
    filepath: string
  ): Promise<void> => {
    return writeJSONFile(serializedObject, filepath).catch(err => {
      console.error('Unable to write the events function extension:', err);
      throw err;
    });
  };
}
