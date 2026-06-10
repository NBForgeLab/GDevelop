// @flow
// Mock for Resource3DPreview.worker.js to prevent "self is not defined" errors in tests

// $FlowFixMe[incompatible-type] - Mock worker for tests
// $FlowFixMe[underconstrained-implicit-instantiation]
const MockWorker: JestMockFn<any, any> = vi.fn().mockImplementation(() => {
  return {
    postMessage: vi.fn(),
    onmessage: null,
    onerror: null,
    terminate: vi.fn(),
  };
});

export default MockWorker;
