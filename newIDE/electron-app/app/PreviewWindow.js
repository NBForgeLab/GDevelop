const path = require('path');
const fs = require('fs');
const { createFileAccessPolicy } = require('./Utils/FileAccessPolicy');
const previewFilePolicies = new WeakMap();
const { createPreviewSteamSession } = require('./PreviewSteam');
const previewSteamSessions = new WeakMap();
const {
  app,
  BrowserWindow, // Module to create native browser window.
  ipcMain,
  dialog,
  shell,
  screen,
  session,
  net,
} = require('electron');
const { URL } = require('url');
const { isSafeExternalUrl } = require('./DesktopIpcHandlers');
const {
  resolveGdevelopFileUrlToLocalPath,
  resolveCanonicalPathSync,
  isSensitiveCanonicalPath,
  isPathWithinCanonicalRoot,
  registerGdevelopFileProtocol,
} = require('./Utils/GdevelopFileProtocol');

const { readFileOptions } = require('./Utils/ReadFileOptions');
const { resolvePreviewDirectory } = require('./Utils/PreviewDirectory');

// Keep the original persistent partition for the first preview. Each concurrently
// open window gets its own protocol handler; closing it revokes its file grants.
const previewSessionSlots = [];
const acquirePreviewSession = policy => {
  let slot = previewSessionSlots.indexOf(null);
  if (slot === -1) slot = previewSessionSlots.length;
  const partition = 'persist:gdevelop-preview' + (slot ? '-' + slot : '');
  const previewSession = session.fromPartition(partition);
  previewSessionSlots[slot] = policy;
  registerGdevelopFileProtocol({
    protocol: previewSession.protocol,
    net,
    isPathAllowed: target =>
      previewSessionSlots[slot] === policy && policy.hasAccess(target, 'read'),
  });
  return {
    session: previewSession,
    release: () => {
      previewSessionSlots[slot] = null;
      previewSession.protocol.unhandle('gdevelop-file');
    },
  };
};

const ALLOWED_PREVIEW_PROTOCOLS = new Set(['gdevelop-file:', 'http:']);
const ALLOWED_PREVIEW_HTTP_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

const ALLOWED_PREVIEW_WINDOW_METHODS = new Set([
  'isFocused',
  'isVisible',
  'isMaximized',
  'isMinimized',
  'isEnabled',
  'isResizable',
  'isMovable',
  'isMaximizable',
  'isMinimizable',
  'isFullScreenable',
  'isClosable',
  'isAlwaysOnTop',
  'isKiosk',
  'isFullScreen',
  'hasShadow',
  'getOpacity',
  'getPosition',
  'getSize',
  'getContentSize',
  'focus',
  'blur',
  'show',
  'showInactive',
  'hide',
  'maximize',
  'unmaximize',
  'minimize',
  'restore',
  'setEnabled',
  'setResizable',
  'setMovable',
  'setMaximizable',
  'setMinimizable',
  'setFullScreenable',
  'setClosable',
  'setAlwaysOnTop',
  'setPosition',
  'setContentSize',
  'center',
  'setFullScreen',
  'setKiosk',
  'flashFrame',
  'setHasShadow',
  'setOpacity',
  'setContentProtection',
  'setFocusable',
  'close',
]);

const ALLOWED_PREVIEW_APP_PATHS = new Set([
  'desktop',
  'documents',
  'pictures',
  'exe',
  'userData',
  'home',
  'temp',
]);

const ALLOWED_PREVIEW_PATH_OPS = new Set(['dirname', 'basename', 'extname']);

const getPreviewUserDataPath = () => {
  const ideUserData = app.getPath('userData');
  const previewUserData = path.join(ideUserData, 'PreviewUserData');
  try {
    fs.mkdirSync(previewUserData, { recursive: true });
  } catch (e) {}
  return previewUserData;
};

