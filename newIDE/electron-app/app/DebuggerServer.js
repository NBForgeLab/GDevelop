const WebSocket = require('ws');
const { getAvailablePort } = require('./Utils/AvailablePortFinder');
const log = require('electron-log');
const { findLocalIp } = require('./Utils/LocalNetworkIpFinder');

/**
 * @typedef {{
 *   onMessage: (payload: { id: string, message: import('ws').Data }) => void,
 *   onError: (error: unknown) => void,
 *   onConnectionClose: (payload: { id: string }) => void,
 *   onConnectionOpen: (payload: { id: string }) => void,
 *   onConnectionError: (payload: { id: string, errorMessage: string }) => void,
 *   onListening: (payload: { address: { address: string, port: number } }) => void,
 * }} DebuggerServerOptions
 */

// Track servers per window ID
/**
 * @type {Map<
 *   number | string,
 *   {
 *     wsServer: import('ws').Server,
 *     webSockets: Record<string, import('ws') | null>,
 *     nextDebuggerId: number,
 *     callbackHandlers: DebuggerServerOptions,
 *   }
 * >}
 */
const serversByWindow = new Map();

/** @param {import('ws').Server} wsServer */
const getServerAddress = (wsServer) => {
  const serverAddress = wsServer.address();
  return {
    address: findLocalIp() || '127.0.0.1',
    port:
      serverAddress && typeof serverAddress === 'object'
        ? serverAddress.port
        : 0,
  };
};

/**
 * This module creates a WebSocket server listening for a connection
 * and simply forwards the messages.
 * Debugger logic is made inside Debugger (in newIDE) or gdjs.AbstractDebuggerClient
 * (in GDJS).
 */
module.exports = {
  /**
   * @param {number | string} windowId
   * @param {DebuggerServerOptions} options
   */
  startDebuggerServer: (windowId, options) => {
    const existingServer = serversByWindow.get(windowId);

    if (existingServer) {
      // Server already exists for this window, just call onListening
      return options.onListening({
        address: getServerAddress(existingServer.wsServer),
      });
    }

    getAvailablePort(3030, 4000).then(
      (port) => {
        const wsServer = new WebSocket.Server({ port });
        /** @type {Record<string, import('ws') | null>} */
        const webSockets = {};
        let nextDebuggerId = 0;

        serversByWindow.set(windowId, {
          wsServer,
          webSockets,
          nextDebuggerId,
          callbackHandlers: options,
        });

        wsServer.on('connection', function connection(newWebSocket) {
          const id = 'preview-ws-' + nextDebuggerId++;
          webSockets[id] = newWebSocket;
          log.info(
            `Debugger connection with id "${id}" opened for window ${windowId}.`
          );

          newWebSocket.on('message', (message) => {
            // log.info(`Debugger connection with id "${id}" received message.`);
            options.onMessage({ id, message });
          });

          newWebSocket.on('close', () => {
            log.info(
              `Debugger connection with id "${id}" closed for window ${windowId}.`
            );
            webSockets[id] = null;
            options.onConnectionClose({ id });
          });

          newWebSocket.on('error', (error) => {
            const errorMessage = error.message || 'Unknown error';
            log.error(
              `Error in debugger connection with id "${id}" for window ${windowId}: ${errorMessage}.`
            );
            options.onConnectionError({ id, errorMessage });
          });

          options.onConnectionOpen({ id });
        });

        wsServer.on('listening', () => {
          log.info(
            `Debugger listening for connections for window ${windowId}.`
          );
          options.onListening({ address: getServerAddress(wsServer) });
        });

        wsServer.on('error', (error) => {
          log.error(`Debugger server errored for window ${windowId}.`);
          options.onError(error);
          module.exports.closeServer(windowId);
        });
      },
      (err) => {
        log.error(
          `Could not find a port for the Debugger server for window ${windowId}.`
        );
        options.onError(err);
      }
    );
  },

  /** @param {number | string} windowId */
  closeServer: (windowId) => {
    const serverData = serversByWindow.get(windowId);
    if (serverData && serverData.wsServer) {
      try {
        serverData.wsServer.close();
      } catch (e) {
        log.warn(`Error closing debugger server for window ${windowId}:`, e);
      }
    }
    serversByWindow.delete(windowId);
  },

  /** @param {number | string} windowId */
  closeAllConnections: (windowId) => {
    const serverData = serversByWindow.get(windowId);
    if (!serverData) return;

    // The object is emptied rather than replaced: the connection handler of
    // the server keeps adding the next connections to this same object.
    Object.keys(serverData.webSockets).forEach((id) => {
      const webSocket = serverData.webSockets[id];
      delete serverData.webSockets[id];
      if (!webSocket) return;

      try {
        webSocket.close();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        log.warn(
          `Unable to close debugger connection with id "${id}" for window ${windowId}: ${errorMessage}`
        );
      }
    });
  },

  /**
   * @param {number | string} windowId
   * @param {{ id: string, message: any }} payload
   * @param {(error?: unknown) => void} cb
   */
  sendMessage: (windowId, { id, message }, cb) => {
    const serverData = serversByWindow.get(windowId);
    if (!serverData) {
      return cb(`No debugger server for window ${windowId}`);
    }

    const webSocket = serverData.webSockets[id];
    if (!webSocket) {
      return cb(
        `Debugger connection with id "${id}" does not exist for window ${windowId}`
      );
    }

    webSocket.send(message, (err) => {
      cb(err);
    });
  },

  /**
   * Stop all debugger servers (for cleanup on app quit)
   */
  stopAllServers: () => {
    serversByWindow.forEach((serverData, windowId) => {
      if (serverData && serverData.wsServer) {
        try {
          // Close all websocket connections first
          if (serverData.webSockets) {
            Object.keys(serverData.webSockets).forEach((id) => {
              const ws = serverData.webSockets[id];
              if (ws) {
                try {
                  ws.close();
                } catch (e) {
                  // Silently ignore errors during shutdown
                }
              }
            });
          }
          // Then close the server
          serverData.wsServer.close(() => {
            // Callback intentionally empty - we're shutting down
          });
        } catch (e) {
          // Silently ignore errors during shutdown to prevent crashes
        }
      }
    });
    serversByWindow.clear();
  },
};
