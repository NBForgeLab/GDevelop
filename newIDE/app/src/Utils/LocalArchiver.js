// @flow

import DesktopService from './DesktopService';

// TODO: Move in a Archiver folder?
/**
 * Archive the given folder to a file. Only available when running on Electron runtime.
 */
export const archiveLocalFolder = ({
  path,
  outputFilename,
  sizeLimit,
}: {|
  path: string,
  outputFilename: string,
  sizeLimit?: number,
|}): Promise<string> => {
  return DesktopService.archiveFolder({
    folderPath: path,
    outputFilename,
    sizeLimit,
  });
};
