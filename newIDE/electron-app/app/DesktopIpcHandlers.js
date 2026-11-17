const { readFileOptions } = require('./Utils/ReadFileOptions');
const fs = require('fs-extra');
const path = require('path');
const os = require('os');
const archiver = require('archiver');
const {
  app,
  BrowserWindow,
  Menu,
  dialog,
  ipcMain: electronIpcMain,
  screen,
  shell,
} = require('electron');

const { isPathWithinCanonicalRoot } = require('./Utils/GdevelopFileProtocol');

const ALLOWED_EXTERNAL_PROTOCOLS = new Set([
  'http:',
  'https:',
  'mailto:',
  'ms-store:',
]);

const ALLOWED_APP_PATHS = new Set([
  'home',
  'appData',
  'userData',
  'temp',
  'exe',
  'documents',
  'downloads',
  'desktop',
]);

const ALLOWED_MENU_ROLES = new Set([
  'undo',
  'redo',
  'cut',
  'copy',
  'paste',
  'pasteAndMatchStyle',
  'delete',
  'selectAll',
  'reload',
  'forceReload',
  'toggleDevTools',
  'resetZoom',
  'zoomIn',
  'zoomOut',
  'togglefullscreen',
  'window',
  'minimize',
  'close',
  'help',
  'about',
  'services',
  'hide',
  'hideOthers',
  'unhide',
  'quit',
  'startSpeaking',
  'stopSpeaking',
  'zoom',
  'front',
  'appMenu',
  'fileMenu',
  'editMenu',
  'viewMenu',
  'windowMenu',
  'recentDocuments',
  'clearRecentDocuments',
  'toggleTabBar',
  'selectNextTab',
  'selectPreviousTab',
  'mergeAllWindows',
  'moveTabToNewWindow',
]);

const ALLOWED_MENU_TYPES = new Set([
  'normal',
  'separator',
  'submenu',
  'checkbox',
  'radio',
]);

const isSafeExternalUrl = rawUrl => {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) return false;
  try {
    const parsed = new URL(rawUrl);
    return ALLOWED_EXTERNAL_PROTOCOLS.has(parsed.protocol);
  } catch (err) {
    return false;
  }
};

const assertValidFilePath = filePath => {
  if (
    typeof filePath !== 'string' ||
    filePath.length === 0 ||
    filePath.indexOf('\0') !== -1
  ) {
    throw new Error('Invalid file system path.');
  }
};

const serializeStats = stats => ({
  isDirectory: Boolean(stats && stats.isDirectory && stats.isDirectory()),
  isFile: Boolean(stats && stats.isFile && stats.isFile()),
  isSymbolicLink: Boolean(
    stats && stats.isSymbolicLink && stats.isSymbolicLink()
  ),
  size: stats && typeof stats.size === 'number' ? stats.size : 0,
  mtimeMs: stats && typeof stats.mtimeMs === 'number' ? stats.mtimeMs : 0,
});

const serializeReaddirResult = entries => {
  if (!Array.isArray(entries)) return entries;
  return entries.map(entry => {
    if (typeof entry === 'string') return entry;
    if (entry && typeof entry === 'object') {
      return {
        __isDirent: true,
        name: typeof entry.name === 'string' ? entry.name : '',
        parentPath:
          typeof entry.parentPath === 'string' ? entry.parentPath : '',
        isDirectory: Boolean(entry.isDirectory && entry.isDirectory()),
        isFile: Boolean(entry.isFile && entry.isFile()),
        isSymbolicLink: Boolean(entry.isSymbolicLink && entry.isSymbolicLink()),
        isFIFO: Boolean(entry.isFIFO && entry.isFIFO()),
        isSocket: Boolean(entry.isSocket && entry.isSocket()),
        isCharacterDevice: Boolean(
          entry.isCharacterDevice && entry.isCharacterDevice()
        ),
        isBlockDevice: Boolean(entry.isBlockDevice && entry.isBlockDevice()),
      };
    }
    return entry;
  });
};

const NPM_SCRIPT_NAME_RE = /^[A-Za-z0-9:._-]+$/;

