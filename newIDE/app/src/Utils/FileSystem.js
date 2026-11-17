// @flow
import DesktopService from './DesktopService';
const fs = DesktopService.getFs();
const fsPromises = fs ? fs.promises : null;
const path = DesktopService.getPath();

const lastUsedDialogDirectoryKey = 'gd-last-used-file-dialog-directory';

/**
 * The folder of the last file or folder picked in a dialog, to be used as
 * the default path of dialogs: Electron opens them in the Downloads folder otherwise.
 */
export const getLastUsedDialogDirectory = (): string | void => {
  try {
    return localStorage.getItem(lastUsedDialogDirectoryKey) || undefined;
  } catch (error) {
    return undefined;
  }
};

export const rememberLastUsedDialogDirectory = (pickedPath: string) => {
  if (!path) return;
  try {
    localStorage.setItem(lastUsedDialogDirectoryKey, path.dirname(pickedPath));
  } catch (error) {
    console.warn('Unable to remember the last used dialog directory:', error);
  }
};

export const readJSONFile = async (filepath: string): Promise<Object> => {
  if (!fsPromises) throw new Error('Filesystem is not supported.');

  try {
    const data = await fsPromises.readFile(filepath, { encoding: 'utf8' });
    const dataObject = JSON.parse(data);
    return dataObject;
  } catch (ex) {
    throw new Error(filepath + ' is a corrupted/malformed file.');
  }
};

export const openFilePicker = ({
  title,
  properties,
  message,
  filters,
}: {|
  title: string,
  properties: Array<string>,
  message: string,
  filters: Array<{| name: string, extensions: Array<string> |}>,
|}): any | Promise<> => {
  if (!DesktopService.isDesktop()) return Promise.reject('Not supported');

  return DesktopService.showOpenDialog({
    title,
    properties,
    message,
    filters,
    defaultPath: getLastUsedDialogDirectory(),
  }).then(result => {
    const filePaths = result ? result.filePaths : null;
    if (!filePaths || !filePaths.length) return null;
    rememberLastUsedDialogDirectory(filePaths[0]);
    return filePaths[0];
  });
};

export const openFilesPicker = ({
  title,
  properties,
  message,
  filters,
}: {|
  title: string,
  properties: Array<string>,
  message: string,
  filters: Array<{| name: string, extensions: Array<string> |}>,
|}): any | Promise<> => {
  if (!DesktopService.isDesktop()) return Promise.reject('Not supported');

  return DesktopService.showOpenDialog({
    title,
    properties,
    message,
    filters,
    defaultPath: getLastUsedDialogDirectory(),
  }).then(result => {
    const filePaths = result ? result.filePaths : [];
    if (filePaths && filePaths.length)
      rememberLastUsedDialogDirectory(filePaths[0]);
    return filePaths;
  });
};
