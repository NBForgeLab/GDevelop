// @flow
// Import the worker (will be handled by worker-loader)
import Resource3DPreviewWorker from './Resource3DPreview.worker';

export const createResource3DPreviewWorker = (): Worker => {
  // $FlowFixMe[incompatible-type] - worker-loader types aren't recognized by Flow
  // $FlowFixMe[invalid-constructor]
  return new Resource3DPreviewWorker();
};
