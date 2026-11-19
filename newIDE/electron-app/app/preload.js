const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_LISTEN_CHANNELS = new Set([
  'run-cli-command',
  'mcp-message',
  'mcp-live-message',
  'mcp-live-session-closed',
  'preview-window-closed',
  'local-file-upload-progress',
  'local-file-upload-done',
  'project-file-changed',
  'serve-folder-done',
  'stop-server-done',
  'local-network-ip',
  'local-gdjs-development-watcher-runtime-updated',
  'debugger-message-received',
  'debugger-error-received',
  'debugger-connection-closed',
  'debugger-connection-opened',
  'debugger-connection-errored',
  'debugger-start-server-done',
  'debugger-send-message-done',
  'update-status',
  'browser-window-focus',
  'browser-window-blur',
  'desktop-window-focus',
  'desktop-window-blur',
  'desktop-window-enter-full-screen',
  'desktop-window-leave-full-screen',
  'main-menu-open',
  'main-menu-open-recent',
  'main-menu-save',
  'main-menu-save-as',
  'main-menu-show-version-history',
  'main-menu-close',
  'main-menu-close-app',
  'main-menu-export',
  'main-menu-invite-collaborators',
  'main-menu-create-project',
  'main-menu-create-blank',
  'main-menu-open-project-manager',
  'main-menu-open-home-page',
  'main-menu-open-debugger',
  'main-menu-open-global-search',
  'main-menu-open-about',
  'main-menu-open-preferences',
  'main-menu-open-language',
  'main-menu-open-profile',
  'main-menu-open-ask-ai',
  'main-menu-select-all',
]);

let bootstrapDataCache = null;
const getBootstrapData = () => {
  if (!bootstrapDataCache) {
    bootstrapDataCache = ipcRenderer.sendSync(
      'desktop-get-bootstrap-data-sync'
    );
  }
  return bootstrapDataCache || {};
};

// Return data envelopes across contextBridge: Error custom properties are not cloned.
const callFsSync = (op, args) =>
  ipcRenderer.sendSync('desktop-fs-sync', { op, args });

const listenerMap = new WeakMap();

const addSafeListener = (channel, callback) => {
  if (!ALLOWED_LISTEN_CHANNELS.has(channel)) {
    throw new Error(`Disallowed desktop event channel: ${String(channel)}`);
  }
  if (typeof callback !== 'function') return () => {};
  const wrapped = (_event, ...args) => callback(...args);
  let channelMap = listenerMap.get(callback);
  if (!channelMap) {
    channelMap = new Map();
    listenerMap.set(callback, channelMap);
  }
  let wrappers = channelMap.get(channel);
  if (!wrappers) {
    wrappers = new Set();
    channelMap.set(channel, wrappers);
  }
  wrappers.add(wrapped);
  ipcRenderer.on(channel, wrapped);
  return () => {
    if (wrappers.delete(wrapped)) {
      ipcRenderer.removeListener(channel, wrapped);
    }
    if (wrappers.size === 0) {
      channelMap.delete(channel);
    }
  };
};

const removeSafeListener = (channel, callback) => {
  if (!ALLOWED_LISTEN_CHANNELS.has(channel)) return;
  if (typeof callback !== 'function') return;
  const channelMap = listenerMap.get(callback);
  if (!channelMap) return;
  const wrappers = channelMap.get(channel);
  if (wrappers) {
    wrappers.forEach(wrapped => {
      ipcRenderer.removeListener(channel, wrapped);
    });
    wrappers.clear();
    channelMap.delete(channel);
  }
};

const removeAllSafeListeners = channel => {
  if (!ALLOWED_LISTEN_CHANNELS.has(channel)) return;
  ipcRenderer.removeAllListeners(channel);
};

const callFsAsync = (op, args) =>
  ipcRenderer.invoke('desktop-fs-invoke', op, args);

