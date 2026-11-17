const { contextBridge, ipcRenderer } = require('electron');

const ALLOWED_WINDOW_CALL_METHODS = new Set([
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

const ALLOWED_APP_PATHS = new Set([
  'desktop',
  'documents',
  'pictures',
  'exe',
  'userData',
  'home',
  'temp',
]);

const ALLOWED_PATH_OPS = new Set(['dirname', 'basename', 'extname']);

const unwrapResponse = (response, defaultErrorMessage) => {
  if (
    response &&
    typeof response === 'object' &&
    Object.prototype.hasOwnProperty.call(response, 'ok')
  ) {
    if (!response.ok) {
      const errInfo = response.error || {};
      const err = new Error(errInfo.message || defaultErrorMessage);
      if (errInfo.code) err.code = errInfo.code;
      throw err;
    }
    return response.result;
  }
  return response;
};

const callFsSync = (op, args) =>
  unwrapResponse(
    ipcRenderer.sendSync('preview-fs-sync', { op, args }),
    `Preview FS operation failed: ${op}`
  );

const callFsAsync = async (op, args) =>
  unwrapResponse(
    await ipcRenderer.invoke('preview-fs-invoke', op, args),
    `Preview FS async operation failed: ${op}`
  );

const fsPromises = Object.freeze({
  mkdir: (dirPath, options) => callFsAsync('mkdir', [dirPath, options]),
  writeFile: (filePath, data, options) =>
    callFsAsync('writeFile', [filePath, data, options]),
  readFile: (filePath, options) => callFsAsync('readFile', [filePath, options]),
  rm: (targetPath, options) => callFsAsync('rm', [targetPath, options]),
  unlink: filePath => callFsAsync('unlink', [filePath]),
  readdir: (dirPath, options) => callFsAsync('readdir', [dirPath, options]),
});

const invokeWithOptionalCallback = (promise, callback) => {
  if (typeof callback === 'function') {
    promise.then(result => callback(null, result), err => callback(err));
    return undefined;
  }
  return promise;
};

const previewApi = Object.freeze({
  steam: Object.freeze({
    initialize: appId =>
      unwrapResponse(
        ipcRenderer.sendSync('preview-steam-sync', 'initialize', [appId]),
        'Steam initialization failed'
      ),
    call: (method, args) =>
      unwrapResponse(
        ipcRenderer.sendSync('preview-steam-sync', method, args),
        'Steam call failed'
      ),
    invoke: (method, args) =>
      ipcRenderer.invoke('preview-steam-invoke', method, args),
  }),
  isPreview: true,
  platform: process.platform,
  windowCallSync: (methodName, args = []) => {
    if (!ALLOWED_WINDOW_CALL_METHODS.has(methodName)) {
      throw new Error(
        `Disallowed preview window method: ${String(methodName)}`
      );
    }
    const response = ipcRenderer.sendSync(
      'preview-window-call-sync',
      methodName,
      Array.isArray(args) ? args : []
    );
    return unwrapResponse(
      response,
      `Preview window call failed: ${String(methodName)}`
    );
  },
  app: Object.freeze({
    getPath: name => {
      if (!ALLOWED_APP_PATHS.has(name)) {
        throw new Error(`Disallowed preview app path: ${String(name)}`);
      }
      return unwrapResponse(
        ipcRenderer.sendSync('preview-app-get-path-sync', name),
        `Failed to get preview path: ${String(name)}`
      );
    },
    quit: () => ipcRenderer.invoke('preview-window-close-self'),
  }),
  shell: Object.freeze({
    openExternal: url => ipcRenderer.invoke('preview-shell-open-external', url),
  }),
  path: Object.freeze({
    sep: process.platform === 'win32' ? '\\' : '/',
    dirname: targetPath =>
      unwrapResponse(
        ipcRenderer.sendSync('preview-path-call-sync', 'dirname', [targetPath]),
        'Preview path.dirname failed'
      ),
    basename: targetPath =>
      unwrapResponse(
        ipcRenderer.sendSync('preview-path-call-sync', 'basename', [
          targetPath,
        ]),
        'Preview path.basename failed'
      ),
    extname: targetPath =>
      unwrapResponse(
        ipcRenderer.sendSync('preview-path-call-sync', 'extname', [targetPath]),
        'Preview path.extname failed'
      ),
    call: (op, targetPath) => {
      if (!ALLOWED_PATH_OPS.has(op)) {
        throw new Error(`Disallowed preview path op: ${String(op)}`);
      }
      return unwrapResponse(
        ipcRenderer.sendSync('preview-path-call-sync', op, [targetPath]),
        `Preview path.${String(op)} failed`
      );
    },
  }),
  fs: Object.freeze({
    existsSync: targetPath => callFsSync('existsSync', [targetPath]),
    mkdirSync: (dirPath, options) =>
      callFsSync('mkdirSync', [dirPath, options]),
    writeFileSync: (filePath, data, options) =>
      callFsSync('writeFileSync', [filePath, data, options]),
    readFileSync: (filePath, options) =>
      callFsSync('readFileSync', [filePath, options]),
    unlinkSync: filePath => callFsSync('unlinkSync', [filePath]),
    readdirSync: (dirPath, options) =>
      callFsSync('readdirSync', [dirPath, options]),
    writeFile: (filePath, data, encodingOrCallback, maybeCallback) => {
      const hasOptions = typeof encodingOrCallback !== 'function';
      const options = hasOptions ? encodingOrCallback : undefined;
      const callback = hasOptions ? maybeCallback : encodingOrCallback;
      return invokeWithOptionalCallback(
        fsPromises.writeFile(filePath, data, options),
        callback
      );
    },
    readFile: (filePath, encodingOrCallback, maybeCallback) => {
      const hasOptions = typeof encodingOrCallback !== 'function';
      const options = hasOptions ? encodingOrCallback : undefined;
      const callback = hasOptions ? maybeCallback : encodingOrCallback;
      return invokeWithOptionalCallback(
        fsPromises.readFile(filePath, options),
        callback
      );
    },
    unlink: (filePath, callback) =>
      invokeWithOptionalCallback(fsPromises.unlink(filePath), callback),
    promises: fsPromises,
  }),
});

contextBridge.exposeInMainWorld('gdevelopPreview', previewApi);