const assertSafePreviewFilePath = (
  targetPath,
  { isWrite = false, policy } = {}
) => {
  if (typeof targetPath !== 'string' || !targetPath.trim()) {
    throw new Error('Preview file path must be a non-empty string.');
  }
  if (targetPath.includes('\0')) {
    throw new Error('Preview file path contains null byte.');
  }
  if (!path.isAbsolute(targetPath)) {
    throw new Error('Preview file path must be absolute.');
  }
  if (
    process.platform === 'win32' &&
    /^[\\/]{2}/.test(targetPath) &&
    (!policy || !policy.hasAccess(targetPath, isWrite ? 'write' : 'read'))
  ) {
    throw new Error('Unapproved network paths are not accessible to previews.');
  }
  const canonicalPath = resolveCanonicalPathSync(targetPath);
  if (!canonicalPath) {
    throw new Error('Unable to resolve preview file path.');
  }
  if (isSensitiveCanonicalPath(canonicalPath)) {
    throw new Error('Refused access to sensitive system/credential path.');
  }

  // Isolate preview saves away from the GDevelop IDE userData folder
  // (IndexedDB, Cookies, Preferences, open-projects.json, etc.).
  const ideUserData = resolveCanonicalPathSync(app.getPath('userData'));
  const previewUserData = resolveCanonicalPathSync(getPreviewUserDataPath());
  if (
    ideUserData &&
    isPathWithinCanonicalRoot(canonicalPath, ideUserData) &&
    (!previewUserData ||
      !isPathWithinCanonicalRoot(canonicalPath, previewUserData))
  ) {
    throw new Error('Refused preview access to GDevelop IDE userData.');
  }

  if (isWrite) {
    const appPath = resolveCanonicalPathSync(app.getAppPath());
    if (appPath && isPathWithinCanonicalRoot(canonicalPath, appPath)) {
      throw new Error('Refused preview write inside application bundle.');
    }
    if (process.resourcesPath) {
      const resourcesPath = resolveCanonicalPathSync(process.resourcesPath);
      if (
        resourcesPath &&
        isPathWithinCanonicalRoot(canonicalPath, resourcesPath)
      ) {
        throw new Error('Refused preview write inside resources directory.');
      }
    }
  }

  const accessPolicy =
    policy ||
    createFileAccessPolicy({ writeRoots: [getPreviewUserDataPath()] });
  accessPolicy.assertAccess(targetPath, isWrite ? 'write' : 'read');
  return path.resolve(targetPath);
};

// File System events may intentionally target a location outside preview saves.
// Only a native, per-preview user decision can expand that capability.
const authorizePreviewFilePath = (win, targetPath, options = {}) => {
  const policy = previewFilePolicies.get(win);
  try {
    return assertSafePreviewFilePath(targetPath, { ...options, policy });
  } catch (error) {
    if (error.code !== 'EACCES' || !policy) throw error;
    const mode = options.isWrite ? 'write' : 'read';
    const directory = !!options.directory;
    const answer = dialog.showMessageBoxSync(win, {
      type: 'question',
      title: 'Game preview file access',
      message: `Allow this game preview to ${
        options.isWrite ? 'read and write' : 'read'
      } this ${directory ? 'folder and its contents' : 'file'}?`,
      detail: path.resolve(targetPath),
      buttons: ['Cancel', 'Allow'],
      defaultId: 0,
      cancelId: 0,
      noLink: true,
    });
    if (answer !== 1) throw error;
    if (directory) policy.grantRoot(targetPath, mode);
    else policy.grantFile(targetPath, mode);
    return assertSafePreviewFilePath(targetPath, { ...options, policy });
  }
};