const desktopApi = Object.freeze({
  requestFileAccess: (targetPath, options) =>
    ipcRenderer.invoke('desktop-request-file-access', targetPath, options),
  readPublicCatalog: name =>
    ipcRenderer.invoke('desktop-read-public-catalog', name),
  requestProjectAccess: projectPath =>
    ipcRenderer.invoke('desktop-request-project-access', projectPath),
  getBootstrapData,
  on: addSafeListener,
  removeListener: removeSafeListener,
  removeAllListeners: removeAllSafeListeners,
  app: Object.freeze({
    quit: () => ipcRenderer.invoke('desktop-app-quit'),
    getAppPath: () => ipcRenderer.invoke('desktop-app-get-app-path'),
    getPath: name => ipcRenderer.invoke('desktop-app-get-path', name),
    getPathSync: name => {
      const response = ipcRenderer.sendSync('desktop-app-get-path-sync', name);
      if (!response || !response.ok) {
        const errInfo = (response && response.error) || {};
        const err = new Error(errInfo.message || `Failed to get path: ${name}`);
        if (errInfo.code) err.code = errInfo.code;
        throw err;
      }
      return response.result;
    },
    getGPUInfo: infoType =>
      ipcRenderer.invoke('desktop-app-get-gpu-info', infoType),
    getArguments: () => ipcRenderer.invoke('desktop-get-arguments'),
    getArgumentsSync: () => ipcRenderer.sendSync('desktop-get-arguments-sync'),
    exit: exitCode =>
      ipcRenderer.send(
        'app-exit',
        typeof exitCode === 'number' && Number.isFinite(exitCode)
          ? Math.trunc(exitCode)
          : 0
      ),
    setWindowProjectPath: filePath =>
      ipcRenderer.send('set-window-project-path', filePath),
  }),
  window: Object.freeze({
    setTitle: title => ipcRenderer.invoke('desktop-window-set-title', title),
    setBounds: bounds =>
      ipcRenderer.invoke('desktop-window-set-bounds', bounds),
    show: () => ipcRenderer.invoke('desktop-window-show'),
    hide: forceHide => ipcRenderer.invoke('desktop-window-hide', !!forceHide),
    focus: () => ipcRenderer.invoke('desktop-window-focus'),
    close: () => ipcRenderer.invoke('desktop-window-close'),
    isFullScreenSync: () =>
      ipcRenderer.sendSync('desktop-window-is-full-screen-sync'),
    setFullScreen: fullScreen =>
      ipcRenderer.invoke('desktop-window-set-full-screen', !!fullScreen),
    isFocused: () => ipcRenderer.invoke('desktop-window-is-focused'),
    isVisible: () => ipcRenderer.invoke('desktop-window-is-visible'),
    toggleMaximize: () => ipcRenderer.invoke('window-maximize-toggle'),
    setTitlebarOverlayOptions: (options, optionalTargetId) =>
      ipcRenderer.invoke(
        'titlebar-set-overlay-options',
        options,
        optionalTargetId
      ),
  }),
  dialog: Object.freeze({
    pickProjectLocation: (kind, defaultPath) =>
      ipcRenderer.invoke('desktop-pick-project-location', kind, defaultPath),
    showOpenDialog: options =>
      ipcRenderer.invoke('desktop-dialog-show-open', options),
    showSaveDialog: options =>
      ipcRenderer.invoke('desktop-dialog-show-save', options),
    showSaveDialogSync: options => {
      const response = ipcRenderer.sendSync(
        'desktop-dialog-show-save-sync',
        options
      );
      if (!response || !response.ok) return undefined;
      return response.result;
    },
    showMessageBox: options =>
      ipcRenderer.invoke('desktop-dialog-show-message-box', options),
    showMessageBoxSync: options => {
      const response = ipcRenderer.sendSync(
        'desktop-dialog-show-message-box-sync',
        options
      );
      if (!response || !response.ok) return 0;
      return response.result;
    },
  }),
  shell: Object.freeze({
    openExternal: url => ipcRenderer.invoke('desktop-shell-open-external', url),
    openPath: targetPath =>
      ipcRenderer.invoke('desktop-shell-open-path', targetPath),
    showItemInFolder: targetPath =>
      ipcRenderer.invoke('desktop-shell-show-item-in-folder', targetPath),
  }),
  clipboard: Object.freeze({
    readText: () => ipcRenderer.sendSync('clipboard-read-text'),
    writeText: text => ipcRenderer.sendSync('clipboard-write-text', text),
  }),
  menu: Object.freeze({
    setMainMenu: template => ipcRenderer.send('set-main-menu', template),
    showEditContextMenu: targetId =>
      ipcRenderer.invoke('desktop-show-edit-context-menu', targetId),
    popupMenu: options => ipcRenderer.invoke('desktop-popup-menu', options),
  }),
  fs: Object.freeze({
    readFile: (filePath, options) =>
      callFsAsync('readFile', [filePath, options]),
    writeFile: (filePath, data, options) =>
      callFsAsync('writeFile', [filePath, data, options]),
    outputFile: (filePath, data, options) =>
      callFsAsync('outputFile', [filePath, data, options]),
    copyFile: (src, dest) => callFsAsync('copyFile', [src, dest]),
    copy: (src, dest, options) => callFsAsync('copy', [src, dest, options]),
    ensureDir: dirPath => callFsAsync('ensureDir', [dirPath]),
    mkdir: (dirPath, options) => callFsAsync('mkdir', [dirPath, options]),
    readdir: (dirPath, options) => callFsAsync('readdir', [dirPath, options]),
    stat: targetPath => callFsAsync('stat', [targetPath]),
    lstat: targetPath => callFsAsync('lstat', [targetPath]),
    access: (targetPath, mode) => callFsAsync('access', [targetPath, mode]),
    exists: targetPath => callFsAsync('exists', [targetPath]),
    unlink: targetPath => callFsAsync('unlink', [targetPath]),
    remove: targetPath => callFsAsync('remove', [targetPath]),
    emptyDir: dirPath => callFsAsync('emptyDir', [dirPath]),
    readFileSync: (filePath, options) =>
      callFsSync('readFileSync', [filePath, options]),
    writeFileSync: (filePath, data, options) =>
      callFsSync('writeFileSync', [filePath, data, options]),
    outputFileSync: (filePath, data, options) =>
      callFsSync('outputFileSync', [filePath, data, options]),
    copyFileSync: (src, dest) => callFsSync('copyFileSync', [src, dest]),
    copySync: (src, dest, options) =>
      callFsSync('copySync', [src, dest, options]),
    mkdirSync: (dirPath, options) =>
      callFsSync('mkdirSync', [dirPath, options]),
    mkdirsSync: (dirPath, options) =>
      callFsSync('mkdirsSync', [dirPath, options]),
    ensureDirSync: dirPath => callFsSync('ensureDirSync', [dirPath]),
    emptyDirSync: dirPath => callFsSync('emptyDirSync', [dirPath]),
    removeSync: targetPath => callFsSync('removeSync', [targetPath]),
    unlinkSync: targetPath => callFsSync('unlinkSync', [targetPath]),
    readdirSync: (dirPath, options) =>
      callFsSync('readdirSync', [dirPath, options]),
    statSync: targetPath => callFsSync('statSync', [targetPath]),
    lstatSync: targetPath => callFsSync('lstatSync', [targetPath]),
    accessSync: (targetPath, mode) =>
      callFsSync('accessSync', [targetPath, mode]),
    existsSync: targetPath => callFsSync('existsSync', [targetPath]),
    realpathSync: targetPath => callFsSync('realpathSync', [targetPath]),
    archiveFolder: options =>
      ipcRenderer.invoke('desktop-archive-folder', options),
    glob: options => ipcRenderer.invoke('desktop-glob', options),
  }),
  preview: Object.freeze({
    open: options => ipcRenderer.invoke('preview-open', options),
    close: options => ipcRenderer.invoke('preview-close', options),
    closeAll: () => ipcRenderer.invoke('preview-close-all'),
  }),
  externalEditor: Object.freeze({
    openPiskel: input => ipcRenderer.invoke('piskel-load', input),
    openJfxr: input => ipcRenderer.invoke('jfxr-load', input),
    openYarn: input => ipcRenderer.invoke('yarn-load', input),
  }),
  fileTransfer: Object.freeze({
    downloadLocalFile: (url, outputPath) =>
      ipcRenderer.invoke('local-file-download', url, outputPath),
    saveLocalFileFromArrayBuffer: (arrayBuffer, outputPath) =>
      ipcRenderer.invoke(
        'local-file-save-from-arraybuffer',
        arrayBuffer,
        outputPath
      ),
    uploadLocalFile: (localFilePath, uploadOptions) =>
      ipcRenderer.send('local-file-upload', localFilePath, uploadOptions),
  }),
  fsWatcher: Object.freeze({
    setup: (folderPath, serializedOptions) =>
      ipcRenderer.invoke(
        'local-filesystem-watcher-setup',
        folderPath,
        serializedOptions
      ),
    disable: id => ipcRenderer.invoke('local-filesystem-watcher-disable', id),
  }),
  serveFolder: Object.freeze({
    start: options => ipcRenderer.send('serve-folder', options),
    stop: () => ipcRenderer.send('stop-server'),
    getLocalNetworkIp: () => ipcRenderer.send('get-local-network-ip'),
  }),
  gdjsWatcher: Object.freeze({
    setup: () => ipcRenderer.send('setup-local-gdjs-development-watcher'),
    close: () => ipcRenderer.send('close-local-gdjs-development-watcher'),
  }),
  debuggerServer: Object.freeze({
    start: options => ipcRenderer.send('debugger-start-server', options),
    sendMessage: message => ipcRenderer.send('debugger-send-message', message),
    closeAllConnections: () =>
      ipcRenderer.send('debugger-close-all-connections'),
  }),
  updates: Object.freeze({
    checkAndDownload: options =>
      ipcRenderer.send('updates-check-and-download', options),
    check: options => ipcRenderer.send('updates-check', options),
    installAndQuit: () => ipcRenderer.send('updates-install-and-quit'),
  }),
  mcp: Object.freeze({
    ready: () => ipcRenderer.send('mcp-ready'),
    sendCliResponse: payload => ipcRenderer.send('mcp-send', payload),
    sendLiveResponse: payload => ipcRenderer.send('mcp-live-send', payload),
    getLiveServerStatus: () => ipcRenderer.invoke('mcp-live-server-get-status'),
    setLiveServerEnabled: enabled =>
      ipcRenderer.invoke('mcp-live-server-set-enabled', enabled),
    resetLiveServerToken: () =>
      ipcRenderer.invoke('mcp-live-server-reset-token'),
  }),
  cli: Object.freeze({
    writeStdout: text => ipcRenderer.invoke('cli-write-stdout', text),
    readStdin: () => ipcRenderer.invoke('cli-read-stdin'),
    installInPath: () => ipcRenderer.invoke('install-cli-in-path'),
  }),
  discord: Object.freeze({
    updateRichPresence: config =>
      ipcRenderer.send('update-discord-rich-presence', config),
  }),
  npmScript: Object.freeze({
    run: options => ipcRenderer.send('run-npm-script', options),
  }),
});

contextBridge.exposeInMainWorld('gdevelopDesktop', desktopApi);
