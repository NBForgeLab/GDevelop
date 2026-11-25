export declare const getLocalTempDir: () => string;

export declare const removeLocalTempDirOfCli: () => void;

export type UrlFileDescriptor = {
  filePath: string;
  url: string;
};

declare class LocalFileSystem {
  _downloadUrlsToLocalFiles: boolean;
  _filesToDownload: { [filePath: string]: string };
  constructor(
    options?: {
      downloadUrlsToLocalFiles: boolean;
    } | null
  );
  getAllUrlFilesIn: (pathPrefix: string) => Array<UrlFileDescriptor>;
  mkDir: (path: string) => any;
  dirExists: (path: string) => any;
  clearDir: (path: string) => void;
  getTempDir: () => any;
  fileNameFrom: (fullPath: string) => any;
  dirNameFrom: (fullPath: string) => any;
  makeAbsolute: (filename: string, baseDirectory: string) => any;
  makeRelative: (filename: string, baseDirectory: string) => any;
  isAbsolute: (fullPath: string) => any;
  copyFile: (source: string, dest: string) => any;
  writeToFile: (file: string, contents: string) => any;
  readFile: (file: string) => any;
  readDir: (path: string, ext: string) => any;
  fileExists: (filePath: string) => any;
}

export default LocalFileSystem;
