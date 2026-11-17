// @flow
import DesktopService from '../../Utils/DesktopService';

type UploadOptions = {
  signedUrl: string,
  contentType: string,
};

export const uploadLocalFile = (
  localFilePath: string,
  uploadOptions: UploadOptions,
  onProgress: (progress: number, total: number) => void
): Promise<void> => {
  if (!DesktopService.isDesktop()) {
    return Promise.reject('No support for local file upload');
  }

  return new Promise((resolve, reject) => {
    const unsubscribeProgress = DesktopService.onIpcEvent(
      'local-file-upload-progress',
      (stepCurrentProgress, stepMaxProgress) => {
        onProgress(stepCurrentProgress, stepMaxProgress);
      }
    );
    let unsubscribeDone: () => void = () => {};
    unsubscribeDone = DesktopService.onIpcEvent(
      'local-file-upload-done',
      err => {
        unsubscribeProgress();
        unsubscribeDone();
        if (err) return reject(err);
        resolve();
      }
    );
    DesktopService.fileTransfer.uploadLocalFile(localFilePath, uploadOptions);
  });
};
