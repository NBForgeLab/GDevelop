// @flow
import DesktopService from '../../Utils/DesktopService';
import { type FileMetadata } from '../index';
import { unsplit } from '../../Utils/ObjectSplitter';
import { openFilePicker, readJSONFile } from '../../Utils/FileSystem';
const fs = DesktopService.getFs();
const path = DesktopService.getPath();

export const onOpenWithPicker = (): Promise<?FileMetadata> => {
  return openFilePicker({
    title: 'Open a project',
    properties: ['openFile'],
    message:
      'If you want to open your GDevelop 4 project, be sure to save it as a .json file',
    filters: [{ name: 'GDevelop 5 project', extensions: ['json'] }],
    // $FlowFixMe[incompatible-type]
  }).then(filePath => (filePath ? { fileIdentifier: filePath } : null));
};

export const onOpen = (
  fileMetadata: FileMetadata
): Promise<{|
  content: Object,
|}> => {
  if (!path) return Promise.reject(new Error('Unsupported'));
  const localPath = path;
  const filePath = fileMetadata.fileIdentifier;
  const projectPath = localPath.dirname(filePath);
  return DesktopService.requestProjectAccess(filePath)
    .then(() => readJSONFile(filePath))
    .then(object => {
      DesktopService.setWindowProjectPath(filePath);
      return unsplit(object, {
        getReferencePartialObject: referencePath => {
          return readJSONFile(
            localPath.join(projectPath, referencePath) + '.json'
          );
        },
        isReferenceMagicPropertyName: '__REFERENCE_TO_SPLIT_OBJECT',
        // Limit unsplitting to depth 3 (which would allow properties of layouts/external layouts/external events
        // to be un-splitted, but not the content of these properties), to avoid very slow processing
        // of large game files.
        maxUnsplitDepth: 3,
      }).then(() => {
        return { content: object };
      });
    });
};

export const getAutoSaveCreationDate = async (
  fileMetadata: FileMetadata,
  compareLastModified: boolean
): Promise<?number> => {
  if (!fs) return null;
  const filePath = fileMetadata.fileIdentifier;
  const autoSavePath = filePath + '.autosave';
  await DesktopService.requestProjectAccess(filePath);
  if (fs.existsSync(autoSavePath)) {
    const autoSavedTime = fs.statSync(autoSavePath).mtime.getTime();
    if (!compareLastModified) {
      return autoSavedTime;
    }
    try {
      const saveTime = fs.statSync(filePath).mtime.getTime();
      // When comparing the last modified time, add a 5 seconds margin to avoid
      // showing the warning if the user has just saved the project, or if the
      // project has been decompressed from a zip file, causing the last modified
      // time to be the time of decompression.
      return autoSavedTime > saveTime + 5000 ? autoSavedTime : null;
    } catch (err) {
      console.error('Unable to compare *.autosave to project', err);
      return null;
    }
  }
  return null;
};

export const onGetAutoSave = (
  fileMetadata: FileMetadata
): Promise<{
  fileIdentifier: string,
  gameId?: string,
  lastModifiedDate?: number,
  name?: string,
  ownerId?: string,
  version?: string,
}> => {
  return Promise.resolve({
    ...fileMetadata,
    fileIdentifier: fileMetadata.fileIdentifier + '.autosave',
  });
};
