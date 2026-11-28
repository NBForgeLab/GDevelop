const {
  BrowserWindow, // Module to create native browser window.
  ipcMain,
  shell,
  screen,
} = require('electron');
const isDev = require('electron-is-dev');
const { load } = require('./Utils/UrlLoader');

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// Map of preview windows with their parent window ID: { previewWindow, parentWindowId }
/** @type {Array<{ previewWindow: import('electron').BrowserWindow, parentWindowId: number | null }>} */
let previewWindows = [];

let openDevToolsByDefault = false;

/**
 * Open 1 or multiple windows running a preview of an exported game.
 * @param {{
 *   parentWindow: import('electron').BrowserWindow | null,
 *   previewBrowserWindowOptions: import('electron').BrowserWindowConstructorOptions,
 *   previewGameIndexHtmlPath: string,
 *   alwaysOnTop: boolean,
 *   hideMenuBar: boolean,
 *   numberOfWindows: number,
 *   captureOptions: any,
 *   openEvent: import('electron').IpcMainInvokeEvent,
 * }} options
 */
const openPreviewWindow = ({
  parentWindow,
  previewBrowserWindowOptions,
  previewGameIndexHtmlPath,
  alwaysOnTop,
  hideMenuBar,
  numberOfWindows,
  captureOptions,
  openEvent,
}) => {
  // If opening multiple windows at once, place them across the screen.
  const screenSize = screen.getPrimaryDisplay().workAreaSize;
  const screenWidth = screenSize.width;
  const screenHeight = screenSize.height;
  /** @type {Record<number, { x: number, y: number }>} */
  const positions = {
    // top-left
    1: { x: 0, y: 0 },
    // top-right
    2: { x: screenWidth / 2, y: 0 },
    // bottom-left
    3: { x: 0, y: screenHeight / 2 },
    // bottom-right
    4: { x: screenWidth / 2, y: screenHeight / 2 },
  };
  for (let i = 0; i < numberOfWindows; i++) {
    const windowPosition = numberOfWindows > 1 ? positions[i + 1] : undefined;
    /** @type {import('electron').BrowserWindowConstructorOptions} */
    const browserWindowOptions = {
      ...previewBrowserWindowOptions,
      parent: alwaysOnTop && parentWindow ? parentWindow : undefined,
      x: windowPosition ? windowPosition.x : undefined,
      y: windowPosition ? windowPosition.y : undefined,
    };

    /** @type {import('electron').BrowserWindow | null} */
    let previewWindow = new BrowserWindow(browserWindowOptions);
    const createdPreviewWindow = previewWindow;

    createdPreviewWindow.setMenuBarVisibility(hideMenuBar);
    createdPreviewWindow.webContents.on('devtools-opened', () => {
      openDevToolsByDefault = true;
    });
    createdPreviewWindow.webContents.on('devtools-closed', () => {
      openDevToolsByDefault = false;
    });

    if (openDevToolsByDefault) {
      createdPreviewWindow.webContents.openDevTools();
    }

    // Enable `@electron/remote` module for renderer process
    require('@electron/remote/main').enable(createdPreviewWindow.webContents);

    // Open external link in the OS default browser
    createdPreviewWindow.webContents.setWindowOpenHandler((details) => {
      shell.openExternal(details.url);
      return { action: 'deny' };
    });

    createdPreviewWindow.loadURL(previewGameIndexHtmlPath);

    // Track this preview window with its parent
    previewWindows.push({
      previewWindow: createdPreviewWindow,
      parentWindowId: parentWindow ? parentWindow.id : null,
    });

    createdPreviewWindow.on('closed', () => {
      previewWindows = previewWindows.filter(
        (entry) => entry.previewWindow !== createdPreviewWindow
      );
      // Only send message if the parent window still exists
      if (openEvent.sender && !openEvent.sender.isDestroyed()) {
        openEvent.sender.send('preview-window-closed');
      }
      previewWindow = null;
    });
  }
};

/** @param {number} windowId */
const closePreviewWindow = (windowId) => {
  const entry = previewWindows.find(
    (entry) => entry.previewWindow.id === windowId
  );
  if (entry && entry.previewWindow) {
    entry.previewWindow.close();
  }
};

/** @param {number} parentWindowId */
const closePreviewWindowsForParent = (parentWindowId) => {
  const entriesToClose = previewWindows.filter(
    (entry) => entry.parentWindowId === parentWindowId
  );
  entriesToClose.forEach((entry) => {
    try {
      if (entry.previewWindow && !entry.previewWindow.isDestroyed()) {
        entry.previewWindow.close();
      }
    } catch (error) {
      console.warn('Ignoring exception when closing preview window:', error);
    }
  });
};

const closeAllPreviewWindows = () => {
  previewWindows.forEach((entry) => {
    try {
      if (entry.previewWindow && !entry.previewWindow.isDestroyed()) {
        entry.previewWindow.close();
      }
    } catch (error) {
      console.warn('Ignoring exception when closing preview window:', error);
    }
  });
};

module.exports = {
  openPreviewWindow,
  closePreviewWindow,
  closePreviewWindowsForParent,
  closeAllPreviewWindows,
};