const sanitizePreviewBrowserWindowOptions = rawOptions => {
  const options =
    rawOptions && typeof rawOptions === 'object' ? rawOptions : {};
  const rawWebPrefs =
    options.webPreferences && typeof options.webPreferences === 'object'
      ? options.webPreferences
      : {};
  const width =
    typeof options.width === 'number' &&
    Number.isFinite(options.width) &&
    options.width > 0
      ? Math.round(options.width)
      : 800;
  const height =
    typeof options.height === 'number' &&
    Number.isFinite(options.height) &&
    options.height > 0
      ? Math.round(options.height)
      : 600;

  return {
    width,
    height,
    useContentSize:
      options.useContentSize !== undefined ? !!options.useContentSize : true,
    title:
      typeof options.title === 'string' && options.title
        ? options.title
        : 'Preview',
    backgroundColor:
      typeof options.backgroundColor === 'string' && options.backgroundColor
        ? options.backgroundColor
        : '#000000',
    // Strictly enforce sandbox isolation and preload bridge on every preview window;
    // never forward caller-supplied Node/preload/webSecurity flags.
    webPreferences: {
      webSecurity: true,
      nodeIntegration: false,
      sandbox: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'previewPreload.js'),
      backgroundThrottling:
        rawWebPrefs.backgroundThrottling !== undefined
          ? !!rawWebPrefs.backgroundThrottling
          : false,
    },
  };
};

const assertSafePreviewIndexUrl = rawUrl => {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    throw new Error('Invalid preview index path.');
  }
  let parsed;
  try {
    parsed = new URL(rawUrl);
  } catch (err) {
    throw new Error('Malformed preview index URL.');
  }
  if (!ALLOWED_PREVIEW_PROTOCOLS.has(parsed.protocol)) {
    throw new Error(`Disallowed preview URL protocol: ${parsed.protocol}`);
  }
  if (parsed.protocol === 'gdevelop-file:') {
    if (!resolveGdevelopFileUrlToLocalPath(rawUrl)) {
      throw new Error('Disallowed preview gdevelop-file URL.');
    }
  } else if (
    parsed.protocol === 'http:' &&
    !ALLOWED_PREVIEW_HTTP_HOSTS.has(parsed.hostname)
  ) {
    throw new Error(`Disallowed preview remote host: ${parsed.hostname}`);
  }
  return rawUrl;
};

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
// Map of preview windows with their parent window ID: { previewWindow, parentWindowId }
let previewWindows = [];
const previewWindowByWebContentsId = new Map();
const registeredPreviewIpcMains = new WeakSet();

const getAuthorizedPreviewWindow = event => {
  if (!event || !event.sender) return null;
  const senderId = event.sender.id;
  if (senderId === undefined || senderId === null) return null;
  const previewWin = previewWindowByWebContentsId.get(senderId);
  if (!previewWin || previewWin.isDestroyed()) return null;
  if (
    event.senderFrame &&
    event.sender.mainFrame &&
    event.senderFrame !== event.sender.mainFrame
  )
    return null;
  return previewWin;
};

