type UploadOptions = {
  signedUrl: string;
  contentType: string;
};

export declare const uploadBlobFile: (
  blob: Blob,
  uploadOptions: UploadOptions,
  onProgress: (progress: number, total: number) => void
) => Promise<void>;