const buildNpmScriptSpawnConfig = ({
  projectPath,
  npmScript,
  keepTerminalOpen,
  platform = process.platform,
  failureMessage = 'Command failed!',
}) => {
  if (typeof npmScript !== 'string' || !NPM_SCRIPT_NAME_RE.test(npmScript)) {
    throw new Error('Invalid npm script name.');
  }
  if (
    typeof projectPath !== 'string' ||
    !projectPath.trim() ||
    /[\0\r\n]/.test(projectPath)
  ) {
    throw new Error('Invalid project path.');
  }

  const resolvedProjectPath = path.resolve(projectPath);
  const projectStat = fs.statSync(resolvedProjectPath);
  if (!projectStat.isDirectory()) {
    throw new Error('Project path must be an existing directory.');
  }

  const npmCommand = `npm run ${npmScript}`;
  const keepOpen = !!keepTerminalOpen;

  if (platform === 'win32') {
    if (/[&|><^%"!\r\n]/.test(resolvedProjectPath)) {
      throw new Error('Project path contains unsafe shell characters.');
    }
    const safeFailureMessage = String(failureMessage).replace(
      /[&|><^%"!()\r\n]/g,
      ''
    );
    const innerCmd = keepOpen
      ? `cd /d "${resolvedProjectPath}" && ${npmCommand}`
      : `cd /d "${resolvedProjectPath}" && ${npmCommand} || (echo. & echo ${safeFailureMessage} & pause)`;
    const cmdCloseFlag = keepOpen ? '/k' : '/c';
    return {
      cwd: resolvedProjectPath,
      command: 'cmd.exe',
      args: ['/c', 'start', '""', 'cmd.exe', cmdCloseFlag, innerCmd],
    };
  }

  if (platform === 'darwin') {
    const escapedPath = resolvedProjectPath.replace(/'/g, "'\\''");
    const safeFailureMessage = String(failureMessage).replace(/'/g, "'\\''");
    const shellCommand = keepOpen
      ? `cd '${escapedPath}' && ${npmCommand}`
      : `cd '${escapedPath}' && ${npmCommand} && exit || echo '${safeFailureMessage}'`;
    const script = `tell application "Terminal" to do script "${shellCommand
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')}"`;
    return {
      cwd: resolvedProjectPath,
      command: 'osascript',
      args: ['-e', script],
    };
  }

  const bashCommand = keepOpen
    ? 'cd -- "$1" && npm run -- "$2"; exec bash'
    : 'cd -- "$1" && npm run -- "$2" || { echo "$3"; exec bash; }';
  return {
    cwd: resolvedProjectPath,
    terminals: [
      {
        cmd: 'x-terminal-emulator',
        args: [
          '-e',
          'bash',
          '-c',
          bashCommand,
          '_',
          resolvedProjectPath,
          npmScript,
          String(failureMessage),
        ],
      },
      {
        cmd: 'gnome-terminal',
        args: [
          '--',
          'bash',
          '-c',
          bashCommand,
          '_',
          resolvedProjectPath,
          npmScript,
          String(failureMessage),
        ],
      },
      {
        cmd: 'konsole',
        args: [
          '-e',
          'bash',
          '-c',
          bashCommand,
          '_',
          resolvedProjectPath,
          npmScript,
          String(failureMessage),
        ],
      },
      {
        cmd: 'xterm',
        args: [
          '-e',
          'bash',
          '-c',
          bashCommand,
          '_',
          resolvedProjectPath,
          npmScript,
          String(failureMessage),
        ],
      },
    ],
  };
};

const tryGetAppPath = name => {
  try {
    return app.getPath(name);
  } catch (err) {
    return '';
  }
};

const safeGetUserInfo = () => {
  try {
    const info = os.userInfo();
    return {
      uid: typeof info.uid === 'number' ? info.uid : -1,
      username: typeof info.username === 'string' ? info.username : '',
    };
  } catch (err) {
    return { uid: -1, username: '' };
  }
};

const DISALLOWED_SHELL_OPEN_EXTENSIONS = new Set([
  '.exe',
  '.msi',
  '.msp',
  '.msix',
  '.bat',
  '.cmd',
  '.com',
  '.scr',
  '.pif',
  '.ps1',
  '.psm1',
  '.psd1',
  '.vbs',
  '.vbe',
  '.js',
  '.jse',
  '.wsf',
  '.wsh',
  '.hta',
  '.cpl',
  '.msc',
  '.reg',
  '.lnk',
  '.scf',
  '.url',
  '.inf',
  '.app',
  '.command',
  '.action',
  '.workflow',
  '.prefpane',
  '.qlgenerator',
  '.pkg',
  '.dmg',
  '.mpkg',
  '.sh',
  '.bash',
  '.zsh',
  '.ksh',
  '.csh',
  '.fish',
  '.run',
  '.appimage',
  '.deb',
  '.rpm',
  '.desktop',
  '.jar',
  '.py',
  '.pyc',
  '.rb',
  '.pl',
  '.php',
]);

const DISALLOWED_SHELL_OPEN_BUNDLE_EXTENSIONS = new Set([
  '.app',
  '.action',
  '.workflow',
  '.prefpane',
  '.qlgenerator',
]);

const getTargetWindow = (event, targetId, resolveWindowByTargetId) => {
  if (
    targetId &&
    typeof targetId === 'string' &&
    typeof resolveWindowByTargetId === 'function'
  ) {
    const targetedWin = resolveWindowByTargetId(targetId);
    if (targetedWin && !targetedWin.isDestroyed()) return targetedWin;
  }
  if (!event || !event.sender) return null;
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win && !win.isDestroyed()) return win;
  return BrowserWindow.getFocusedWindow();
};

const collectMatchingFiles = async (baseFolder, extensions) => {
  let canonicalBaseDir;
  try {
    canonicalBaseDir = await fs.promises.realpath(baseFolder);
  } catch (err) {
    return [];
  }

  const allowedExtSet = new Set(
    (Array.isArray(extensions) ? extensions : [])
      .map(ext =>
        String(ext)
          .toLowerCase()
          .replace(/^\./, '')
      )
      .filter(Boolean)
  );
  const results = [];
  const visitedDirs = new Set();

  const walk = async currentDir => {
    let realDir;
    try {
      realDir = await fs.promises.realpath(currentDir);
    } catch (err) {
      return;
    }
    if (!isPathWithinCanonicalRoot(realDir, canonicalBaseDir)) return;
    if (visitedDirs.has(realDir)) return;
    visitedDirs.add(realDir);

    let entries = [];
    try {
      entries = await fs.promises.readdir(currentDir, { withFileTypes: true });
    } catch (err) {
      return;
    }

    for (const entry of entries) {
      const fullPath = path.join(currentDir, entry.name);
      if (entry.isDirectory()) {
        await walk(fullPath);
      } else if (entry.isSymbolicLink()) {
        try {
          const realTarget = await fs.promises.realpath(fullPath);
          if (!isPathWithinCanonicalRoot(realTarget, canonicalBaseDir)) {
            continue;
          }
          const stat = await fs.promises.stat(realTarget);
          if (stat.isDirectory()) {
            await walk(fullPath);
          } else if (stat.isFile()) {
            const ext = path
              .extname(entry.name)
              .toLowerCase()
              .replace(/^\./, '');
            if (allowedExtSet.size === 0 || allowedExtSet.has(ext)) {
              results.push(fullPath.replace(/\\/g, '/'));
            }
          }
        } catch (err) {
          // Ignore broken symlinks
        }
      } else if (entry.isFile()) {
        const ext = path
          .extname(entry.name)
          .toLowerCase()
          .replace(/^\./, '');
        if (allowedExtSet.size === 0 || allowedExtSet.has(ext)) {
          results.push(fullPath.replace(/\\/g, '/'));
        }
      }
    }
  };

  await walk(canonicalBaseDir);
  return results;
};

const sanitizePopupMenuTemplate = (items, onItemClick) => {
  if (!Array.isArray(items)) return [];
  return items
    .filter(item => item && typeof item === 'object')
    .map(item => {
      const sanitized = {};
      if (typeof item.label === 'string') sanitized.label = item.label;
      if (typeof item.sublabel === 'string') sanitized.sublabel = item.sublabel;
      if (typeof item.type === 'string' && ALLOWED_MENU_TYPES.has(item.type)) {
        sanitized.type = item.type;
      }
      if (typeof item.role === 'string' && ALLOWED_MENU_ROLES.has(item.role)) {
        sanitized.role = item.role;
      }
      if (typeof item.accelerator === 'string') {
        sanitized.accelerator = item.accelerator;
      }
      if (typeof item.enabled === 'boolean') sanitized.enabled = item.enabled;
      if (typeof item.visible === 'boolean') sanitized.visible = item.visible;
      if (typeof item.checked === 'boolean') sanitized.checked = item.checked;
      if (typeof item.actionId === 'string') {
        const actionId = item.actionId;
        sanitized.click = () => onItemClick(actionId);
      }
      if (Array.isArray(item.submenu)) {
        sanitized.submenu = sanitizePopupMenuTemplate(
          item.submenu,
          onItemClick
        );
      }
      return sanitized;
    });
};

let handlersRegistered = false;

const setupDesktopIpcHandlers = ({
  isDev,
  getDefaultArgs,
  getWindowArgsForWebContents,
  mainWindows,
  resolveWindowByTargetId,
  fileAccessPolicy,
  grantSelectedPath,
  temporaryDirectory,
  ipc = electronIpcMain,
}) => {
  if (handlersRegistered) return;
  handlersRegistered = true;
  const ipcMain = ipc;

  const authorizeFsOperation = async (op, args) => {
    if (!fileAccessPolicy)
      throw new Error('File access policy is unavailable.');
    const name = op.replace(/Sync$/, '');
    const writes = new Set([
      'writeFile',
      'outputFile',
      'mkdir',
      'mkdirs',
      'ensureDir',
      'emptyDir',
      'remove',
      'unlink',
    ]);
    if (name === 'copy' || name === 'copyFile') {
      await fileAccessPolicy.assertTreeAccessAsync(args[0], 'read');
      await fileAccessPolicy.assertTreeAccessAsync(args[1], 'write');
    } else {
      fileAccessPolicy.assertAccess(
        args[0],
        writes.has(name) ? 'write' : 'read'
      );
    }
  };
  const grantSelection = (selectedPath, mode, directory = false) => {
    if (grantSelectedPath) grantSelectedPath(selectedPath, mode, directory);
  };
  const requestAccess = async (
    event,
    targetPath,
    { write = false, directory = false } = {}
  ) => {
    assertValidFilePath(targetPath);
    if (!path.isAbsolute(targetPath))
      throw new Error('Expected an absolute path.');
    const mode = write ? 'write' : 'read';
    if (fileAccessPolicy && fileAccessPolicy.hasAccess(targetPath, mode))
      return;
    const result = await dialog.showMessageBox(
      getTargetWindow(event) || undefined,
      {
        type: 'question',
        title: 'File access',
        message: write
          ? 'Allow GDevelop to read and write this location?'
          : 'Allow GDevelop to read this location?',
        detail: `${
          directory ? 'Folder and its contents' : 'File'
        }: ${targetPath}`,
        buttons: ['Cancel', 'Allow'],
        defaultId: 0,
        cancelId: 0,
        noLink: true,
      }
    );
    if (result.response !== 1) throw new Error('File access was canceled.');
    grantSelection(targetPath, mode, !!directory);
    fileAccessPolicy.assertAccess(targetPath, mode);
  };
  ipcMain.handle('desktop-request-file-access', requestAccess);
  ipcMain.handle(
    'desktop-request-project-access',
    async (event, projectPath) => {
      assertValidFilePath(projectPath);
      if (
        !path.isAbsolute(projectPath) ||
        !/\.json(?:\.autosave)?$/i.test(projectPath)
      ) {
        throw new Error('Expected an absolute project JSON path.');
      }
      const folder = path.dirname(projectPath);
      if (fileAccessPolicy && fileAccessPolicy.hasAccess(folder, 'write'))
        return;
      const result = await dialog.showMessageBox(
        getTargetWindow(event) || undefined,
        {
          type: 'question',
          title: 'Open project folder',
          message: 'Allow GDevelop to read and save this project folder?',
          detail: folder,
          buttons: ['Cancel', 'Allow'],
          defaultId: 0,
          cancelId: 0,
          noLink: true,
        }
      );
      if (result.response !== 1)
        throw new Error('Project folder access was canceled.');
      grantSelection(folder, 'write', true);
      fileAccessPolicy.assertAccess(projectPath, 'write');
    }
  );

  const resolveArgs = event => {
    if (
      event &&
      event.sender &&
      typeof getWindowArgsForWebContents === 'function'
    ) {
      const windowArgs = getWindowArgsForWebContents(event.sender);
      if (windowArgs) return windowArgs;
    }
    return typeof getDefaultArgs === 'function' ? getDefaultArgs() : {};
  };

  ipcMain.on('desktop-get-bootstrap-data-sync', event => {
    const win = getTargetWindow(event);
    const resolvedArgs = resolveArgs(event);
    const isCliOrMcpSession = Boolean(
      resolvedArgs && (resolvedArgs['run-command'] || resolvedArgs.mcp)
    );
    event.returnValue = {
      isDev: !!isDev,
      platform: process.platform,
      arch: process.arch,
      systemVersion:
        typeof process.getSystemVersion === 'function'
          ? process.getSystemVersion()
          : '',
      pid: process.pid,
      appPath: app.getAppPath(),
      cwd: process.cwd(),
      windowId: win ? win.id : 0,
      paths: {
        home: tryGetAppPath('home'),
        documents: tryGetAppPath('documents'),
        downloads: tryGetAppPath('downloads'),
        temp: temporaryDirectory || tryGetAppPath('temp'),
        exe: tryGetAppPath('exe'),
        userData: tryGetAppPath('userData'),
        appData: tryGetAppPath('appData'),
        desktop: tryGetAppPath('desktop'),
      },
      userInfo: safeGetUserInfo(),
      args: resolvedArgs,
      cliLoginEnv: isCliOrMcpSession
        ? {
            GDEVELOP_CLI_EMAIL: process.env.GDEVELOP_CLI_EMAIL || '',
            GDEVELOP_CLI_PASSWORD: process.env.GDEVELOP_CLI_PASSWORD || '',
          }
        : {},
      isFullScreen: win ? win.isFullScreen() : false,
    };
  });

  ipcMain.on('desktop-get-arguments-sync', event => {
    event.returnValue = resolveArgs(event);
  });

  ipcMain.handle('desktop-get-arguments', event => resolveArgs(event));

  ipcMain.handle('desktop-app-quit', () => {
    app.quit();
  });

  ipcMain.handle('desktop-app-get-app-path', () => app.getAppPath());

  ipcMain.handle('desktop-app-get-path', (_event, name) => {
    if (!ALLOWED_APP_PATHS.has(name)) {
      throw new Error(`Disallowed app path requested: ${String(name)}`);
    }
    return name === 'temp' && temporaryDirectory
      ? temporaryDirectory
      : app.getPath(name);
  });

  ipcMain.on('desktop-app-get-path-sync', (event, name) => {
    if (!ALLOWED_APP_PATHS.has(name)) {
      event.returnValue = {
        ok: false,
        error: { message: `Disallowed app path requested: ${String(name)}` },
      };
      return;
    }
    try {
      event.returnValue = {
        ok: true,
        result:
          name === 'temp' && temporaryDirectory
            ? temporaryDirectory
            : app.getPath(name),
      };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: {
          message: err.message,
          code: err.code,
          errno: err.errno,
          syscall: err.syscall,
          path: err.path,
        },
      };
    }
  });

  ipcMain.handle('desktop-app-get-gpu-info', async (_event, infoType) => {
    const safeType = infoType === 'basic' ? 'basic' : 'complete';
    return app.getGPUInfo(safeType);
  });

  ipcMain.handle('desktop-window-set-title', (event, title) => {
    const win = getTargetWindow(event);
    if (win && !win.isDestroyed()) {
      win.setTitle(typeof title === 'string' ? title : String(title || ''));
    }
  });

  ipcMain.handle('desktop-window-set-bounds', (event, bounds) => {
    const win = getTargetWindow(event);
    if (!win || win.isDestroyed() || !bounds || typeof bounds !== 'object') {
      return;
    }
    const x = Number(bounds.x);
    const y = Number(bounds.y);
    const width = Number(bounds.width);
    const height = Number(bounds.height);
    if (
      !Number.isFinite(x) ||
      !Number.isFinite(y) ||
      !Number.isFinite(width) ||
      !Number.isFinite(height)
    ) {
      return;
    }

    let scaleFactor = 1;
    if (process.platform === 'win32') {
      const rect = { x, y, width, height };
      const display = screen.getDisplayMatching(rect);
      scaleFactor = display && display.scaleFactor ? display.scaleFactor : 1;
    }

    try {
      win.setBounds({
        x: Math.round(x / scaleFactor),
        y: Math.round(y / scaleFactor),
        width: Math.round(width / scaleFactor),
        height: Math.round(height / scaleFactor),
      });
    } catch (err) {
      // Match existing Window.setBounds tolerance
    }
    if (!win.isDestroyed()) {
      win.showInactive();
      win.setAlwaysOnTop(true);
    }
  });

  ipcMain.handle('desktop-window-show', event => {
    const win = getTargetWindow(event);
    if (!win || win.isDestroyed()) return;
    win.showInactive();
    win.setAlwaysOnTop(true);
  });

  ipcMain.handle('desktop-window-hide', (event, forceHide) => {
    const win = getTargetWindow(event);
    if (!win || win.isDestroyed()) return;
    if (!win.isFocused() || forceHide) {
      win.setAlwaysOnTop(false);
      win.hide();
    }
  });

  ipcMain.handle('desktop-window-focus', event => {
    const win = getTargetWindow(event);
    if (win && !win.isDestroyed()) win.focus();
  });

  ipcMain.handle('desktop-window-close', event => {
    const win = getTargetWindow(event);
    if (win && !win.isDestroyed()) win.close();
  });

  ipcMain.on('desktop-window-is-full-screen-sync', event => {
    const win = getTargetWindow(event);
    event.returnValue = win && !win.isDestroyed() ? win.isFullScreen() : false;
  });

  ipcMain.handle('desktop-window-set-full-screen', (event, fullScreen) => {
    const win = getTargetWindow(event);
    if (win && !win.isDestroyed()) win.setFullScreen(!!fullScreen);
  });

  ipcMain.handle('desktop-window-is-focused', event => {
    const win = getTargetWindow(event);
    return win && !win.isDestroyed() ? win.isFocused() : false;
  });

  ipcMain.handle('desktop-window-is-visible', event => {
    const win = getTargetWindow(event);
    return win && !win.isDestroyed() ? win.isVisible() : false;
  });

  ipcMain.handle('desktop-dialog-show-open', async (event, options) => {
    const win = getTargetWindow(event);
    const result = await dialog.showOpenDialog(win || undefined, options || {});
    if (
      result &&
      !result.canceled &&
      Array.isArray(result.filePaths)
    ) {
      for (const selectedPath of result.filePaths) {
        const stat = await fs.stat(selectedPath);
        grantSelection(selectedPath, 'read', stat.isDirectory());
      }
    }
    return result;
  });

  ipcMain.handle('desktop-dialog-show-save', async (event, options) => {
    const win = getTargetWindow(event);
    const result = await dialog.showSaveDialog(win || undefined, options || {});
    if (
      result &&
      !result.canceled &&
      typeof result.filePath === 'string' &&
      result.filePath
    ) {
      grantSelection(result.filePath, 'write');
    }
    return result;
  });

  ipcMain.on('desktop-dialog-show-save-sync', (event, options) => {
    const win = getTargetWindow(event);
    try {
      const result = dialog.showSaveDialogSync(win || undefined, options || {});
      if (typeof result === 'string' && result) {
        grantSelection(result, 'write');
      }
      event.returnValue = { ok: true, result };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: { message: err.message, code: err.code },
      };
    }
  });

  ipcMain.handle('desktop-dialog-show-message-box', (event, options) => {
    const win = getTargetWindow(event);
    return dialog.showMessageBox(win || undefined, options || {});
  });

  ipcMain.on('desktop-dialog-show-message-box-sync', (event, options) => {
    const win = getTargetWindow(event);
    try {
      const result = dialog.showMessageBoxSync(win || undefined, options || {});
      event.returnValue = { ok: true, result };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: { message: err.message, code: err.code },
      };
    }
  });

  ipcMain.handle('desktop-shell-open-external', async (_event, rawUrl) => {
    if (!isSafeExternalUrl(rawUrl)) {
      throw new Error(`Refused to open unsafe external URL: ${String(rawUrl)}`);
    }
    return shell.openExternal(rawUrl);
  });

  ipcMain.handle('desktop-shell-open-path', async (_event, targetPath) => {
    assertValidFilePath(targetPath);
    const resolvedPath = path.resolve(targetPath);
    let realPath = resolvedPath;
    let stats = null;
    try {
      realPath = await fs.promises.realpath(resolvedPath);
      stats = await fs.promises.stat(realPath);
    } catch (err) {
      stats = null;
    }

    const resolvedExt = path.extname(resolvedPath).toLowerCase();
    const realExt = path.extname(realPath).toLowerCase();
    if (stats && stats.isDirectory()) {
      if (
        DISALLOWED_SHELL_OPEN_BUNDLE_EXTENSIONS.has(resolvedExt) ||
        DISALLOWED_SHELL_OPEN_BUNDLE_EXTENSIONS.has(realExt)
      ) {
        throw new Error(
          `Refused to directly launch executable bundle via shell.openPath: ${resolvedPath}`
        );
      }
      return shell.openPath(resolvedPath);
    }

    if (
      DISALLOWED_SHELL_OPEN_EXTENSIONS.has(resolvedExt) ||
      DISALLOWED_SHELL_OPEN_EXTENSIONS.has(realExt)
    ) {
      throw new Error(
        `Refused to directly launch executable file via shell.openPath: ${resolvedPath}`
      );
    }
    return shell.openPath(resolvedPath);
  });

  ipcMain.handle(
    'desktop-shell-show-item-in-folder',
    async (_event, targetPath) => {
      assertValidFilePath(targetPath);
      shell.showItemInFolder(path.resolve(targetPath));
    }
  );

  ipcMain.handle('desktop-show-edit-context-menu', (event, targetId) => {
    const win = getTargetWindow(event, targetId, resolveWindowByTargetId);
    if (!win || win.isDestroyed()) return;
    const buildEditorContextMenu = require('electron-editor-context-menu');
    const menu = buildEditorContextMenu();
    menu.popup({ window: win });
  });

  ipcMain.handle(
    'desktop-popup-menu',
    (event, { template, x, y, targetId } = {}) =>
      new Promise(resolve => {
        const win = getTargetWindow(event, targetId, resolveWindowByTargetId);
        if (!win || win.isDestroyed()) {
          resolve({ clickedActionId: null });
          return;
        }

        let clickedActionId = null;
        let settled = false;
        const finish = () => {
          if (settled) return;
          settled = true;
          if (typeof win.removeListener === 'function') {
            win.removeListener('closed', finish);
          }
          resolve({ clickedActionId });
        };

        const sanitizedTemplate = sanitizePopupMenuTemplate(
          template,
          actionId => {
            clickedActionId = actionId;
            finish();
          }
        );

        if (sanitizedTemplate.length === 0) {
          resolve({ clickedActionId: null });
          return;
        }

        const menu = Menu.buildFromTemplate(sanitizedTemplate);
        const popupOptions = {
          window: win,
          callback: () => {
            setTimeout(finish, 50);
          },
        };
        if (typeof x === 'number' && Number.isFinite(x)) {
          popupOptions.x = Math.round(x);
        }
        if (typeof y === 'number' && Number.isFinite(y)) {
          popupOptions.y = Math.round(y);
        }
        if (typeof win.once === 'function') {
          win.once('closed', finish);
        }
        try {
          menu.popup(popupOptions);
        } catch (err) {
          finish();
        }
      })
  );

  ipcMain.handle('desktop-fs-invoke', async (_event, op, args) => {
    const callArgs = Array.isArray(args) ? args : [];
    const executeFsOp = async () => {
      switch (op) {
        case 'readFile': {
          assertValidFilePath(callArgs[0]);
          return fs.readFile(callArgs[0], readFileOptions(callArgs[1]));
        }
        case 'writeFile':
          assertValidFilePath(callArgs[0]);
          return fs.writeFile(callArgs[0], callArgs[1], callArgs[2]);
        case 'outputFile':
          assertValidFilePath(callArgs[0]);
          return fs.outputFile(callArgs[0], callArgs[1], callArgs[2]);
        case 'copyFile':
          assertValidFilePath(callArgs[0]);
          assertValidFilePath(callArgs[1]);
          return fs.copyFile(callArgs[0], callArgs[1]);
        case 'copy':
          assertValidFilePath(callArgs[0]);
          assertValidFilePath(callArgs[1]);
          return fs.copy(callArgs[0], callArgs[1], callArgs[2]);
        case 'ensureDir':
          assertValidFilePath(callArgs[0]);
          return fs.ensureDir(callArgs[0]);
        case 'mkdir':
          assertValidFilePath(callArgs[0]);
          return fs.mkdir(callArgs[0], callArgs[1]);
        case 'readdir':
          assertValidFilePath(callArgs[0]);
          return serializeReaddirResult(
            await fs.readdir(callArgs[0], callArgs[1])
          );
        case 'stat': {
          assertValidFilePath(callArgs[0]);
          const s = await fs.stat(callArgs[0]);
          return serializeStats(s);
        }
        case 'lstat': {
          assertValidFilePath(callArgs[0]);
          const s = await fs.lstat(callArgs[0]);
          return serializeStats(s);
        }
        case 'access':
          assertValidFilePath(callArgs[0]);
          return fs.access(callArgs[0], callArgs[1]);
        case 'exists':
          assertValidFilePath(callArgs[0]);
          return fs.pathExists(callArgs[0]);
        case 'unlink':
          assertValidFilePath(callArgs[0]);
          return fs.unlink(callArgs[0]);
        case 'remove':
          assertValidFilePath(callArgs[0]);
          return fs.remove(callArgs[0]);
        case 'emptyDir':
          assertValidFilePath(callArgs[0]);
          return fs.emptyDir(callArgs[0]);
        default:
          return undefined;
      }
    };

    const ALLOWED_ASYNC_FS_OPS = new Set([
      'readFile',
      'writeFile',
      'outputFile',
      'copyFile',
      'copy',
      'ensureDir',
      'mkdir',
      'readdir',
      'stat',
      'lstat',
      'access',
      'exists',
      'unlink',
      'remove',
      'emptyDir',
    ]);
    if (!ALLOWED_ASYNC_FS_OPS.has(op)) {
      throw new Error(`Disallowed fs operation: ${String(op)}`);
    }

    // Validate paths before entering FS error envelope so policy violations reject directly.
    if (op === 'copyFile' || op === 'copy') {
      assertValidFilePath(callArgs[0]);
      assertValidFilePath(callArgs[1]);
    } else {
      assertValidFilePath(callArgs[0]);
    }

    try {
      await authorizeFsOperation(op, callArgs);
      const result = await executeFsOp();
      return { ok: true, result };
    } catch (err) {
      return {
        ok: false,
        error: {
          message: err && err.message ? err.message : String(err),
          code: err && err.code,
          errno: err && err.errno,
          syscall: err && err.syscall,
          path: err && err.path,
        },
      };
    }
  });

  // Emscripten's exporter filesystem contract is synchronous in the renderer.
  // Reply after asynchronous I/O so other editor windows and IPC keep running.
  ipcMain.on('desktop-fs-sync', async (event, request) => {
    if (!request || typeof request !== 'object') {
      event.returnValue = {
        ok: false,
        error: { message: 'Invalid fs sync request' },
      };
      return;
    }

    const op = request.op;
    const callArgs = Array.isArray(request.args) ? request.args : [];
    try {
      await authorizeFsOperation(op, callArgs);
      let result;
      switch (op) {
        case 'readFileSync': {
          assertValidFilePath(callArgs[0]);
          result = await fs.readFile(callArgs[0], readFileOptions(callArgs[1]));
          break;
        }
        case 'writeFileSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.writeFile(callArgs[0], callArgs[1], callArgs[2]);
          break;
        case 'outputFileSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.outputFile(callArgs[0], callArgs[1], callArgs[2]);
          break;
        case 'copyFileSync':
          assertValidFilePath(callArgs[0]);
          assertValidFilePath(callArgs[1]);
          result = await fs.copyFile(callArgs[0], callArgs[1]);
          break;
        case 'copySync':
          assertValidFilePath(callArgs[0]);
          assertValidFilePath(callArgs[1]);
          result = await fs.copy(callArgs[0], callArgs[1], callArgs[2]);
          break;
        case 'mkdirSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.mkdir(callArgs[0], callArgs[1]);
          break;
        case 'mkdirsSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.mkdirs(callArgs[0], callArgs[1]);
          break;
        case 'ensureDirSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.ensureDir(callArgs[0]);
          break;
        case 'emptyDirSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.emptyDir(callArgs[0]);
          break;
        case 'removeSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.remove(callArgs[0]);
          break;
        case 'unlinkSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.unlink(callArgs[0]);
          break;
        case 'readdirSync':
          assertValidFilePath(callArgs[0]);
          result = serializeReaddirResult(
            await fs.readdir(callArgs[0], callArgs[1])
          );
          break;
        case 'statSync':
          assertValidFilePath(callArgs[0]);
          result = serializeStats(await fs.stat(callArgs[0]));
          break;
        case 'lstatSync':
          assertValidFilePath(callArgs[0]);
          result = serializeStats(await fs.lstat(callArgs[0]));
          break;
        case 'accessSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.access(callArgs[0], callArgs[1]);
          break;
        case 'existsSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.pathExists(callArgs[0]);
          break;
        case 'realpathSync':
          assertValidFilePath(callArgs[0]);
          result = await fs.realpath(callArgs[0]);
          break;
        default:
          throw new Error(`Disallowed fs sync operation: ${String(op)}`);
      }
      event.returnValue = { ok: true, result };
    } catch (err) {
      event.returnValue = {
        ok: false,
        error: {
          message: err.message,
          code: err.code,
          errno: err.errno,
          syscall: err.syscall,
          path: err.path,
        },
      };
    }
  });

  ipcMain.handle(
    'desktop-archive-folder',
    async (_event, { folderPath, outputFilename, sizeLimit } = {}) => {
      assertValidFilePath(folderPath);
      assertValidFilePath(outputFilename);
      await fileAccessPolicy.assertTreeAccessAsync(folderPath, 'read');
      fileAccessPolicy.assertAccess(outputFilename, 'write');
      await fs.ensureDir(path.dirname(outputFilename));

      return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outputFilename);
        const archive = archiver('zip', {
          zlib: { level: 9 },
        });

        output.on('close', () => {
          const fileSize = archive.pointer();
          if (sizeLimit && fileSize > sizeLimit) {
            const roundFileSizeInMb = Math.round(fileSize / (1000 * 1000));
            const rejectOversized = () =>
              reject(
                new Error(
                  `Archive is of size ${roundFileSizeInMb} MB, which is above the limit allowed of ${sizeLimit /
                    (1000 * 1000)} MB.`
                )
              );
            fs.promises
              .unlink(outputFilename)
              .catch(() => {})
              .finally(rejectOversized);
            return;
          }
          resolve(outputFilename);
        });
        output.on('error', err => {
          fs.promises
            .unlink(outputFilename)
            .catch(() => {})
            .finally(() => reject(err));
        });
        archive.on('error', err => {
          if (typeof output.destroy === 'function') output.destroy();
          fs.promises
            .unlink(outputFilename)
            .catch(() => {})
            .finally(() => reject(err));
        });

        archive.pipe(output);
        archive.directory(folderPath, false);
        archive.finalize();
      });
    }
  );

  ipcMain.handle(
    'desktop-glob',
    async (_event, { baseFolder, extensions } = {}) => {
      assertValidFilePath(baseFolder);
      fileAccessPolicy.assertAccess(baseFolder, 'read');
      return collectMatchingFiles(baseFolder, extensions);
    }
  );

  app.on('browser-window-focus', (_event, focusedWindow) => {
    if (!mainWindows) return;
    const windowInfo = {
      id: focusedWindow && !focusedWindow.isDestroyed() ? focusedWindow.id : 0,
      title:
        focusedWindow && !focusedWindow.isDestroyed()
          ? focusedWindow.getTitle()
          : '',
    };
    mainWindows.forEach(win => {
      if (
        win &&
        !win.isDestroyed() &&
        win.webContents &&
        !win.webContents.isDestroyed()
      ) {
        win.webContents.send('browser-window-focus', windowInfo);
      }
    });
  });

  app.on('browser-window-blur', (_event, blurredWindow) => {
    if (!mainWindows) return;
    const windowInfo = {
      id: blurredWindow && !blurredWindow.isDestroyed() ? blurredWindow.id : 0,
      title:
        blurredWindow && !blurredWindow.isDestroyed()
          ? blurredWindow.getTitle()
          : '',
    };
    mainWindows.forEach(win => {
      if (
        win &&
        !win.isDestroyed() &&
        win.webContents &&
        !win.webContents.isDestroyed()
      ) {
        win.webContents.send('browser-window-blur', windowInfo);
      }
    });
  });
};

