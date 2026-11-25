// Mock for Resource3DPreviewWorkerFactory.ts to prevent "self is not defined" errors in tests

type MockWorkerMessage = {
  type?: string;
};

type MockWorker = {
  postMessage: (message: MockWorkerMessage) => void;
  onmessage: ((event: { data: unknown }) => void) | null;
  onerror: ((error: unknown) => void) | null;
  terminate: jest.Mock;
};

// Mock worker for tests
export const createMockResource3DPreviewWorker = (): MockWorker => {
  // Mock worker for tests
  const mockWorker: MockWorker = {
    postMessage: (message: MockWorkerMessage) => {
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

// Mock worker factory for tests
export const createResource3DPreviewWorker: jest.Mock<MockWorker, []> = jest.fn(
  createMockResource3DPreviewWorker
);
