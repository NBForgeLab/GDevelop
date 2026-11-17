const electron = require('electron');
const path = require('path');
const fs = require('fs');
const child_process = require('child_process');
const app = electron.app; // Module to control application life.
const BrowserWindow = electron.BrowserWindow; // Module to create native browser window.
const Menu = electron.Menu;
const Notification = electron.Notification;
const protocol = electron.protocol;
const isDev = require('electron-is-dev');
const { createAuthorizedIpc } = require('./Utils/AuthorizedIpc');
const { resolvePreviewDirectory } = require('./Utils/PreviewDirectory');
const { createFileAccessPolicy } = require('./Utils/FileAccessPolicy');
const { grantCliFileAccess } = require('./Utils/CliFileAccess');
const ipcMain = createAuthorizedIpc(electron.ipcMain, event => {
  if (!event || !event.sender || event.sender.isDestroyed()) return false;
  if (!event.senderFrame || event.senderFrame !== event.sender.mainFrame)
    return false;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (!win || !mainWindows.has(win)) return false;
  try {
    const url = new URL(event.senderFrame.url);
    return (
      (url.protocol === 'gdide:' && url.hostname === 'app') ||
      (isDev &&
        url.origin ===
          new URL(
            process.env.GDEVELOP_DEV_SERVER_URL || 'http://localhost:3000'
          ).origin)
    );
  } catch (_) {
    return false;
  }
});
const autoUpdater = require('electron-updater').autoUpdater;
const log = require('electron-log');
const { uploadLocalFile } = require('./LocalFileUploader');
const { serveFolder, stopServer, stopAllServers } = require('./ServeFolder');
const {
  startDebuggerServer,
  sendMessage,
  closeAllConnections,
  closeServer: closeDebuggerServer,
  stopAllServers: stopAllDebuggerServers,
} = require('./DebuggerServer');
const {
  buildElectronMenuFromDeclarativeTemplate,
  buildPlaceholderMainMenu,
} = require('./MainMenu');
const { loadExternalEditorWindow } = require('./LocalExternalEditorWindow');
const { load, registerGdideProtocol } = require('./Utils/UrlLoader');
const {
  GDEVELOP_FILE_SCHEME,
  registerGdevelopFileProtocol,
} = require('./Utils/GdevelopFileProtocol');
const {
  buildNpmScriptSpawnConfig,
  isSafeExternalUrl,
  setupDesktopIpcHandlers,
  attachWindowDesktopEvents,
} = require('./DesktopIpcHandlers');
const { setupMcpStdioPipe } = require('./CliMcpServerPipe');
const { waitForPreviousCliInstance } = require('./CliInstanceLock');
const {
  createLiveMcpServer,
  makeLiveMcpServerSettingsStore,
} = require('./LiveMcpServer');
const throttle = require('lodash.throttle');
const { findLocalIp } = require('./Utils/LocalNetworkIpFinder');
const setUpDiscordRichPresence = require('./DiscordRichPresence');
const {
  downloadLocalFile,
  saveLocalFileFromArrayBuffer,
} = require('./LocalFileDownloader');
const {
  openPreviewWindow,
  closePreviewWindow,
  closePreviewWindowsForParent,
  closeAllPreviewWindows,
} = require('./PreviewWindow');
const {
  setupLocalGDJSDevelopmentWatcher,
  closeLocalGDJSDevelopmentWatcher,
  onLocalGDJSDevelopmentWatcherRuntimeUpdated,
} = require('./LocalGDJSDevelopmentWatcher');
const { setupWatcher, disableWatcher } = require('./LocalFilesystemWatcher');
const { installCliInPath } = require('./InstallCliInPath');
const { setupClipboardTextCache } = require('./ClipboardTextCache');
const {
  setWindowFileIdentifier,
  clearWindowFileIdentifier,
} = require('./OpenProjectsRegistry');
const {
  parseGDevelopArgs,
  parseSecondInstanceArgs,
  isCliProjectAlreadyOpenElsewhere,
  routeCliCommandToLiveEditor,
} = require('./CliCommandHandoff');

let defaultWindowArgs = parseGDevelopArgs(process.argv.slice(isDev ? 2 : 1));
const args = defaultWindowArgs;
// `--mcp`: serve the editor functions of the project on stdin/stdout, in its
// own (headless) process, until the MCP client closes stdin.
if (args['mcp']) args['run-command'] = 'SERVE_MCP';
// With `--mcp` or `--json`, stdout only holds the output of the command: the
// logs of the main process (including electron-log's) go to stderr.
if (args['mcp'] || args['json']) {
  const writeToStderr = (...values) =>
    process.stderr.write(require('util').format(...values) + '\n');
  console.log = writeToStderr;
  console.info = writeToStderr;
  console.debug = writeToStderr;
  const stderrLogTransport = message => writeToStderr(...message.data);
  stderrLogTransport.level = 'info';
  log.transports.console.level = false;
  log.transports.stderr = stderrLogTransport;
}

log.info('GDevelop Electron app starting...');

// Logs made with electron-logs can be found
// on Linux: ~/.config/<app name>/log.log
// on OS X: ~/Library/Logs/<app name>/log.log
// on Windows: %USERPROFILE%\AppData\Roaming\<app name>\log.log
autoUpdater.logger = log;
autoUpdater.logger.transports.file.level = 'info';
autoUpdater.autoDownload = false;

