import {
  type PreviewDebuggerServer,
  type PreviewDebuggerServerCallbacks,
} from '../../PreviewLauncher';

const mockIpcRendererListeners: Map<
  string,
  Array<(...args: Array<any>) => any>
> = new Map();
const mockIpcRenderer = {
  on: jest.fn<void, [string, (...args: Array<any>) => any]>(),
  removeAllListeners: jest.fn<void, [string]>(),
  send: jest.fn<void, Array<any>>(),
};

jest.mock('../../../Utils/OptionalRequire', () =>
  jest.fn((moduleName: string) =>
    moduleName === 'electron' ? { ipcRenderer: mockIpcRenderer } : null
  )
);

/** Simulate a message sent by the Electron main process. */
const emitFromMainProcess = (channel: string, payload: any) =>
  (mockIpcRendererListeners.get(channel) || []).forEach((listener) =>
    listener({}, payload)
  );

/**
 * The debugger server keeps its state at the module level, so each test must
 * start from a freshly loaded module.
 */
const loadDebuggerServer = (): PreviewDebuggerServer => {
  jest.resetModules();
  // required to get a fresh module state.
  return require('./LocalPreviewDebuggerServer').localPreviewDebuggerServer;
};

const makeCallbacks = (): PreviewDebuggerServerCallbacks => ({
  onErrorReceived: jest.fn<undefined, Array<any>>(),
  onServerStateChanged: jest.fn<undefined, Array<any>>(),
  onConnectionClosed: jest.fn<undefined, Array<any>>(),
  onConnectionOpened: jest.fn<undefined, Array<any>>(),
  onConnectionErrored: jest.fn<undefined, Array<any>>(),
  onHandleParsedMessage: jest.fn<undefined, Array<any>>(),
});

describe('LocalPreviewDebuggerServer', () => {
  beforeEach(() => {
    // The server registers a listener for the embedded game frames on the window.
    (global as any).window = { addEventListener: jest.fn() };
    mockIpcRendererListeners.clear();
    // `resetMocks` is enabled, so the implementations are set for each test.
    mockIpcRenderer.on.mockImplementation(
      (channel: string, listener: (...args: Array<any>) => any) => {
        mockIpcRendererListeners.set(channel, [
          ...(mockIpcRendererListeners.get(channel) || []),
          listener,
        ]);
      }
    );
    mockIpcRenderer.removeAllListeners.mockImplementation((channel: string) => {
      mockIpcRendererListeners.delete(channel);
    });
    jest.useFakeTimers();
  });
  afterEach(() => {
    jest.useRealTimers();
    delete (global as any).window;
  });

  it('is stopped until the server is started', () => {
    const debuggerServer = loadDebuggerServer();

    expect(debuggerServer.getServerState()).toBe('stopped');
  });

  it('is starting while waiting for the server to listen', () => {
    const debuggerServer = loadDebuggerServer();
    const callbacks = makeCallbacks();
    debuggerServer.registerCallbacks(callbacks);

    const startPromise = debuggerServer.startServer({});
    startPromise.catch(() => {});

    expect(debuggerServer.getServerState()).toBe('starting');
    expect(callbacks.onServerStateChanged).toHaveBeenCalledTimes(1);
  });

  it('is started once the server is listening', () => {
    const debuggerServer = loadDebuggerServer();
    const callbacks = makeCallbacks();
    debuggerServer.registerCallbacks(callbacks);

    debuggerServer.startServer({}).catch(() => {});
    emitFromMainProcess('debugger-start-server-done', {
      address: { address: '127.0.0.1', port: 3030 },
    });

    expect(debuggerServer.getServerState()).toBe('started');
    expect(callbacks.onServerStateChanged).toHaveBeenCalledTimes(2);
  });

  it('goes back to stopped if the server does not start in time', async () => {
    const debuggerServer = loadDebuggerServer();
    const callbacks = makeCallbacks();
    debuggerServer.registerCallbacks(callbacks);

    const startPromise = debuggerServer.startServer({});
    const startError = startPromise.catch((error: unknown) => error);
    jest.advanceTimersByTime(5000);

    expect(await startError).toEqual(expect.any(Error));
    expect(debuggerServer.getServerState()).toBe('stopped');
  });

  it('stays started when the start timeout is reached after the server started', () => {
    const debuggerServer = loadDebuggerServer();
    const callbacks = makeCallbacks();
    debuggerServer.registerCallbacks(callbacks);

    debuggerServer.startServer({}).catch(() => {});
    emitFromMainProcess('debugger-start-server-done', {
      address: { address: '127.0.0.1', port: 3030 },
    });
    jest.advanceTimersByTime(5000);

    expect(debuggerServer.getServerState()).toBe('started');
  });

  it('goes back to stopped when the server errors', () => {
    const debuggerServer = loadDebuggerServer();
    const callbacks = makeCallbacks();
    debuggerServer.registerCallbacks(callbacks);

    debuggerServer.startServer({}).catch(() => {});
    emitFromMainProcess('debugger-error-received', new Error('Some error'));

    expect(debuggerServer.getServerState()).toBe('stopped');
    expect(callbacks.onErrorReceived).toHaveBeenCalledTimes(1);
  });

  it('does not send messages to a server that is not started yet', () => {
    const debuggerServer = loadDebuggerServer();
    jest.spyOn(console, 'error').mockImplementation(() => {});

    const startPromise = debuggerServer.startServer({});
    startPromise.catch(() => {});
    debuggerServer.sendMessage('preview-ws-0', { command: 'play' });

    expect(mockIpcRenderer.send).not.toHaveBeenCalledWith(
      'debugger-send-message',
      expect.anything()
    );
  });
});
