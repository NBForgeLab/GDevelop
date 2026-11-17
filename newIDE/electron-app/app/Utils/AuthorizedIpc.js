/** Register editor-only IPC without exposing Electron events to a renderer. */
const createAuthorizedIpc = (ipc, isAuthorized) => ({
  handle(channel, handler) {
    ipc.handle(channel, (event, ...args) => {
      if (!isAuthorized(event))
        throw new Error('Unauthorized editor IPC sender.');
      return handler(event, ...args);
    });
  },
  on(channel, handler) {
    ipc.on(channel, (event, ...args) => {
      if (!isAuthorized(event)) {
        event.returnValue = {
          ok: false,
          error: { message: 'Unauthorized editor IPC sender.' },
        };
        return;
      }
      return handler(event, ...args);
    });
  },
});

module.exports = { createAuthorizedIpc };