// Keep a global reference of the window objects, if you don't, the windows will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindows = new Set();
let mainWindow = null; // Primary window reference for backwards compatibility
let windowCounter = 0; // Counter for creating unique session partitions
// The window an agent connecting to the live MCP server is bound to.
let lastFocusedMainWindow = null;
let liveMcpServer = null;

const devTools = !!args['dev-tools'];

// See registerGdideProtocol (used for HTML modules support) & registerGdevelopFileProtocol
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'gdide',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
    },
  },
  {
    scheme: GDEVELOP_FILE_SCHEME,
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
]);

// On computers having an integrated and a discrete graphics card (most gaming
// laptops), Chromium uses the integrated one by default: the 3D editor and the
// previews would run a lot slower than they could. Must be set before the app is ready.
app.commandLine.appendSwitch('force_high_performance_gpu');

// Chromium no longer falls back to software rendering for WebGL by itself:
// without this, there is no 3D on computers without a usable GPU (virtual machines, blocklisted drivers).
app.commandLine.appendSwitch('enable-unsafe-swiftshader');

// Notifications on Microsoft Windows platforms show the app user model id.
// If not set, defaults to `electron.app.{app.name}`.
if (process.platform === 'win32') {
  app.setAppUserModelId('gdevelop.ide');
}

// Single instance lock - prevents multiple Electron processes
// This solves Firebase IndexedDB locking issues while still allowing multiple windows.
// CLI: skip the lock unless the target project is a known open window (registry hit);
// a stale registry entry falls back to running headless in this process.
const isCliRunCommand = !!args['run-command'];
const gotTheLock =
  isCliRunCommand && (args['mcp'] || !isCliProjectAlreadyOpenElsewhere(args))
    ? true
    : app.requestSingleInstanceLock({ args });

if (!gotTheLock) {
  // Second instance attempted - quit immediately
  app.quit();
} else {
  app.on(
    'second-instance',
    (event, commandLine, workingDirectory, additionalData) => {
      const secondInstanceArgs = parseSecondInstanceArgs({
        commandLine,
        additionalData,
        isDev,
      });
      grantCliFileAccess(
        secondInstanceArgs,
        grantSelectedPath,
        workingDirectory
      );

      if (
        routeCliCommandToLiveEditor({
          parsedArgs: secondInstanceArgs,
          mainWindows,
        })
      ) {
        return;
      }

      // Update the default args so newly created windows pick up the
      // second-instance CLI flags (e.g. --run-command, positional project file).
      defaultWindowArgs = secondInstanceArgs;

      createNewWindow(secondInstanceArgs);
    }
  );
}

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // Best-effort cleanup - ignore any errors to prevent crashes during shutdown
  try {
    stopAllServers();
  } catch (e) {
    // Ignore errors during shutdown
  }
  try {
    stopAllDebuggerServers();
  } catch (e) {
    // Ignore errors during shutdown
  }
  // Close all remaining preview windows
  try {
    closeAllPreviewWindows();
  } catch (e) {
    // Ignore errors during shutdown
  }
  app.quit();
});

// Maps target (from window.open) to BrowserWindow ID for child windows.
// This is used to target the correct BrowserWindow for IPC messages.
const windowTargetIdToBrowserWindowIds = new Map();
const windowArgsByWebContentsId = new Map();
let fileAccessPolicy = null;
let grantSelectedPath = null;
let registerProtocolsForSession = null;

