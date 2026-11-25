import optionalRequire from '../../Utils/OptionalRequire';
const electron = optionalRequire('electron');
const ipcRenderer = electron ? electron.ipcRenderer : null;

type UploadOptions = {
  signedUrl: string;
  contentType: string;
};

export const uploadLocalFile = (
  localFilePath: string,
  uploadOptions: UploadOptions,
  onProgress: (progress: number, total: number) => void
): Promise<void> => {
  if (!ipcRenderer) return Promise.reject('No support for local file upload');

  ipcRenderer.removeAllListeners('local-file-upload-progress');
  ipcRenderer.removeAllListeners('local-file-upload-done');

  return new Promise((resolve, reject) => {
    ipcRenderer.on(
      'local-file-upload-progress',
      (
        _event: unknown,
        stepCurrentProgress: number,
        stepMaxProgress: number
      ) => {
        onProgress(stepCurrentProgress, stepMaxProgress);
      }
    );
    ipcRenderer.on(
      'local-file-upload-done',
      (_event: unknown, err: unknown) => {
        if (err) return reject(err);
        resolve();
      }
    );
    ipcRenderer.send('local-file-upload', localFilePath, uploadOptions);
  });
};