const attachWindowDesktopEvents = browserWindow => {
  if (!browserWindow || browserWindow.isDestroyed()) return;

  browserWindow.on('focus', () => {
    if (
      !browserWindow.isDestroyed() &&
      browserWindow.webContents &&
      !browserWindow.webContents.isDestroyed()
    ) {
      browserWindow.webContents.send('desktop-window-focus');
    }
  });
  browserWindow.on('blur', () => {
    if (
      !browserWindow.isDestroyed() &&
      browserWindow.webContents &&
      !browserWindow.webContents.isDestroyed()
    ) {
      browserWindow.webContents.send('desktop-window-blur');
    }
  });
  browserWindow.on('enter-full-screen', () => {
    if (
      !browserWindow.isDestroyed() &&
      browserWindow.webContents &&
      !browserWindow.webContents.isDestroyed()
    ) {
      browserWindow.webContents.send('desktop-window-enter-full-screen');
    }
  });
  browserWindow.on('leave-full-screen', () => {
    if (
      !browserWindow.isDestroyed() &&
      browserWindow.webContents &&
      !browserWindow.webContents.isDestroyed()
    ) {
      browserWindow.webContents.send('desktop-window-leave-full-screen');
    }
  });
};

module.exports = {
  ALLOWED_APP_PATHS,
  buildNpmScriptSpawnConfig,
  isSafeExternalUrl,
  safeGetUserInfo,
  sanitizePopupMenuTemplate,
  setupDesktopIpcHandlers,
  attachWindowDesktopEvents,
};