// Function to create a new GDevelop window
function createNewWindow(windowArgs = args) {
  const isIntegrated = windowArgs.mode === 'integrated';
  // windowArgs: a GUI primary process can still open a CLI window (second-instance fallback).
  const isCliWindow = !!windowArgs['run-command'];

  if (isIntegrated && app.dock) {
    app.dock.hide();
  }

  // Create the browser window.
  const options = {
    width: windowArgs.width || 800,
    height: windowArgs.height || 600,
    x: windowArgs.x,
    y: windowArgs.y,
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#000000',
      symbolColor: '#ffffff',
    },
    trafficLightPosition: { x: 12, y: 12 },
    webPreferences: {
      webSecurity: true,
      nodeIntegration: false,
      sandbox: true,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      // Keep timers and `requestAnimationFrame` running at full speed when
      // the window is minimized or covered by another window (Chromium
      // otherwise throttles timers to once a minute and stops animation
      // frames entirely). The editor keeps working in the background: the
      // AI agent keeps running its turns, and gameplay tests - which need
      // animation frames to step the game - keep progressing.
      backgroundThrottling: false,
    },
    enableLargerThanScreen: true,
    backgroundColor: '#000',
  };

  // First window (windowCounter === 0) uses default storage for backwards compatibility
  // Additional windows get unique partitions for independent auth AND separate renderer processes
  const windowNumber = windowCounter;
  if (windowCounter > 0) {
    // Create a unique partition for this window so it has independent auth state
    // Each partition gets its own storage (IndexedDB, localStorage, cookies, etc.)
    options.webPreferences.partition = `persist:gdevelop-window-${windowCounter}`;
    log.info(
      `Creating window #${windowCounter} with partition: persist:gdevelop-window-${windowCounter}`
    );
  } else {
    log.info(
      `Creating window #${windowCounter} with default partition (backwards compatibility)`
    );
  }
  windowCounter++;

  if (isIntegrated) {
    options.acceptFirstMouse = true;
    options.skipTaskbar = true;
    options.hasShadow = false;
    options.frame = false;
    options.minimizable = false;
    options.movable = false;
    options.resizable = false;
    options.fullscreenable = false;
    options.show = false;
  }

  // `--show`: watch an agent working on the project through the MCP server.
  if (isCliWindow && !windowArgs['keep-open'] && !windowArgs['show']) {
    options.show = false;
    options.skipTaskbar = true;
  }

  const newWindow = new BrowserWindow(options);
  if (!isIntegrated && !isCliWindow) newWindow.maximize();

  // Capture window ID and whether this is the primary window before it can be destroyed
  const windowId = newWindow.id;
  const isPrimaryWindow = windowNumber === 0;
  log.info(
    `Created window with Electron ID: ${windowId}, window number: ${windowNumber}, isPrimary: ${isPrimaryWindow}`
  );

  // Track this window
  mainWindows.add(newWindow);
  if (registerProtocolsForSession) {
    registerProtocolsForSession(newWindow.webContents.session);
  }
  const newWindowWebContentsId = newWindow.webContents.id;
  windowArgsByWebContentsId.set(newWindowWebContentsId, windowArgs);
  attachWindowDesktopEvents(newWindow);
  newWindow.on('closed', () => {
    windowArgsByWebContentsId.delete(newWindowWebContentsId);
  });

  // Set as primary window if this is the first one
  if (isPrimaryWindow) {
    mainWindow = newWindow;
  }

  // The app is loaded from file://, so no Referer is sent: YouTube embeds then fail with "Error 153".
  newWindow.webContents.session.webRequest.onBeforeSendHeaders(
    {
      urls: ['https://www.youtube.com/*', 'https://www.youtube-nocookie.com/*'],
    },
    (details, callback) => {
      callback({
        requestHeaders: {
          ...details.requestHeaders,
          Referer: 'https://editor.gdevelop.io/',
        },
      });
    }
  );

  // Uses process.stdout/stderr directly (not electron-log) to avoid
  // re-entering the renderer console and causing an infinite loop.
  if (isCliWindow) {
    newWindow.webContents.on('console-message', ({ level, message }) => {
      if (level === 'debug') return;
      if (message.startsWith('%c')) return;
      if (message.includes('[renderer:')) return; // break recursion
      const isWarningOrError = level === 'warning' || level === 'error';
      // With --json, stdout only holds the result of the command.
      const stream =
        isWarningOrError || windowArgs['json'] || windowArgs['mcp']
          ? process.stderr
          : process.stdout;
      stream.write(`[renderer:${level}] ${message}\n`);
    });
  }

  // Log process ID to verify separate renderer processes
  newWindow.webContents.once('did-finish-load', () => {
    const pid =
      typeof newWindow.webContents.getOSProcessId === 'function'
        ? newWindow.webContents.getOSProcessId()
        : null;
    if (pid != null) {
      log.info(
        `Window ${windowId} (window number ${windowNumber}) is running in renderer process PID: ${pid}`
      );
    }
  });

  if (isDev)
    newWindow.webContents.session.extensions.loadExtension(
      path.join(__dirname, 'extensions/ReactDeveloperTools/4.24.3_0/')
    );

  // Load the index.html of the app.
  const loadEditor = () =>
    load({ window: newWindow, isDev, path: '/index.html', devTools });
  if (isDev) loadEditor();
  else {
    require('./Utils/StorageMigration')
      .migrateLegacyStorage({
        targetSession: newWindow.webContents.session,
        legacyPath: path.join(__dirname, 'www', 'index.html'),
      })
      .then(() => {
        if (!newWindow.isDestroyed()) loadEditor();
      })
      .catch(error => {
        log.error('Legacy storage migration failed:', error);
        electron.dialog.showErrorBox(
          'Unable to restore editor data',
          'Your previous editor data has been preserved. Please restart GDevelop to retry.\n' +
            error.message
        );
        if (!newWindow.isDestroyed()) newWindow.destroy();
      });
  }

  newWindow.on('closed', function() {
    // Remove from tracked windows
    mainWindows.delete(newWindow);
    clearWindowFileIdentifier(windowId);
    if (lastFocusedMainWindow === newWindow) lastFocusedMainWindow = null;
    if (liveMcpServer) liveMcpServer.onWindowClosed(windowId);

    // If this was the primary window, set a new primary
    if (isPrimaryWindow) {
      mainWindow = mainWindows.values().next().value || null;
    }

    // Close preview windows belonging to this window
    closePreviewWindowsForParent(windowId);

    // Stop the server and debugger for this window
    stopServer(windowId, () => {});
    closeDebuggerServer(windowId);
  });

  // Prevent any navigation inside the window
  newWindow.webContents.on('will-navigate', (e, url) => {
    if (url !== newWindow.webContents.getURL()) {
      console.info('Opening in browser (because of will-navigate):', url);
      e.preventDefault();
      if (isSafeExternalUrl(url)) electron.shell.openExternal(url);
    }
  });

  // Allow blank-URL pop-out windows (used by WindowPortal for editor pop-outs),
  // but open all other URLs in the external browser.
  newWindow.webContents.setWindowOpenHandler(details => {
    if (details.frameName.startsWith('GDevelopWindowPortal')) {
      // Extract the theme background color passed via the features string
      // by WindowPortal (e.g. "...,themeBackgroundColor=%23282828").
      let backgroundColor = '#000';
      const match = details.features.match(/themeBackgroundColor=([^,]*)/);
      if (match) {
        try {
          backgroundColor = decodeURIComponent(match[1]);
        } catch (e) {}
      }

      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          // Use hidden title bar with overlay controls, like the main window,
          // so that ToolbarTitlebar can provide safe margins for window controls.
          titleBarStyle: 'hidden',
          titleBarOverlay: {
            color: '#000000',
            symbolColor: '#ffffff',
          },
          trafficLightPosition: { x: 12, y: 12 },
          backgroundColor,
          webPreferences: {
            webSecurity: true,
            nodeIntegration: false,
            sandbox: true,
            contextIsolation: true,
          },
        },
      };
    }

    console.info('Opening in browser (because of new window): ', details.url);
    if (isSafeExternalUrl(details.url))
      electron.shell.openExternal(details.url);
    return { action: 'deny' };
  });

  // When a child window is created (e.g. a popped-out editor), set up security policies on it.
  newWindow.webContents.on('did-create-window', (childWindow, details) => {
    if (
      !details.frameName ||
      !details.frameName.startsWith('GDevelopWindowPortal')
    ) {
      console.warn(
        `Unexpected frameName for child window: ${
          details.frameName
        } - verify handling on Electron side.`
      );
    }

    // Track child window by frameName so the renderer can look up its
    // BrowserWindow ID (needed for titlebar overlay IPC targeting).
    if (details.frameName) {
      windowTargetIdToBrowserWindowIds.set(details.frameName, childWindow.id);
      childWindow.on('closed', () => {
        windowTargetIdToBrowserWindowIds.delete(details.frameName);
      });
    }

    // Remove the menu bar from popped-out editor windows.
    childWindow.setMenu(null);

    // Prevent navigation inside child windows.
    childWindow.webContents.on('will-navigate', (e, url) => {
      if (url !== childWindow.webContents.getURL()) {
        e.preventDefault();
        if (isSafeExternalUrl(url)) electron.shell.openExternal(url);
      }
    });

    // Block further nesting of new windows from pop-outs.
    childWindow.webContents.setWindowOpenHandler(childDetails => {
      if (isSafeExternalUrl(childDetails.url)) {
        electron.shell.openExternal(childDetails.url);
      }
      return { action: 'deny' };
    });
  });

  return newWindow;
}

