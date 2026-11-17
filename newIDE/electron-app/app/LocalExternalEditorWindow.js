const path = require('path');
const electron = require('electron');
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.
const isDev = require('electron-is-dev');
const ipcMain = electron.ipcMain;
const { registerGdideProtocol } = require('./Utils/UrlLoader');
const { isSafeExternalUrl } = require('./DesktopIpcHandlers');

let externalEditorSession;
const getExternalEditorSession = () => {
  if (!externalEditorSession) {
    const session = electron.session.fromPartition('persist:gdevelop-external-editors');
    registerGdideProtocol({ isDev, protocol: session.protocol, externalOnly: true });
    externalEditorSession = session;
  }
  return externalEditorSession;
};

// Keep modal windows alive until they close.
const openModalWindows = new Set();

const relativeWidth = 0.7;
const relativeHeight = 0.9;
const backgroundColor = '#000000';

/**
 * Open a modal window containing an external HTML5 editor
 */
const loadExternalEditorWindow = ({
  devTools,
  parentWindow,
  indexSubPath,
  externalEditorInput,
}) => {
  return new Promise(resolve => {
    let externalEditorOutput = null;
    let isSettled = false;

    const hasValidParent = Boolean(
      parentWindow &&
        !parentWindow.isDestroyed() &&
        typeof parentWindow.getSize === 'function'
    );
    const parentSize = hasValidParent ? parentWindow.getSize() : [1280, 800];

    const windowOptions = {
      ...(hasValidParent
        ? { parent: parentWindow, modal: true }
        : { modal: false }),
      width: Math.floor(parentSize[0] * relativeWidth),
      height: Math.floor(parentSize[1] * relativeHeight),
      backgroundColor,
      center: true,
      webPreferences: {
        session: getExternalEditorSession(),
        webSecurity: true,
        nodeIntegration: false,
        sandbox: true,
        contextIsolation: true,
        preload: path.join(__dirname, 'externalEditorPreload.js'),
      },
    };

    const localModalWindow = new BrowserWindow(windowOptions);
    const modalWebContents = localModalWindow.webContents;
    openModalWindows.add(localModalWindow);
    localModalWindow.setMenu(null);

    const cleanup = () => {
      openModalWindows.delete(localModalWindow);
      ipcMain.removeListener('external-editor-ready', onReady);
      ipcMain.removeListener(
        'save-external-editor-output',
        saveExternalEditorOutput
      );
      ipcMain.removeListener(
        'external-editor-set-title',
        setExternalEditorTitle
      );
      ipcMain.removeListener(
        'external-editor-close',
        closeExternalEditorWindow
      );
      if (!isSettled) {
        isSettled = true;
        resolve(externalEditorOutput);
      }
    };

    /** @param {import('electron').IpcMainEvent} event */
    const onReady = event => {
      if (
        !event ||
        event.sender !== modalWebContents ||
        localModalWindow.isDestroyed() ||
        modalWebContents.isDestroyed()
      ) {
        return;
      }

      modalWebContents.send('open-external-editor-input', externalEditorInput);
      localModalWindow.show();
    };

    /**
     * @param {import('electron').IpcMainEvent} event
     * @param {any} newExternalEditorOutput
     */
    const saveExternalEditorOutput = (event, newExternalEditorOutput) => {
      if (!event || event.sender !== modalWebContents) return;

      externalEditorOutput = newExternalEditorOutput;
    };

    const setExternalEditorTitle = (event, title) => {
      if (
        !event ||
        event.sender !== modalWebContents ||
        localModalWindow.isDestroyed()
      ) {
        return;
      }
      localModalWindow.setTitle(typeof title === 'string' ? title : '');
    };

    const closeExternalEditorWindow = event => {
      if (
        !event ||
        event.sender !== modalWebContents ||
        localModalWindow.isDestroyed()
      ) {
        return;
      }
      localModalWindow.close();
    };

    ipcMain.on('external-editor-ready', onReady);
    ipcMain.on('save-external-editor-output', saveExternalEditorOutput);
    ipcMain.on('external-editor-set-title', setExternalEditorTitle);
    ipcMain.on('external-editor-close', closeExternalEditorWindow);

    // Load the index.html of the app.
    localModalWindow.loadURL('gdide://external/' + indexSubPath);
    if (isDev || devTools) localModalWindow.openDevTools();

    //Prevent any navigation inside the modal window.
    modalWebContents.on('will-navigate', (e, url) => {
      if (
        !modalWebContents.isDestroyed() &&
        url !== modalWebContents.getURL()
      ) {
        console.info('Opening in browser (because of will-navigate):', url);
        e.preventDefault();
        if (isSafeExternalUrl(url)) electron.shell.openExternal(url);
      }
    });

    // Prevent opening any website or url inside Electron
    modalWebContents.setWindowOpenHandler(details => {
      console.info('Opening in browser (because of new window): ', details.url);
      if (isSafeExternalUrl(details.url))
        electron.shell.openExternal(details.url);
      return { action: 'deny' };
    });

    localModalWindow.on('closed', () => {
      cleanup();
    });

    localModalWindow.on('close', () => {
      if (localModalWindow.isDestroyed()) {
        cleanup();
        return;
      }
      // use destroy as a workaround to force window closing, which is not done properly otherwise on Windows
      localModalWindow.destroy();
    });
  });
};

module.exports = {
  loadExternalEditorWindow,
};
