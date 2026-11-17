// @flow
import {
  openFilesPicker,
  openFilePicker,
  readJSONFile,
} from '../../Utils/FileSystem';
import { type SerializedExtension } from '../../Utils/GDevelopServices/Extension';
import DesktopService from '../../Utils/DesktopService';
const fs = DesktopService.getFs();

export default class LocalEventsFunctionsExtensionOpener {
  static chooseEventsFunctionExtensionFile = (): Promise<Array<string>> => {
    return openFilesPicker({
      title: 'Import extensions into the project',
      properties: ['openFile', 'multiSelections'],
      message: 'Choose extension files to import (.json file)',
      filters: [
        {
          name: 'GDevelop 5 "events based" extension',
          extensions: ['json'],
        },
      ],
      // $FlowFixMe[incompatible-type]
    }).then(filePaths => filePaths);
  };

  static readEventsFunctionExtensionFile = (
    filepath: string
  ): Promise<SerializedExtension> => {
    return readJSONFile(filepath);
  };

  static chooseAssetPackFile = (): Promise<string> => {
    return openFilePicker({
      title: 'Import an asset pack',
      properties: ['openFile'],
      message: 'Choose an asset pack files to import (.gdo file)',
      filters: [
        {
          name: 'GDevelop 5 asset pack',
          extensions: ['gdo'],
        },
      ],
      // $FlowFixMe[incompatible-type]
    }).then(filePath => filePath);
  };

  static readAssetPackFile = async (filepath: string): Promise<Blob> => {
    if (!fs) throw new Error('Filesystem is not supported.');
    const buffer = await fs.promises.readFile(filepath);
    return new Blob([buffer]);
  };
}