const ensurePreviewIpcHandlers = () => {
  if (!ipcMain || registeredPreviewIpcMains.has(ipcMain)) return;
  registeredPreviewIpcMains.add(ipcMain);

  const getSteam = event => {
    const win = getAuthorizedPreviewWindow(event);
    if (!win) throw new Error('Unauthorized preview Steam caller.');
    return previewSteamSessions.get(win);
  };
  ipcMain.on('preview-steam-sync', (event, method, args) => {
    try {
      const steam = getSteam(event);
      const result =
        method === 'initialize'
          ? steam.initialize(args && args[0])
          : steam.call(method, args);
      event.returnValue = { ok: true, result };
    } catch (error) {
      event.returnValue = { ok: false, error: { message: error.message } };
    }
  });
  ipcMain.handle('preview-steam-invoke', (event, method, args) =>
    getSteam(event).invoke(method, args)
  );

  ipcMain.on('preview-window-call-sync', (event, methodName, args) => {
    const win = getAuthorizedPreviewWindow(event);
    if (!win) {
      event.returnValue = {
        ok: false,
        error: { message: 'Unauthorized preview window IPC caller.' },
      };
      return;
    }
    if (!ALLOWED_PREVIEW_WINDOW_METHODS.has(methodName)) {
      event.returnValue = {
        ok: false,
        error: {
          message: `Disallowed preview window method: ${String(methodName)}`,
        },
      };
      return;
    }
    try {
      const fn = win[methodName];
      if (typeof fn !== 'function') {
        event.returnValue = {
          ok: false,
          error: {
            message: `Preview window method unavailable: ${String(methodName)}`,
          },
        };
        return;
      }
      const callArgs = Array.isArray(args) ? args : [];
      const result = fn.apply(win, callArgs);
      event.returnValue = { ok: true, result };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: { message: err && err.message ? err.message : String(err) },
      };
    }
  });

  ipcMain.handle('preview-window-close-self', event => {
    const win = getAuthorizedPreviewWindow(event);
    if (win && !win.isDestroyed()) {
      win.close();
    }
  });

  ipcMain.on('preview-app-get-path-sync', (event, name) => {
    const win = getAuthorizedPreviewWindow(event);
    if (!win) {
      event.returnValue = {
        ok: false,
        error: { message: 'Unauthorized preview window IPC caller.' },
      };
      return;
    }
    if (!ALLOWED_PREVIEW_APP_PATHS.has(name)) {
      event.returnValue = {
        ok: false,
        error: { message: `Disallowed preview app path: ${String(name)}` },
      };
      return;
    }
    try {
      const result =
        name === 'userData' ? getPreviewUserDataPath() : app.getPath(name);
      event.returnValue = { ok: true, result };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: { message: err && err.message ? err.message : String(err) },
      };
    }
  });

  ipcMain.handle('preview-shell-open-external', async (event, rawUrl) => {
    const win = getAuthorizedPreviewWindow(event);
    if (!win) {
      throw new Error('Unauthorized preview window IPC caller.');
    }
    if (!isSafeExternalUrl(rawUrl)) {
      throw new Error(`Refused to open unsafe external URL: ${String(rawUrl)}`);
    }
    return shell.openExternal(rawUrl);
  });

  ipcMain.on('preview-path-call-sync', (event, op, args) => {
    const win = getAuthorizedPreviewWindow(event);
    if (!win) {
      event.returnValue = {
        ok: false,
        error: { message: 'Unauthorized preview window IPC caller.' },
      };
      return;
    }
    if (!ALLOWED_PREVIEW_PATH_OPS.has(op)) {
      event.returnValue = {
        ok: false,
        error: { message: `Disallowed preview path op: ${String(op)}` },
      };
      return;
    }
    try {
      const callArgs = Array.isArray(args) ? args : [];
      if (typeof callArgs[0] !== 'string') {
        throw new Error('Preview path argument must be a string.');
      }
      const result = path[op](callArgs[0]);
      event.returnValue = { ok: true, result };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: { message: err && err.message ? err.message : String(err) },
      };
    }
  });

  ipcMain.on('preview-fs-sync', async (event, request) => {
    const win = getAuthorizedPreviewWindow(event);
    if (!win) {
      event.returnValue = {
        ok: false,
        error: { message: 'Unauthorized preview window IPC caller.' },
      };
      return;
    }
    if (!request || typeof request !== 'object') {
      event.returnValue = {
        ok: false,
        error: { message: 'Invalid preview fs sync request.' },
      };
      return;
    }
    const { op, args } = request;
    const callArgs = Array.isArray(args) ? args : [];
    try {
      if (
        ![
          'existsSync',
          'mkdirSync',
          'writeFileSync',
          'readFileSync',
          'unlinkSync',
          'readdirSync',
        ].includes(op)
      ) {
        throw new Error(`Disallowed preview fs sync op: ${String(op)}`);
      }
      const safePath = authorizePreviewFilePath(win, callArgs[0], {
        isWrite: ['mkdirSync', 'writeFileSync', 'unlinkSync'].includes(op),
        directory: op === 'mkdirSync' || op === 'readdirSync',
      });
      let result;
      switch (op) {
        case 'existsSync': {
          result = await fs.promises
            .access(safePath)
            .then(() => true, () => false);
          break;
        }
        case 'mkdirSync': {
          result = await fs.promises.mkdir(safePath, callArgs[1]);
          break;
        }
        case 'writeFileSync': {
          result = await fs.promises.writeFile(
            safePath,
            callArgs[1],
            callArgs[2]
          );
          break;
        }
        case 'readFileSync': {
          result = await fs.promises.readFile(
            safePath,
            readFileOptions(callArgs[1] || 'utf8')
          );
          break;
        }
        case 'unlinkSync': {
          result = await fs.promises.unlink(safePath);
          break;
        }
        case 'readdirSync': {
          result = await fs.promises.readdir(safePath, callArgs[1]);
          break;
        }
        default:
          throw new Error(`Disallowed preview fs sync op: ${String(op)}`);
      }
      event.returnValue = { ok: true, result };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: {
          message: err && err.message ? err.message : String(err),
          code: err && err.code,
        },
      };
    }
  });

  ipcMain.handle('preview-fs-invoke', async (event, op, args) => {
    const win = getAuthorizedPreviewWindow(event);
    if (!win) {
      throw new Error('Unauthorized preview window IPC caller.');
    }
    const ALLOWED_PREVIEW_ASYNC_FS_OPS = new Set([
      'mkdir',
      'writeFile',
      'readFile',
      'rm',
      'unlink',
      'readdir',
    ]);
    if (!ALLOWED_PREVIEW_ASYNC_FS_OPS.has(op)) {
      throw new Error(`Disallowed preview fs op: ${String(op)}`);
    }
    const callArgs = Array.isArray(args) ? args : [];
    const isWrite = op !== 'readFile' && op !== 'readdir';
    const safePath = authorizePreviewFilePath(win, callArgs[0], {
      isWrite,
      directory: op === 'mkdir' || op === 'readdir' || op === 'rm',
    });
    try {
      let result;
      switch (op) {
        case 'mkdir':
          result = await fs.promises.mkdir(safePath, callArgs[1]);
          break;
        case 'writeFile':
          result = await fs.promises.writeFile(
            safePath,
            callArgs[1],
            callArgs[2]
          );
          break;
        case 'readFile':
          result = await fs.promises.readFile(
            safePath,
            readFileOptions(callArgs[1] || 'utf8')
          );
          break;
        case 'rm':
          result = await fs.promises.rm(safePath, callArgs[1]);
          break;
        case 'unlink':
          result = await fs.promises.unlink(safePath);
          break;
        case 'readdir':
          result = await fs.promises.readdir(safePath, callArgs[1]);
          break;
        default:
          break;
      }
      return { ok: true, result };
    } catch (err) {
      return {
        ok: false,
        error: {
          message: err && err.message ? err.message : String(err),
          code: err && err.code,
        },
      };
    }
  });
};

