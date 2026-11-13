// @flow
// Import the worker (handled by worker-loader)
import BackgroundSerializerWorker from './BackgroundSerializer.worker';

export const createBackgroundSerializerWorker = (): Worker => {
  // $FlowFixMe[incompatible-type] - worker-loader types aren't recognized by Flow
  // $FlowFixMe[invalid-constructor]
  return new BackgroundSerializerWorker();
};
