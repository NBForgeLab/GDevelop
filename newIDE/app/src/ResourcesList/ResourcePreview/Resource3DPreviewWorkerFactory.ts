// Import the worker (handled by worker-loader / Vite)
import Resource3DPreviewWorker from './Resource3DPreview.worker';

export const createResource3DPreviewWorker = (): Worker => {
  return new Resource3DPreviewWorker();
};
