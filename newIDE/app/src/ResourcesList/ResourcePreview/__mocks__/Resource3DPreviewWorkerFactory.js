// @flow
// Mock for Resource3DPreviewWorkerFactory.js to prevent "self is not defined" errors in tests

// $FlowFixMe[unclear-type] - Mock worker for tests
export const createMockResource3DPreviewWorker = (): any => {
  // $FlowFixMe[unclear-type] - Mock worker for tests
  const mockWorker: any = {
    postMessage: (message: { type?: string }) => {
      // Answer that the worker could not be initialized, so that the previews
      // fall back to a generic image instead of waiting for the worker.
      if (message && message.type === 'INIT') {
        setTimeout(() => {
          if (mockWorker.onmessage) {
            mockWorker.onmessage({ data: { type: 'INIT', success: false } });
          }
        }, 0);
      }
    },
    onmessage: null,
    onerror: null,
    terminate: jest.fn(),
  };

  return mockWorker;
};

// $FlowFixMe[unclear-type] - Mock worker factory for tests
export const createResource3DPreviewWorker: JestMockFn<[], any> = jest.fn(
  createMockResource3DPreviewWorker
);