let openDevToolsByDefault = false;

/**
 * Open 1 or multiple windows running a preview of an exported game.
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
  temporaryDirectory,
}) => {
  ensurePreviewIpcHandlers();
  const safePreviewUrl = assertSafePreviewIndexUrl(previewGameIndexHtmlPath);
  let previewDirectory = null;
  if (safePreviewUrl.startsWith('gdevelop-file:')) {
    const entry = resolveGdevelopFileUrlToLocalPath(safePreviewUrl);
    if (!entry || path.basename(entry) !== 'index.html')
      throw new Error('Expected the generated preview index.html.');
    previewDirectory = resolvePreviewDirectory(
      path.dirname(entry),
      temporaryDirectory
    );
    if (!isPathWithinCanonicalRoot(fs.realpathSync(entry), previewDirectory))
      throw new Error('Preview entry escapes its output directory.');
  }
  const safePreviewOrigin = new URL(safePreviewUrl).origin;
  const safeBaseWindowOptions = sanitizePreviewBrowserWindowOptions(
    previewBrowserWindowOptions
  );
  const safeWindowCount = Math.min(
    4,
    Math.max(1, Math.floor(Number(numberOfWindows) || 1))
  );

  // If opening multiple windows at once, place them across the screen.
  const screenSize = screen.getPrimaryDisplay().workAreaSize;
  const screenWidth = screenSize.width;
  const screenHeight = screenSize.height;
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
  for (let i = 0; i < safeWindowCount; i++) {
    const previewPolicy = createFileAccessPolicy({
      readRoots: previewDirectory ? [previewDirectory] : [],
      writeRoots: [getPreviewUserDataPath()],
    });
    const lease = acquirePreviewSession(previewPolicy);
    const browserWindowOptions = {
      ...safeBaseWindowOptions,
      webPreferences: {
        ...safeBaseWindowOptions.webPreferences,
        session: lease.session,
      },
      parent:
        alwaysOnTop && parentWindow && !parentWindow.isDestroyed()
          ? parentWindow
          : null,
      x: safeWindowCount > 1 ? positions[i + 1].x : undefined,
      y: safeWindowCount > 1 ? positions[i + 1].y : undefined,
    };

    let previewWindow;
    try {
      previewWindow = new BrowserWindow(browserWindowOptions);
    } catch (error) {
      lease.release();
      throw error;
    }
    previewFilePolicies.set(previewWindow, previewPolicy);
    previewWindow.once('closed', lease.release);
    const steamSession = createPreviewSteamSession({
      assertReadPath: target => previewPolicy.assertTreeAccess(target, 'read'),
    });
    previewSteamSessions.set(previewWindow, steamSession);
    const previewWebContents = previewWindow.webContents;
    const previewWebContentsId = previewWebContents.id;
    previewWindowByWebContentsId.set(previewWebContentsId, previewWindow);

    previewWindow.setMenuBarVisibility(hideMenuBar);
    previewWebContents.on('devtools-opened', () => {
      openDevToolsByDefault = true;
    });
    previewWebContents.on('devtools-closed', () => {
      openDevToolsByDefault = false;
    });

    if (openDevToolsByDefault) previewWindow.openDevTools();

    previewWebContents.on('will-navigate', (e, url) => {
      try {
        const parsed = new URL(url);
        if (
          parsed.origin === safePreviewOrigin &&
          ALLOWED_PREVIEW_PROTOCOLS.has(parsed.protocol) &&
          (parsed.protocol !== 'http:' ||
            ALLOWED_PREVIEW_HTTP_HOSTS.has(parsed.hostname))
        ) {
          return;
        }
      } catch (err) {}
      e.preventDefault();
      if (isSafeExternalUrl(url)) {
        shell.openExternal(url);
      }
    });

    // Open external link in the OS default browser
    previewWebContents.setWindowOpenHandler(details => {
      if (isSafeExternalUrl(details.url)) {
        shell.openExternal(details.url);
      }
      return { action: 'deny' };
    });

    previewWindow.loadURL(safePreviewUrl);

    // Track this preview window with its parent
    previewWindows.push({
      previewWindow: previewWindow,
      parentWindowId: parentWindow ? parentWindow.id : null,
    });

    previewWindow.on('closed', () => {
      steamSession.dispose();
      previewWindowByWebContentsId.delete(previewWebContentsId);
      previewWindows = previewWindows.filter(
        entry => entry.previewWindow !== previewWindow
      );
      // Only send message if the parent window still exists
      if (openEvent && openEvent.sender && !openEvent.sender.isDestroyed()) {
        openEvent.sender.send('preview-window-closed');
      }
      previewWindow = null;
    });
  }
};

const closePreviewWindow = windowId => {
  const entry = previewWindows.find(
    entry => entry.previewWindow.id === windowId
  );
  if (entry && entry.previewWindow) {
    entry.previewWindow.close();
  }
};

const closePreviewWindowsForParent = parentWindowId => {
  const entriesToClose = previewWindows.filter(
    entry => entry.parentWindowId === parentWindowId
  );
  entriesToClose.forEach(entry => {
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
  previewWindows.forEach(entry => {
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
  sanitizePreviewBrowserWindowOptions,
  assertSafePreviewIndexUrl,
  assertSafePreviewFilePath,
  ensurePreviewIpcHandlers,
  getAuthorizedPreviewWindow,
};