const setupLiveMcpServer = () => {
  const settingsStore = makeLiveMcpServerSettingsStore(app.getPath('userData'));
  let lastError = null;
  liveMcpServer = createLiveMcpServer({
    getTargetWindow: () =>
      lastFocusedMainWindow && !lastFocusedMainWindow.isDestroyed()
        ? lastFocusedMainWindow
        : mainWindow,
    log,
  });

  app.on('browser-window-focus', (_event, window) => {
    if (mainWindows.has(window)) lastFocusedMainWindow = window;
  });

  const getStatus = () => {
    const settings = settingsStore.read();
    const port = liveMcpServer.getPort();
    return {
      enabled: settings.enabled,
      port,
      url: port ? `http://127.0.0.1:${port}/mcp` : null,
      token: settings.token,
      error: lastError,
    };
  };

  const applySettings = async () => {
    const settings = settingsStore.read();
    lastError = null;
    if (!settings.enabled) {
      await liveMcpServer.stop();
      return;
    }
    try {
      await liveMcpServer.start({ port: settings.port, token: settings.token });
    } catch (error) {
      lastError = error.message;
      log.error('[MCP] Could not start the live editor server:', error);
    }
  };

  ipcMain.on('mcp-live-send', (_event, payload) =>
    liveMcpServer.onWindowResponse(payload)
  );
  ipcMain.handle('mcp-live-server-get-status', () => getStatus());
  ipcMain.handle('mcp-live-server-set-enabled', async (_event, enabled) => {
    settingsStore.write({ ...settingsStore.read(), enabled: !!enabled });
    await applySettings();
    return getStatus();
  });
  ipcMain.handle('mcp-live-server-reset-token', async () => {
    settingsStore.write({ ...settingsStore.read(), token: null });
    await applySettings();
    return getStatus();
  });

  applySettings();
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', async function() {
  // Handoff calls app.quit() but 'ready' still runs; without the lock, do not create a window.
  if (!gotTheLock) {
    return;
  }

  // A CLI/MCP instance started while the previous one exits would run logged
  // out (see CliInstanceLock.js): wait for it.
  if (isCliRunCommand) {
    await waitForPreviousCliInstance({ app, log, timeoutMs: 10000 });
  }

  const { net, session } = electron;
  const registeredProtocolSessions = new WeakSet();
  // The renderer gets an application-owned scratch directory, never all of OS temp.
  const temporaryDirectory = path.join(app.getPath('temp'), 'GDevelop-sandbox');
  fs.mkdirSync(temporaryDirectory, { recursive: true });
  const readRoots = [
    app.getAppPath(),
    process.resourcesPath,
    ...(isDev
      ? [
          path.resolve(__dirname, '../../app'),
          path.resolve(__dirname, '../../../GDJS'),
        ]
      : []),
  ].filter(Boolean);
  fileAccessPolicy = createFileAccessPolicy({
    readRoots,
    writeRoots: [temporaryDirectory],
  });
  const grantsFile = path.join(
    app.getPath('userData'),
    'file-access-grants.json'
  );
  try {
    const saved = JSON.parse(fs.readFileSync(grantsFile, 'utf8'));
    if (saved && saved.version === 2) {
      fileAccessPolicy.restoreGrants(saved.grants);
    }
  } catch (error) {
    if (error.code !== 'ENOENT')
      log.warn('Could not restore file grants:', error.message);
  }
  grantSelectedPath = (selectedPath, mode = 'read', directory = false) => {
    if (directory) {
      fileAccessPolicy.grantRoot(selectedPath, mode);
    } else {
      fileAccessPolicy.grantFile(selectedPath, mode);
    }
    const pendingFile = grantsFile + '.tmp';
    fs.writeFileSync(
      pendingFile,
      JSON.stringify({ version: 2, grants: fileAccessPolicy.exportGrants() }),
      { mode: 0o600 }
    );
    fs.renameSync(pendingFile, grantsFile);
  };
  grantCliFileAccess(defaultWindowArgs, grantSelectedPath);
  registerProtocolsForSession = targetSession => {
    if (!targetSession || registeredProtocolSessions.has(targetSession)) {
      return;
    }
    registeredProtocolSessions.add(targetSession);
    const sessionProtocol = targetSession.protocol || protocol;
    registerGdideProtocol({
      isDev,
      protocol: sessionProtocol,
      developmentServerBaseUrl: process.env.GDEVELOP_DEV_SERVER_URL,
    });
    registerGdevelopFileProtocol({
      protocol: sessionProtocol,
      net,
      isDev,
      developmentServerBaseUrl: process.env.GDEVELOP_DEV_SERVER_URL,
      isPathAllowed: candidatePath =>
        fileAccessPolicy.hasAccess(candidatePath, 'read'),
    });
  };
  registerProtocolsForSession(session.defaultSession);

  setupDesktopIpcHandlers({
    isDev,
    getDefaultArgs: () => defaultWindowArgs,
    getWindowArgsForWebContents: webContents =>
      windowArgsByWebContentsId.get(webContents.id) || defaultWindowArgs,
    mainWindows,
    resolveWindowByTargetId: targetId => {
      if (typeof targetId !== 'string' || !targetId) return null;
      const windowId = windowTargetIdToBrowserWindowIds.get(targetId);
      if (windowId === undefined) return null;
      const targetWin = BrowserWindow.fromId(windowId);
      return targetWin && !targetWin.isDestroyed() ? targetWin : null;
    },
    fileAccessPolicy,
    grantSelectedPath,
    temporaryDirectory,
    ipc: ipcMain,
  });

  // Create the first window
  createNewWindow(args);

  Menu.setApplicationMenu(buildPlaceholderMainMenu());

  // Set up dock menu (macOS) for creating new windows
  if (app.dock) {
    const dockMenu = Menu.buildFromTemplate([
      {
        label: 'New window',
        click: () => {
          createNewWindow(args);
        },
      },
    ]);
    app.dock.setMenu(dockMenu);
  }

  // Set up jump list tasks (Windows) for creating new windows
  if (process.platform === 'win32') {
    app.setUserTasks([
      {
        program: process.execPath,
        arguments: '',
        iconPath: process.execPath,
        iconIndex: 0,
        title: 'New window',
        description: 'Open a new GDevelop window',
      },
    ]);
  }

  setupClipboardTextCache(ipcMain);

  ipcMain.on('app-exit', (_event, exitCode) => {
    app.exit(typeof exitCode === 'number' ? exitCode : 0);
  });

  if (args['mcp']) setupMcpStdioPipe({ ipcMain, app });

  // The result of a CLI command (with --json): resolved once written, so the
  // app does not exit before stdout is flushed.
  ipcMain.handle(
    'cli-write-stdout',
    (_event, text) =>
      new Promise(resolve =>
        process.stdout.write(String(text), () => resolve())
      )
  );

  // The input of a CLI command given as "-" (e.g. calls piped to GDevelop).
  let cliStdinPromise = null;
  ipcMain.handle('cli-read-stdin', () => {
    if (!cliStdinPromise) {
      cliStdinPromise = new Promise((resolve, reject) => {
        const chunks = [];
        process.stdin.on('data', chunk => chunks.push(chunk));
        process.stdin.on('end', () =>
          resolve(Buffer.concat(chunks).toString('utf8'))
        );
        process.stdin.on('error', reject);
      });
    }
    return cliStdinPromise;
  });

  ipcMain.on('set-window-project-path', (event, fileIdentifier) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (window) {
      if (fileIdentifier && !fileAccessPolicy.hasAccess(fileIdentifier, 'read'))
        return;
      setWindowFileIdentifier(window.id, fileIdentifier);
    }
  });

  // Not in a CLI process (like `--mcp`): it has no editor the user works in.
  if (!isCliRunCommand) setupLiveMcpServer();

  ipcMain.handle('install-cli-in-path', async () => {
    // Inside an AppImage, process.execPath points into a transient mount that
    // vanishes on quit; APPIMAGE is the stable file path (still breaks if moved).
    return installCliInPath(process.env.APPIMAGE || process.execPath);
  });

  ipcMain.on('set-main-menu', (event, mainMenuTemplate) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    Menu.setApplicationMenu(
      buildElectronMenuFromDeclarativeTemplate(
        window || mainWindow,
        mainMenuTemplate
      )
    );
  });

  ipcMain.handle('preview-open', async (event, options) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    return openPreviewWindow({
      parentWindow: parentWindow,
      previewBrowserWindowOptions: options.previewBrowserWindowOptions,
      previewGameIndexHtmlPath: options.previewGameIndexHtmlPath,
      alwaysOnTop: options.alwaysOnTop,
      hideMenuBar: options.hideMenuBar,
      numberOfWindows: options.numberOfWindows,
      captureOptions: options.captureOptions,
      openEvent: event,
      temporaryDirectory,
    });
  });
  ipcMain.handle('preview-close', async (event, options) => {
    return closePreviewWindow(options && options.windowId);
  });

  ipcMain.handle('preview-close-all', async () => {
    return closeAllPreviewWindows();
  });

  // Piskel image editor
  ipcMain.handle('piskel-load', (event, externalEditorInput) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    return loadExternalEditorWindow({
      parentWindow: parentWindow,
      devTools,
      indexSubPath: 'piskel/piskel-electron-index.html',
      externalEditorInput,
    });
  });

  // JFXR sound effect generator
  ipcMain.handle('jfxr-load', (event, externalEditorInput) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    return loadExternalEditorWindow({
      parentWindow: parentWindow,
      devTools,
      indexSubPath: 'jfxr/jfxr-electron-index.html',
      externalEditorInput,
    });
  });

  // Yarn Dialogue Tree Editor
  ipcMain.handle('yarn-load', (event, externalEditorInput) => {
    const parentWindow = BrowserWindow.fromWebContents(event.sender);
    return loadExternalEditorWindow({
      parentWindow: parentWindow,
      devTools,
      indexSubPath: 'yarn/yarn-electron-index.html',
      externalEditorInput,
    });
  });

  // LocalFileUploader events:
  ipcMain.on('local-file-upload', (event, localFilePath, uploadOptions) => {
    if (!fileAccessPolicy.hasAccess(localFilePath, 'read')) {
      event.sender.send('local-file-upload-done', {
        message: 'File access is not authorized.',
        code: 'EACCES',
      });
      return;
    }
    log.info(
      'Received event local-file-upload with localFilePath=',
      localFilePath
    );

    uploadLocalFile(
      localFilePath,
      uploadOptions,
      throttle((current, max) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('local-file-upload-progress', current, max);
        }
      }, 300)
    ).then(
      () => {
        log.info('Local file upload successfully done');
        if (!event.sender.isDestroyed()) {
          event.sender.send('local-file-upload-done', null);
        }
      },
      uploadError => {
        log.error('Local file upload errored', uploadError);
        if (!event.sender.isDestroyed()) {
          const serializedError = uploadError
            ? {
                message: uploadError.message || String(uploadError),
                code: uploadError.code,
                status:
                  typeof uploadError.status === 'number'
                    ? uploadError.status
                    : uploadError.response &&
                      typeof uploadError.response.status === 'number'
                    ? uploadError.response.status
                    : undefined,
                responseStatus:
                  uploadError.response &&
                  typeof uploadError.response.status === 'number'
                    ? uploadError.response.status
                    : undefined,
              }
            : { message: 'Local file upload failed' };
          event.sender.send('local-file-upload-done', serializedError);
        }
      }
    );
  });

  // Titlebar handling:
  ipcMain.handle(
    'titlebar-set-overlay-options',
    async (event, overlayOptions, optionalTargetId) => {
      if (!overlayOptions || typeof overlayOptions !== 'object') return;
      const targetId =
        optionalTargetId != null ? optionalTargetId : overlayOptions.targetId;
      // When a targetId is provided, resolve it to the child BrowserWindow
      // (needed for popped-out editor windows, where event.sender is always
      // the main window's webContents). Otherwise, use event.sender.
      let window;
      if (targetId) {
        const windowId = windowTargetIdToBrowserWindowIds.get(targetId);
        window = windowId != null ? BrowserWindow.fromId(windowId) : null;
      } else {
        window = BrowserWindow.fromWebContents(event.sender);
      }
      if (!window || window.isDestroyed()) return;

      const sanitizedOverlayOptions = {
        color:
          typeof overlayOptions.color === 'string'
            ? overlayOptions.color
            : '#000000',
        symbolColor:
          typeof overlayOptions.symbolColor === 'string'
            ? overlayOptions.symbolColor
            : '#ffffff',
      };

      // setTitleBarOverlay seems not defined on macOS.
      if (window.setTitleBarOverlay)
        window.setTitleBarOverlay(sanitizedOverlayOptions);
      if (window.setBackgroundColor && sanitizedOverlayOptions.color)
        window.setBackgroundColor(sanitizedOverlayOptions.color);
    }
  );

  // Window maximize toggle (for double-click on titlebar):
  ipcMain.handle('window-maximize-toggle', async event => {
    const window = BrowserWindow.fromWebContents(event.sender);
    if (!window || window.isDestroyed()) return;

    if (window.isMaximized()) {
      window.unmaximize();
    } else {
      window.maximize();
    }
  });

  // LocalFileDownloader events:
  ipcMain.handle('local-file-download', async (event, url, outputPath) => {
    fileAccessPolicy.assertAccess(outputPath, 'write');
    const senderSession =
      event && event.sender && !event.sender.isDestroyed()
        ? event.sender.session
        : undefined;
    const result = await downloadLocalFile(url, outputPath, senderSession);
    return result;
  });
  ipcMain.handle(
    'local-file-save-from-arraybuffer',
    async (event, arrayBuffer, outputPath) => {
      fileAccessPolicy.assertAccess(outputPath, 'write');
      const result = await saveLocalFileFromArrayBuffer(
        arrayBuffer,
        outputPath
      );
      return result;
    }
  );

  // LocalFilesystemWatcher events:
  ipcMain.handle(
    'local-filesystem-watcher-setup',
    (event, folderPath, options) => {
      fileAccessPolicy.assertAccess(folderPath, 'read');
      const subscriptionId = setupWatcher(
        folderPath,
        changedFilePath => {
          if (!event.sender.isDestroyed()) {
            event.sender.send('project-file-changed', changedFilePath);
          }
        },
        options
      );
      return subscriptionId;
    }
  );
  ipcMain.handle(
    'local-filesystem-watcher-disable',
    (event, subscriptionId) => {
      return disableWatcher(subscriptionId);
    }
  );

  // ServeFolder events:
  ipcMain.on('serve-folder', (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const windowId = window ? window.id : 'unknown';
    log.info(
      'Received event to server folder with options=',
      options,
      'for window',
      windowId
    );

    let root;
    try {
      root = resolvePreviewDirectory(options && options.root, temporaryDirectory);
    } catch (error) {
      event.sender.send('serve-folder-done', error.message, null);
      return;
    }
    serveFolder({ root, useHttps: !!options.useHttps, windowId }, (err, serverParams) => {
      // Using JSON to copy the config strips unserializable properties
      // (like middleware functions) automatically.
      const configCopy = serverParams
        ? JSON.parse(JSON.stringify(serverParams))
        : null;
      if (!event.sender.isDestroyed()) {
        event.sender.send('serve-folder-done', err, configCopy);
      }
    });
  });

  ipcMain.on('stop-server', event => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const windowId = window ? window.id : 'unknown';
    log.info('Received event to stop server for window', windowId);

    stopServer(windowId, err => {
      if (!event.sender.isDestroyed()) {
        event.sender.send('stop-server-done', err);
      }
    });
  });

  ipcMain.on('get-local-network-ip', event => {
    if (!event.sender.isDestroyed()) {
      event.sender.send('local-network-ip', findLocalIp());
    }
  });

  // LocalGDJSDevelopmentWatcher events:
  ipcMain.on('setup-local-gdjs-development-watcher', event => {
    setupLocalGDJSDevelopmentWatcher();
  });

  ipcMain.on('close-local-gdjs-development-watcher', event => {
    closeLocalGDJSDevelopmentWatcher();
  });

  onLocalGDJSDevelopmentWatcherRuntimeUpdated(() => {
    log.info(
      'Notifying all editor windows that the GDJS runtime has been updated.'
    );
    mainWindows.forEach(window => {
      if (
        window &&
        !window.isDestroyed() &&
        !window.webContents.isDestroyed()
      ) {
        window.webContents.send(
          'local-gdjs-development-watcher-runtime-updated',
          null
        );
      }
    });
  });

  // DebuggerServer events:
  ipcMain.on('debugger-start-server', (event, options) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const windowId = window ? window.id : 'unknown';
    log.info(
      'Received event to start debugger server with options=',
      options,
      'for window',
      windowId
    );

    startDebuggerServer(windowId, {
      onMessage: ({ id, message }) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('debugger-message-received', { id, message });
        }
      },
      onError: error => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('debugger-error-received', error);
        }
      },
      onConnectionClose: ({ id }) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('debugger-connection-closed', { id });
        }
      },
      onConnectionOpen: ({ id }) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('debugger-connection-opened', { id });
        }
      },
      onConnectionError: ({ id, errorMessage }) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('debugger-connection-errored', {
            id,
            errorMessage,
          });
        }
      },
      onListening: ({ address }) => {
        if (!event.sender.isDestroyed()) {
          event.sender.send('debugger-start-server-done', { address });
        }
      },
    });
  });

  ipcMain.on('debugger-send-message', (event, message) => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const windowId = window ? window.id : 'unknown';
    sendMessage(windowId, message, err => {
      if (!event.sender.isDestroyed()) {
        event.sender.send('debugger-send-message-done', err);
      }
    });
  });

  ipcMain.on('debugger-close-all-connections', event => {
    const window = BrowserWindow.fromWebContents(event.sender);
    const windowId = window ? window.id : 'unknown';
    closeAllConnections(windowId);
  });

  // Track whether the current update check was triggered explicitly by the user,
  // so that errors are only surfaced to the user for manual checks.
  let isExplicitUpdateCheck = false;

  ipcMain.on('updates-check-and-download', (event, { explicit } = {}) => {
    // This will immediately download an update, then install when the
    // app quits.
    isExplicitUpdateCheck = !!explicit;
    log.info('Starting check for updates (with auto-download if any)');
    autoUpdater.autoDownload = true;
    autoUpdater.checkForUpdatesAndNotify().catch(err => {
      log.error('Error checking for updates:', err);
    });
  });

  ipcMain.on('updates-check', (event, { explicit } = {}) => {
    isExplicitUpdateCheck = !!explicit;
    log.info('Starting check for updates (without auto-download)');
    autoUpdater.autoDownload = false;
    autoUpdater.checkForUpdates().catch(err => {
      log.error('Error checking for updates:', err);
    });
  });

  ipcMain.on('updates-install-and-quit', () => {
    autoUpdater.quitAndInstall();
  });

  function sendUpdateStatus(status) {
    log.info(status);
    mainWindows.forEach(window => {
      if (
        window &&
        !window.isDestroyed() &&
        window.webContents &&
        !window.webContents.isDestroyed()
      ) {
        window.webContents.send('update-status', status);
      }
    });
  }
  autoUpdater.on('checking-for-update', () => {
    sendUpdateStatus({
      message: 'Checking for update...',
      status: 'checking-for-update',
    });
  });
  autoUpdater.on('update-available', info => {
    sendUpdateStatus({
      message: 'Update available.',
      status: 'update-available',
      info,
    });
  });
  autoUpdater.on('update-not-available', info => {
    sendUpdateStatus({
      message: 'Update not available.',
      status: 'update-not-available',
    });
  });
  autoUpdater.on('error', err => {
    if (isExplicitUpdateCheck) {
      sendUpdateStatus({
        message: 'Error in auto-updater. ' + err,
        status: 'error',
        err,
      });
    } else {
      log.error('Background update check failed:', err);
    }
  });
  autoUpdater.on('download-progress', progressObj => {
    let logMessage = 'Download speed: ' + progressObj.bytesPerSecond;
    logMessage = logMessage + ' - Downloaded ' + progressObj.percent + '%';
    logMessage =
      logMessage +
      ' (' +
      progressObj.transferred +
      '/' +
      progressObj.total +
      ')';
    sendUpdateStatus({
      message: logMessage,
      status: 'download-progress',
      bytesPerSecond: progressObj.bytesPerSecond,
      percent: progressObj.percent,
      transferred: progressObj.transferred,
      total: progressObj.total,
    });
  });
  autoUpdater.on('update-downloaded', info => {
    sendUpdateStatus({
      message: 'Update downloaded',
      status: 'update-downloaded',
      info,
    });
  });

  setUpDiscordRichPresence(ipcMain);

  const NPM_SCRIPT_COMMAND_FAILED_MESSAGE = 'Command failed!';

  // npm script execution in external terminal (cross-platform)
  ipcMain.on(
    'run-npm-script',
    async (event, { projectPath, npmScript, keepTerminalOpen } = {}) => {
      try {
        fileAccessPolicy.assertAccess(projectPath, 'read');
        const confirmation = await electron.dialog.showMessageBox(
          BrowserWindow.fromWebContents(event.sender),
          {
            type: 'question',
            title: 'Run project command',
            message: `Run npm script "${npmScript}"?`,
            detail: `${projectPath}\nThis command can execute code on your computer.`,
            buttons: ['Cancel', 'Run'],
            defaultId: 0,
            cancelId: 0,
            noLink: true,
          }
        );
        if (confirmation.response !== 1) return;
        const spawnConfig = buildNpmScriptSpawnConfig({
          projectPath,
          npmScript,
          keepTerminalOpen,
          platform: process.platform,
          failureMessage: NPM_SCRIPT_COMMAND_FAILED_MESSAGE,
        });
        log.info(`Running npm script "${npmScript}" in ${spawnConfig.cwd}`);

        if (spawnConfig.terminals) {
          const tryTerminal = index => {
            if (index >= spawnConfig.terminals.length) {
              log.error('No terminal emulator found');
              return;
            }
            const terminal = spawnConfig.terminals[index];
            const proc = child_process.spawn(terminal.cmd, terminal.args, {
              detached: true,
              stdio: 'ignore',
            });
            proc.on('error', () => tryTerminal(index + 1));
            proc.unref();
          };
          tryTerminal(0);
        } else {
          const proc = child_process.spawn(
            spawnConfig.command,
            spawnConfig.args,
            {
              detached: true,
              stdio: 'ignore',
            }
          );
          proc.on('error', err =>
            log.error('Failed to launch npm script terminal:', err)
          );
          if (typeof proc.unref === 'function') {
            proc.unref();
          }
        }
      } catch (err) {
        log.error('Failed to run npm script:', err);
      }
    }
  );
});
