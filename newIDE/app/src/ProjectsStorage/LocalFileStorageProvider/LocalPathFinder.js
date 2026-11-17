// @flow
import generateName from '../../Utils/NewNameGenerator';
import DesktopService from '../../Utils/DesktopService';
const path = DesktopService.getPath();
const fs = DesktopService.getFs();

const findEmptyPath = (basePath: string) => {
  if (!fs || !path) return basePath;
  const localFs = fs;
  const localPath = path;

  const folderName = generateName('My project', name => {
    try {
      localFs.accessSync(localPath.join(basePath, name));
    } catch (ex) {
      return false;
    }
    return true;
  });

  return path.join(basePath, folderName);
};

/**
 * Returns the default workspace folder from the Documents folder or the Home folder
 */
export const findDefaultFolder = (): string => {
  const documentsPath =
    DesktopService.getAppPathSync('documents') ||
    DesktopService.getAppPathSync('home');
  if (!path) return documentsPath;
  return path.join(documentsPath, 'GDevelop projects');
};

/**
 * Returns the current workspace with a generated project name
 */
export const findEmptyPathInWorkspaceFolder = (
  defaultFolder: string | null
): string => {
  const folder = defaultFolder === null ? findDefaultFolder() : defaultFolder;
  return findEmptyPath(folder);
};
