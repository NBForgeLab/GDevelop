// Import the worker (handled by worker-loader / Vite)
import BackgroundSerializerWorker from './BackgroundSerializer.worker';

export const createBackgroundSerializerWorker = (): Worker => {
  return new BackgroundSerializerWorker();
};
