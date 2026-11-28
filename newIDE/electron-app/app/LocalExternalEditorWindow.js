const electron = require('electron');
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.
const isDev = require('electron-is-dev');
const ipcMain = electron.ipcMain;
const { load } = require('./Utils/UrlLoader');

// Generic function to load external editors in a modal window.
// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
/** @type {import('electron').BrowserWindow | null} */
let modalWindow = null;

const relativeWidth = 0.7;
const relativeHeight = 0.9;
const backgroundColor = '#000000';

/**
 * Open a modal window containing an external HTML5 editor
 * @param {{
 *   devTools: boolean,
 *   parentWindow: import('electron').BrowserWindow,
 *   indexSubPath: string,
 *   externalEditorInput: any,
 * }} options
 * @returns {Promise<any>}
 */
const loadExternalEditorWindow = ({
  devTools,
  parentWindow,
  indexSubPath,
  externalEditorInput,
}) => {
  return new Promise((resolve) => {
    /** @type {any} */
    let externalEditorOutput = null;

    const windowOptions = {
      parent: parentWindow,
      width: Math.floor(parentWindow.getSize()[0] * relativeWidth),
      height: Math.floor(parentWindow.getSize()[1] * relativeHeight),
      backgroundColor,
      modal: true,
      center: true,
      webPreferences: {
        webSecurity: false,
        // Allow Node.js API access in renderer process, as long
        // as we've not removed dependency on it and on "@electron/remote".
        nodeIntegration: true,
        sandbox: false,
        contextIsolation: false,
      },
    };

    const createdModalWindow = new BrowserWindow(windowOptions);
    modalWindow = createdModalWindow;
    createdModalWindow.setMenu(null);

    // Enable `@electron/remote` module for renderer process
    require('@electron/remote/main').enable(createdModalWindow.webContents);

    /** @param {import('electron').IpcMainEvent} event */
    const onReady = (event) => {
      if (event.sender !== createdModalWindow.webContents) return;

      createdModalWindow.webContents.send(
        'open-external-editor-input',
        externalEditorInput
      );
      createdModalWindow.show();
    };

    /**
     * @param {import('electron').IpcMainEvent} event
     * @param {any} newExternalEditorOutput
     */
    const saveExternalEditorOutput = (event, newExternalEditorOutput) => {
      if (event.sender !== createdModalWindow.webContents) return;

      externalEditorOutput = newExternalEditorOutput;
    };

    ipcMain.on('external-editor-ready', onReady);
    ipcMain.on('save-external-editor-output', saveExternalEditorOutput);

    // Load the index.html of the app.
    load({
      window: createdModalWindow,
      isDev,
      path: '/external/' + indexSubPath,
      devTools,
    });

    //Prevent any navigation inside the modal window.
    createdModalWindow.webContents.on('will-navigate', (e, url) => {
      if (url !== createdModalWindow.webContents.getURL()) {
        console.info('Opening in browser (because of will-navigate):', url);
        e.preventDefault();
        electron.shell.openExternal(url);
      }
    });

    // Prevent opening any website or url inside Electron
    createdModalWindow.webContents.setWindowOpenHandler((details) => {
      console.info('Opening in browser (because of new window): ', details.url);
      electron.shell.openExternal(details.url);
      return { action: 'deny' };
    });

    createdModalWindow.on('closed', () => {
      modalWindow = null;

      ipcMain.removeListener('external-editor-ready', onReady);
      ipcMain.removeListener(
        'save-external-editor-output',
        saveExternalEditorOutput
      );
      resolve(externalEditorOutput);
    });

    createdModalWindow.on('close', () => {
      if (!modalWindow) return;
      // use destroy as a workaround to force window closing, which is not done properly otherwise on Windows
      createdModalWindow.destroy();
      modalWindow = null;
    });
  });
};

module.exports = {
  loadExternalEditorWindow,
};
