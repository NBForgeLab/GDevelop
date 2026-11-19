// @flow
import optionalRequire from './OptionalRequire';
import optionalLazyRequire from './OptionalLazyRequire';
import { isReactAppEnvDevelopment } from './BuildEnv';
import { createDesktopPath, type DesktopPathInterface } from './DesktopPath';

type BootstrapData = {|
  isDev: boolean,
  platform: string,
  arch: string,
  systemVersion: string,
  pid: number,
  appPath: string,
  cwd: string,
  windowId: number,
  paths: { [string]: string },
  userInfo: {| uid: number, username: string |},
  args: Object,
  cliLoginEnv: { [string]: ?string },
  isFullScreen: boolean,
|};

export type DesktopStats = {|
  isDirectory: () => boolean,
  isFile: () => boolean,
  isSymbolicLink: () => boolean,
  size: number,
  mtimeMs: number,
  mtime: Date,
|};

export type DesktopFsInterface = {|
  constants: {| F_OK: number, R_OK: number, W_OK: number, X_OK: number |},
  promises: {|
    readFile: (filePath: string, options?: any) => Promise<any>,
    writeFile: (filePath: string, data: any, options?: any) => Promise<void>,
    outputFile: (filePath: string, data: any, options?: any) => Promise<void>,
    copyFile: (src: string, dest: string) => Promise<void>,
    copy: (src: string, dest: string, options?: any) => Promise<void>,
    ensureDir: (dirPath: string) => Promise<void>,
    mkdir: (dirPath: string, options?: any) => Promise<void>,
    readdir: (dirPath: string, options?: any) => Promise<Array<any>>,
    stat: (targetPath: string) => Promise<DesktopStats>,
    lstat: (targetPath: string) => Promise<DesktopStats>,
    access: (targetPath: string, mode?: number) => Promise<void>,
    exists: (targetPath: string) => Promise<boolean>,
    unlink: (targetPath: string) => Promise<void>,
    remove: (targetPath: string) => Promise<void>,
    emptyDir: (dirPath: string) => Promise<void>,
  |},
  readFile: (filePath: string, optionsOrCb: any, maybeCb?: Function) => any,
  writeFile: (
    filePath: string,
    data: any,
    optionsOrCb: any,
    maybeCb?: Function
  ) => any,
  outputFile: (
    filePath: string,
    data: any,
    optionsOrCb: any,
    maybeCb?: Function
  ) => Promise<void>,
  copyFile: (src: string, dest: string, cb?: Function) => any,
  ensureDir: (dirPath: string, cb?: Function) => Promise<void>,
  mkdir: (dirPath: string, optionsOrCb: any, maybeCb?: Function) => any,
  readdir: (dirPath: string, optionsOrCb: any, maybeCb?: Function) => any,
  stat: (targetPath: string, cb?: Function) => any,
  lstat: (targetPath: string, cb?: Function) => any,
  access: (targetPath: string, modeOrCb: any, maybeCb?: Function) => any,
  readFileSync: (filePath: string, options?: any) => any,
  writeFileSync: (filePath: string, data: any, options?: any) => void,
  outputFileSync: (filePath: string, data: any, options?: any) => void,
  copyFileSync: (src: string, dest: string) => void,
  copySync: (src: string, dest: string, options?: any) => void,
  mkdirSync: (dirPath: string, options?: any) => void,
  mkdirsSync: (dirPath: string, options?: any) => void,
  ensureDirSync: (dirPath: string) => void,
  emptyDirSync: (dirPath: string) => void,
  removeSync: (targetPath: string) => void,
  unlinkSync: (targetPath: string) => void,
  readdirSync: (dirPath: string, options?: any) => Array<any>,
  statSync: (targetPath: string) => DesktopStats,
  lstatSync: (targetPath: string) => DesktopStats,
  accessSync: (targetPath: string, mode?: number) => void,
  existsSync: (targetPath: string) => boolean,
  realpathSync: (targetPath: string) => string,
|};

const getWindowDesktopApi = (): ?any => {
  if (typeof window !== 'undefined' && window.gdevelopDesktop) {
    return window.gdevelopDesktop;
  }
  return null;
};

const getBootstrapData = (): ?BootstrapData => {
  const api = getWindowDesktopApi();
  if (!api || typeof api.getBootstrapData !== 'function') return null;
  return api.getBootstrapData();
};

const wrapSerializedStats = (rawStats: any): DesktopStats => {
  const mtimeMs = typeof rawStats.mtimeMs === 'number' ? rawStats.mtimeMs : 0;
  return {
    isDirectory: () =>
      typeof rawStats.isDirectory === 'function'
        ? rawStats.isDirectory()
        : Boolean(rawStats.isDirectory),
    isFile: () =>
      typeof rawStats.isFile === 'function'
        ? rawStats.isFile()
        : Boolean(rawStats.isFile),
    isSymbolicLink: () =>
      typeof rawStats.isSymbolicLink === 'function'
        ? rawStats.isSymbolicLink()
        : Boolean(rawStats.isSymbolicLink),
    size: typeof rawStats.size === 'number' ? rawStats.size : 0,
    mtimeMs,
    mtime: rawStats.mtime instanceof Date ? rawStats.mtime : new Date(mtimeMs),
  };
};

const wrapSerializedDirent = (entry: any): any => {
  if (!entry || typeof entry !== 'object' || !entry.__isDirent) {
    return entry;
  }
  return {
    name: typeof entry.name === 'string' ? entry.name : '',
    parentPath: typeof entry.parentPath === 'string' ? entry.parentPath : '',
    isDirectory: () =>
      typeof entry.isDirectory === 'function'
        ? entry.isDirectory()
        : Boolean(entry.isDirectory),
    isFile: () =>
      typeof entry.isFile === 'function'
        ? entry.isFile()
        : Boolean(entry.isFile),
    isSymbolicLink: () =>
      typeof entry.isSymbolicLink === 'function'
        ? entry.isSymbolicLink()
        : Boolean(entry.isSymbolicLink),
    isFIFO: () =>
      typeof entry.isFIFO === 'function'
        ? entry.isFIFO()
        : Boolean(entry.isFIFO),
    isSocket: () =>
      typeof entry.isSocket === 'function'
        ? entry.isSocket()
        : Boolean(entry.isSocket),
    isCharacterDevice: () =>
      typeof entry.isCharacterDevice === 'function'
        ? entry.isCharacterDevice()
        : Boolean(entry.isCharacterDevice),
    isBlockDevice: () =>
      typeof entry.isBlockDevice === 'function'
        ? entry.isBlockDevice()
        : Boolean(entry.isBlockDevice),
  };
};

const wrapReaddirResult = (entries: any): any => {
  if (!Array.isArray(entries)) return entries;
  return entries.map(wrapSerializedDirent);
};

const uint8ArrayToBase64 = (bytes: Uint8Array): string => {
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, Array.from(chunk));
  }
  if (typeof btoa === 'function') {
    return btoa(binary);
  }
  return '';
};

const safelyIgnorePromise = (maybePromise: any, label: string) => {
  if (maybePromise && typeof maybePromise.catch === 'function') {
    maybePromise.catch(error => {
      console.warn(`[DesktopService] ${label} failed:`, error);
    });
  }
};

const wrapBinaryResult = (result: any): any => {
  if (!(result instanceof Uint8Array)) return result;
  const typedResult: any = result;
  if (typeof typedResult.toString === 'function') {
    const originalToString = typedResult.toString.bind(result);
    try {
      Object.defineProperty(typedResult, 'toString', {
        value: function toString(...args: Array<any>) {
          const [encoding, start, end] = args;
          const targetBytes =
            start !== undefined || end !== undefined
              ? result.subarray(
                  typeof start === 'number' ? start : 0,
                  typeof end === 'number' ? end : result.length
                )
              : result;
          if (!encoding || encoding === 'utf8' || encoding === 'utf-8') {
            if (typeof TextDecoder === 'function') {
              // $FlowFixMe[cannot-resolve-name]
              return new TextDecoder('utf-8').decode(targetBytes);
            }
          }
          if (encoding === 'base64') {
            return uint8ArrayToBase64(targetBytes);
          }
          if (encoding === 'hex') {
            return Array.from(targetBytes, byte =>
              byte.toString(16).padStart(2, '0')
            ).join('');
          }
          if (encoding === 'latin1' || encoding === 'binary') {
            let out = '';
            for (let i = 0; i < targetBytes.length; i++) {
              out += String.fromCharCode(targetBytes[i]);
            }
            return out;
          }
          return originalToString(...args);
        },
        configurable: true,
        writable: true,
      });
    } catch (e) {
      // Ignore if non-configurable.
    }
  }
  return result;
};

const wrapCallbackPromise = (promise: Promise<any>, cb?: Function): any => {
  if (typeof cb === 'function') {
    promise.then(result => cb(null, result), err => cb(err));
    return undefined;
  }
  return promise;
};

let cachedBridgePath: ?DesktopPathInterface = null;
let cachedBridgePlatform: ?string = null;
let cachedBridgeFs: ?DesktopFsInterface = null;

const createBridgeFs = (desktopApi: any): DesktopFsInterface => {
  const unwrap = (response: any): any => {
    if (!response || typeof response.ok !== 'boolean') return response;
    if (!response.ok) {
      const error: any = new Error(response.error.message);
      error.code = response.error.code;
      error.errno = response.error.errno;
      error.path = response.error.path;
      error.syscall = response.error.syscall;
      throw error;
    }
    return response.result;
  };
  const fsBridge: any = {};
  Object.keys(desktopApi.fs).forEach(name => {
    fsBridge[name] = (...args: Array<any>) => {
      const result = desktopApi.fs[name](...args);
      return result && typeof result.then === 'function'
        ? result.then(unwrap)
        : unwrap(result);
    };
  });
  const promises = {
    readFile: async (filePath: string, options?: any) =>
      wrapBinaryResult(await fsBridge.readFile(filePath, options)),
    writeFile: (filePath: string, data: any, options?: any) =>
      fsBridge.writeFile(filePath, data, options),
    outputFile: (filePath: string, data: any, options?: any) =>
      fsBridge.outputFile(filePath, data, options),
    copyFile: (src: string, dest: string) => fsBridge.copyFile(src, dest),
    copy: (src: string, dest: string, options?: any) =>
      fsBridge.copy(src, dest, options),
    ensureDir: (dirPath: string) => fsBridge.ensureDir(dirPath),
    mkdir: (dirPath: string, options?: any) => fsBridge.mkdir(dirPath, options),
    readdir: async (dirPath: string, options?: any) =>
      wrapReaddirResult(await fsBridge.readdir(dirPath, options)),
    stat: async (targetPath: string) =>
      wrapSerializedStats(await fsBridge.stat(targetPath)),
    lstat: async (targetPath: string) =>
      wrapSerializedStats(await fsBridge.lstat(targetPath)),
    access: (targetPath: string, mode?: number) =>
      fsBridge.access(targetPath, mode),
    exists: (targetPath: string) => fsBridge.exists(targetPath),
    unlink: (targetPath: string) => fsBridge.unlink(targetPath),
    remove: (targetPath: string) => fsBridge.remove(targetPath),
    emptyDir: (dirPath: string) => fsBridge.emptyDir(dirPath),
  };

  return {
    constants: { F_OK: 0, R_OK: 4, W_OK: 2, X_OK: 1 },
    promises,
    readFile: (filePath: string, optionsOrCb: any, maybeCb?: Function) => {
      const cb = typeof optionsOrCb === 'function' ? optionsOrCb : maybeCb;
      const options =
        typeof optionsOrCb === 'function' ? undefined : optionsOrCb;
      return wrapCallbackPromise(promises.readFile(filePath, options), cb);
    },
    writeFile: (
      filePath: string,
      data: any,
      optionsOrCb: any,
      maybeCb?: Function
    ) => {
      const cb = typeof optionsOrCb === 'function' ? optionsOrCb : maybeCb;
      const options =
        typeof optionsOrCb === 'function' ? undefined : optionsOrCb;
      return wrapCallbackPromise(
        promises.writeFile(filePath, data, options),
        cb
      );
    },
    outputFile: (
      filePath: string,
      data: any,
      optionsOrCb: any,
      maybeCb?: Function
    ): Promise<void> => {
      const cb = typeof optionsOrCb === 'function' ? optionsOrCb : maybeCb;
      const options =
        typeof optionsOrCb === 'function' ? undefined : optionsOrCb;
      const promise = promises.outputFile(filePath, data, options);
      if (typeof cb === 'function') {
        promise.then(() => cb(null), err => cb(err));
      }
      return promise;
    },
    copyFile: (src: string, dest: string, cb?: Function) => {
      return wrapCallbackPromise(promises.copyFile(src, dest), cb);
    },
    ensureDir: (dirPath: string, cb?: Function): Promise<void> => {
      const promise = promises.ensureDir(dirPath);
      if (typeof cb === 'function') {
        promise.then(() => cb(null), err => cb(err));
      }
      return promise;
    },
    mkdir: (dirPath: string, optionsOrCb: any, maybeCb?: Function) => {
      const cb = typeof optionsOrCb === 'function' ? optionsOrCb : maybeCb;
      const options =
        typeof optionsOrCb === 'function' ? undefined : optionsOrCb;
      return wrapCallbackPromise(promises.mkdir(dirPath, options), cb);
    },
    readdir: (dirPath: string, optionsOrCb: any, maybeCb?: Function) => {
      const cb = typeof optionsOrCb === 'function' ? optionsOrCb : maybeCb;
      const options =
        typeof optionsOrCb === 'function' ? undefined : optionsOrCb;
      return wrapCallbackPromise(promises.readdir(dirPath, options), cb);
    },
    stat: (targetPath: string, cb?: Function) => {
      return wrapCallbackPromise(promises.stat(targetPath), cb);
    },
    lstat: (targetPath: string, cb?: Function) => {
      return wrapCallbackPromise(promises.lstat(targetPath), cb);
    },
    access: (targetPath: string, modeOrCb: any, maybeCb?: Function) => {
      const cb = typeof modeOrCb === 'function' ? modeOrCb : maybeCb;
      const mode = typeof modeOrCb === 'function' ? undefined : modeOrCb;
      return wrapCallbackPromise(promises.access(targetPath, mode), cb);
    },
    readFileSync: (filePath: string, options?: any) =>
      wrapBinaryResult(fsBridge.readFileSync(filePath, options)),
    writeFileSync: (filePath: string, data: any, options?: any) =>
      fsBridge.writeFileSync(filePath, data, options),
    outputFileSync: (filePath: string, data: any, options?: any) =>
      fsBridge.outputFileSync(filePath, data, options),
    copyFileSync: (src: string, dest: string) =>
      fsBridge.copyFileSync(src, dest),
    copySync: (src: string, dest: string, options?: any) =>
      fsBridge.copySync(src, dest, options),
    mkdirSync: (dirPath: string, options?: any) =>
      fsBridge.mkdirSync(dirPath, options),
    mkdirsSync: (dirPath: string, options?: any) =>
      fsBridge.mkdirsSync(dirPath, options),
    ensureDirSync: (dirPath: string) => fsBridge.ensureDirSync(dirPath),
    emptyDirSync: (dirPath: string) => fsBridge.emptyDirSync(dirPath),
    removeSync: (targetPath: string) => fsBridge.removeSync(targetPath),
    unlinkSync: (targetPath: string) => fsBridge.unlinkSync(targetPath),
    readdirSync: (dirPath: string, options?: any) =>
      wrapReaddirResult(fsBridge.readdirSync(dirPath, options)),
    statSync: (targetPath: string) =>
      wrapSerializedStats(fsBridge.statSync(targetPath)),
    lstatSync: (targetPath: string) =>
      wrapSerializedStats(fsBridge.lstatSync(targetPath)),
    accessSync: (targetPath: string, mode?: number) =>
      fsBridge.accessSync(targetPath, mode),
    existsSync: (targetPath: string) => fsBridge.existsSync(targetPath),
    realpathSync: (targetPath: string) => fsBridge.realpathSync(targetPath),
  };
};

const cachedInitialNodeModules = {
  electron: optionalRequire('electron'),
  fs: optionalRequire('fs'),
  fsExtra: optionalRequire('fs-extra'),
  path: optionalRequire('path'),
  os: optionalRequire('os'),
  process: optionalRequire('process'),
};

const safeOptionalRequire = (
  moduleName: string,
  cacheKey: $Keys<typeof cachedInitialNodeModules>
): ?any => {
  const loadedModule = optionalRequire(moduleName);
  // Jest's resetMocks: true clears jest.fn() mocks (like __mocks__/OptionalRequire.js)
  // between tests so calls during tests return undefined instead of the mock module,
  // whereas real Browser/Node OptionalRequire always returns a module or null.
  if (loadedModule !== undefined) return loadedModule;
  return cachedInitialNodeModules[cacheKey];
};

const getNodeElectron = () => safeOptionalRequire('electron', 'electron');
const getNodeFs = (): ?any => {
  const fs = safeOptionalRequire('fs', 'fs');
  const fsExtra = safeOptionalRequire('fs-extra', 'fsExtra');
  if (fs && fsExtra && fs !== fsExtra) {
    return {
      ...fs,
      ...fsExtra,
      promises: fsExtra.promises || fs.promises,
    };
  }
  return fsExtra || fs;
};
const getNodePath = (): ?any => safeOptionalRequire('path', 'path');
const getNodeOs = (): ?any => safeOptionalRequire('os', 'os');
const getNodeProcess = (): ?any => safeOptionalRequire('process', 'process');
const lazyNodeArchiver = optionalLazyRequire('archiver');
const lazyNodeGlob = optionalLazyRequire('glob');

export const isDesktop = (): boolean => {
  if (getWindowDesktopApi()) return true;
  const electron = getNodeElectron();
  return Boolean(electron);
};

export const isDev = (): boolean => {
  const bootstrap = getBootstrapData();
  if (bootstrap) return !!bootstrap.isDev;

  // $FlowFixMe[cannot-resolve-name]
  const isDevFromEnv =
    // $FlowFixMe[cannot-resolve-name]
    typeof process !== 'undefined' &&
    // $FlowFixMe[cannot-resolve-name]
    process.env &&
    // $FlowFixMe[cannot-resolve-name]
    (!process.env.NODE_ENV ||
      // $FlowFixMe[cannot-resolve-name]
      process.env.NODE_ENV === 'development');
  if (isDevFromEnv || isReactAppEnvDevelopment()) return true;

  return false;
};

export const getWindowId = (): number => {
  const bootstrap = getBootstrapData();
  return bootstrap && typeof bootstrap.windowId === 'number'
    ? bootstrap.windowId
    : 0;
};

export const getPlatform = (): string => {
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.platform) return bootstrap.platform;
  const nodeProcess = getNodeProcess();
  return nodeProcess && nodeProcess.platform ? nodeProcess.platform : '';
};

export const getArch = (): string => {
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.arch) return bootstrap.arch;
  const nodeProcess = getNodeProcess();
  return nodeProcess && nodeProcess.arch
    ? nodeProcess.arch
    : 'Unknown architecture';
};

export const getSystemVersion = (): string => {
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.systemVersion) return bootstrap.systemVersion;
  const nodeProcess = getNodeProcess();
  return nodeProcess && nodeProcess.getSystemVersion
    ? nodeProcess.getSystemVersion() || 'Unknown system version'
    : 'Unknown system version';
};

export const getPid = (): number => {
  const bootstrap = getBootstrapData();
  if (bootstrap && typeof bootstrap.pid === 'number') return bootstrap.pid;
  const nodeProcess = getNodeProcess();
  return nodeProcess && typeof nodeProcess.pid === 'number'
    ? nodeProcess.pid
    : 0;
};

export const getCwd = (): string => {
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.cwd) return bootstrap.cwd;
  const nodeProcess = getNodeProcess();
  return nodeProcess && typeof nodeProcess.cwd === 'function'
    ? nodeProcess.cwd()
    : '/';
};

export const getAppPath = (): string => {
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.appPath) return bootstrap.appPath;
  return getCwd();
};

export const getAppPathSync = (name: string): string => {
  const api = getWindowDesktopApi();
  if (api) {
    const bootstrap = getBootstrapData();
    if (
      bootstrap &&
      bootstrap.paths &&
      Object.keys(bootstrap.paths).indexOf(name) !== -1 &&
      typeof bootstrap.paths[name] === 'string'
    ) {
      return bootstrap.paths[name];
    }
    try {
      return api.app.getPathSync(name);
    } catch (err) {
      return '';
    }
  }
  return '';
};

export const getAppPathAsync = async (name: string): Promise<?string> => {
  const api = getWindowDesktopApi();
  if (api) {
    return api.app.getPath(name);
  }
  return null;
};

export const getGPUInfo = async (
  infoType: 'basic' | 'complete' = 'complete'
): Promise<any> => {
  const api = getWindowDesktopApi();
  if (api) {
    return api.app.getGPUInfo(infoType);
  }
  return null;
};

export const getArguments = (): Object => {
  const api = getWindowDesktopApi();
  if (api && api.app && typeof api.app.getArgumentsSync === 'function') {
    return api.app.getArgumentsSync() || {};
  }
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.args) return bootstrap.args;
  return {};
};

export const getCliLoginEnvironment = (): { [string]: ?string } => {
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.cliLoginEnv) return bootstrap.cliLoginEnv;
  const nodeProcess = getNodeProcess();
  return (nodeProcess && nodeProcess.env) || {};
};

export const getUserInfo = (): ?{| uid: number, username: string |} => {
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.userInfo) return bootstrap.userInfo;
  const nodeOs = getNodeOs();
  if (!nodeOs || typeof nodeOs.userInfo !== 'function') return null;
  try {
    return nodeOs.userInfo();
  } catch (err) {
    return null;
  }
};

export const getTmpDir = (): string => {
  const bootstrap = getBootstrapData();
  if (bootstrap && bootstrap.paths && bootstrap.paths.temp) {
    return bootstrap.paths.temp;
  }
  const nodeOs = getNodeOs();
  if (nodeOs && typeof nodeOs.tmpdir === 'function') return nodeOs.tmpdir();
  return '/tmp';
};

export const getPath = (): ?DesktopPathInterface => {
  const api = getWindowDesktopApi();
  if (api) {
    const platform = getPlatform() || 'posix';
    if (!cachedBridgePath || cachedBridgePlatform !== platform) {
      cachedBridgePlatform = platform;
      cachedBridgePath = createDesktopPath({
        platform,
        getCwd,
      });
    }
    return cachedBridgePath;
  }
  return getNodePath();
};

export const requestFileAccess = async (
  targetPath: string,
  options: {| write?: boolean, directory?: boolean |} = {}
): Promise<void> => {
  const api = getWindowDesktopApi();
  if (api && api.requestFileAccess)
    await api.requestFileAccess(targetPath, options);
};

export const requestProjectAccess = async (
  projectPath: string
): Promise<void> => {
  const api = getWindowDesktopApi();
  if (api && api.requestProjectAccess)
    await api.requestProjectAccess(projectPath);
};

export const getFs = (): ?DesktopFsInterface => {
  const api = getWindowDesktopApi();
  if (api) {
    if (!cachedBridgeFs) {
      cachedBridgeFs = createBridgeFs(api);
    }
    return cachedBridgeFs;
  }
  return getNodeFs();
};

const encodeSegmentsForLocalFileUrl = (
  segments: Array<string>,
  preserveLeadingDriveLetter: boolean
): string => {
  return segments
    .map((segment, index) => {
      if (
        preserveLeadingDriveLetter &&
        index === 0 &&
        /^[A-Za-z]:$/.test(segment)
      ) {
        return segment;
      }
      return encodeURIComponent(segment);
    })
    .join('/');
};

/**
 * Convert a local OS path or `file://` URL into a `gdevelop-file://local/...`
 * URL served securely by Electron main process with `webSecurity: true`.
 */
export const getLocalFileUrl = (filePath: string): string => {
  if (!filePath) return filePath;
  if (/^(gdevelop-file|http|https|data|blob|gdide):/i.test(filePath)) {
    return filePath;
  }

  let targetPath = filePath;
  let urlSuffix = '';

  if (/^file:/i.test(filePath)) {
    try {
      const parsed = new URL(filePath);
      if (parsed.protocol === 'file:') {
        urlSuffix = `${parsed.search || ''}${parsed.hash || ''}`;
        const decodedPathname = decodeURIComponent(parsed.pathname || '');
        if (parsed.hostname && parsed.hostname.toLowerCase() !== 'localhost') {
          // RFC 8089 UNC file:// URL (`file://server/share/file.png`)
          targetPath = `//${parsed.hostname}${decodedPathname}`;
        } else {
          targetPath = decodedPathname;
        }
      }
    } catch (e) {
      // Fall back to stripping `file://` prefix if URL parsing failed.
      targetPath = filePath.replace(/^file:\/{2,3}/i, '/');
    }
  }

  const normalizedSlashes = targetPath.replace(/\\/g, '/');

  // Preserve Windows UNC prefix `//server/share/...` explicitly.
  if (/^\/\/[^/]/.test(normalizedSlashes)) {
    const uncSegments = normalizedSlashes.slice(2).split('/');
    const encodedUnc = encodeSegmentsForLocalFileUrl(uncSegments, false);
    return `gdevelop-file://local//${encodedUnc}${urlSuffix}`;
  }

  const trimmedLeading = normalizedSlashes.replace(/^\/+/, '');
  const segments = trimmedLeading.split('/');
  const encodedPath = encodeSegmentsForLocalFileUrl(segments, true);
  return `gdevelop-file://local/${encodedPath}${urlSuffix}`;
};

export const archiveFolder = async ({
  folderPath,
  outputFilename,
  sizeLimit,
}: {|
  folderPath: string,
  outputFilename: string,
  sizeLimit?: number,
|}): Promise<string> => {
  const api = getWindowDesktopApi();
  if (api) {
    await requestFileAccess(outputFilename, { write: true });
    return api.fs.archiveFolder({ folderPath, outputFilename, sizeLimit });
  }
  const archiver = lazyNodeArchiver();
  const fs = getNodeFs();
  if (!archiver || !fs) {
    throw new Error('Archive creation is not supported in this environment.');
  }
  return new Promise((resolve, reject) => {
    const output = fs.createWriteStream(outputFilename);
    const archive = archiver('zip', {
      zlib: { level: 9 },
    });
    output.on('close', () => {
      const fileSize = archive.pointer();
      if (sizeLimit && fileSize > sizeLimit) {
        const roundFileSizeInMb = Math.round(fileSize / (1000 * 1000));
        reject(
          new Error(
            `Archive is of size ${roundFileSizeInMb} MB, which is above the limit allowed of ${sizeLimit /
              (1000 * 1000)} MB.`
          )
        );
        return;
      }
      resolve(outputFilename);
    });
    output.on('error', err => reject(err));
    archive.on('error', err => reject(err));
    archive.pipe(output);
    archive.directory(folderPath, false);
    archive.finalize();
  });
};

export const globFiles = async ({
  baseFolder,
  extensions,
}: {|
  baseFolder: string,
  extensions: Array<string>,
|}): Promise<?Array<string>> => {
  const api = getWindowDesktopApi();
  if (api) {
    return api.fs.glob({ baseFolder, extensions });
  }
  const glob = lazyNodeGlob();
  if (!glob) return null;
  const allExtensions = [
    ...extensions,
    ...extensions.map(extension => extension.toUpperCase()),
  ];
  return new Promise((resolve, reject) => {
    glob(
      baseFolder + '/**/*.{' + allExtensions.join(',') + '}',
      (error, files) => {
        if (error) reject(error);
        else resolve(files);
      }
    );
  });
};

// Window & App controls
export const quitApp = () => {
  const api = getWindowDesktopApi();
  if (api) safelyIgnorePromise(api.app.quit(), 'app.quit');
};

export const exitApp = (exitCode?: number) => {
  const api = getWindowDesktopApi();
  if (api) {
    api.app.exit(exitCode);
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    electron.ipcRenderer.send('app-exit', exitCode);
  }
};

export const setWindowProjectPath = (filePath: ?string) => {
  const api = getWindowDesktopApi();
  if (api) {
    api.app.setWindowProjectPath(filePath);
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    electron.ipcRenderer.send('set-window-project-path', filePath);
  }
};

export const setWindowTitle = (title: string) => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(api.window.setTitle(title), 'window.setTitle');
    return;
  }
  if (typeof document !== 'undefined') document.title = title;
};

export const setWindowBounds = (
  x: number,
  y: number,
  width: number,
  height: number
) => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(
      api.window.setBounds({ x, y, width, height }),
      'window.setBounds'
    );
  }
};

export const showWindow = () => {
  const api = getWindowDesktopApi();
  if (api) safelyIgnorePromise(api.window.show(), 'window.show');
};

export const hideWindow = (forceHide?: boolean) => {
  const api = getWindowDesktopApi();
  if (api) safelyIgnorePromise(api.window.hide(!!forceHide), 'window.hide');
};

export const focusWindow = () => {
  const api = getWindowDesktopApi();
  if (api) safelyIgnorePromise(api.window.focus(), 'window.focus');
};

export const closeWindow = () => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(api.window.close(), 'window.close');
    return;
  }
  if (typeof window !== 'undefined' && typeof window.close === 'function') {
    window.close();
  }
};

export const isWindowFullScreen = (): boolean => {
  const api = getWindowDesktopApi();
  if (api) return !!api.window.isFullScreenSync();
  return false;
};

export const setWindowFullScreen = (fullScreen: boolean) => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(
      api.window.setFullScreen(fullScreen),
      'window.setFullScreen'
    );
  }
};

export const toggleWindowMaximize = () => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(api.window.toggleMaximize(), 'window.toggleMaximize');
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    safelyIgnorePromise(
      electron.ipcRenderer.invoke('window-maximize-toggle'),
      'window-maximize-toggle'
    );
  }
};

export const setTitlebarOverlayOptions = (options: {|
  color: string,
  symbolColor: string,
  targetId?: ?string,
|}) => {
  const overlayOptions = {
    color: options.color,
    symbolColor: options.symbolColor,
  };
  const api = getWindowDesktopApi();
  if (api) {
    if (options.targetId !== undefined) {
      safelyIgnorePromise(
        api.window.setTitlebarOverlayOptions(overlayOptions, options.targetId),
        'window.setTitlebarOverlayOptions'
      );
    } else {
      safelyIgnorePromise(
        api.window.setTitlebarOverlayOptions(overlayOptions),
        'window.setTitlebarOverlayOptions'
      );
    }
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    if (options.targetId !== undefined) {
      safelyIgnorePromise(
        electron.ipcRenderer.invoke(
          'titlebar-set-overlay-options',
          overlayOptions,
          options.targetId
        ),
        'titlebar-set-overlay-options'
      );
    } else {
      safelyIgnorePromise(
        electron.ipcRenderer.invoke(
          'titlebar-set-overlay-options',
          overlayOptions
        ),
        'titlebar-set-overlay-options'
      );
    }
  }
};

// A packaged desktop editor has a custom origin. Its public catalog reads
// use the native client, while browser and development clients use HTTP.
export type PublicCatalogName =
  | 'courses'
  | 'listedCourses'
  | 'listedChapters'
  | 'tutorials'
  | 'inAppTutorials'
  | 'examples'
  | 'bundles'
  | 'templates'
  | 'credits'
  | 'assetPacks'
  | 'givenAwayProducts'
  | 'releases'
  | 'showcasedGames'
  | 'gameCategories'
  | 'marketingPlans'
  | 'recommendations'
  | 'achievements'
  | 'announcements'
  | 'promotions'
  | 'extension'
  | 'behavior'
  | 'object'
  | 'assets'
  | 'stagingAssets'
  | 'resources'
  | 'stagingResources'
  | 'authors'
  | 'stagingAuthors'
  | 'licenses'
  | 'stagingLicenses'
  | 'assetLicenses'
  | 'templateLicenses'
  | 'subscriptionPlans'
  | 'subscriptionPlansWithLegacy'
  | 'pricingSystems'
  | 'pricingSystemsWithLegacy'
  | 'gameCommentQualityRatingsLeaderboards'
  | 'userCommentQualityRatingsLeaderboards'
  | 'aiSettings'
  | 'stagingAiSettings';

export const readPublicCatalog = async <T>(
  name: PublicCatalogName,
  readHttp: () => Promise<T>
): Promise<T> => {
  const api = getWindowDesktopApi();
  if (
    api &&
    typeof api.readPublicCatalog === 'function' &&
    typeof window !== 'undefined' &&
    window.location &&
    window.location.protocol === 'gdide:'
  ) {
    return api.readPublicCatalog(name);
  }
  return readHttp();
};

// Dialogs
export const pickProjectLocation = async (
  kind: 'file' | 'folder',
  defaultPath?: string
): Promise<?string> => {
  const api = getWindowDesktopApi();
  return api &&
    api.dialog &&
    typeof api.dialog.pickProjectLocation === 'function'
    ? api.dialog.pickProjectLocation(kind, defaultPath)
    : null;
};

export const showOpenDialog = async (options: Object): Promise<?Object> => {
  const api = getWindowDesktopApi();
  if (api) return api.dialog.showOpenDialog(options);
  return null;
};

export const showSaveDialog = async (options: Object): Promise<?Object> => {
  const api = getWindowDesktopApi();
  if (api) return api.dialog.showSaveDialog(options);
  return null;
};

export const showSaveDialogSync = (options: Object): ?string => {
  const api = getWindowDesktopApi();
  if (api) return api.dialog.showSaveDialogSync(options);
  return undefined;
};

export const showMessageBoxSync = (options: Object): number => {
  const api = getWindowDesktopApi();
  if (api) return api.dialog.showMessageBoxSync(options);
  return 0;
};

// Shell
export const openExternalURL = (url: string) => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(api.shell.openExternal(url), 'shell.openExternal');
    return;
  }
  if (typeof window !== 'undefined' && typeof window.open === 'function') {
    window.open(url, '_blank');
  }
};

export const openPath = (targetPath: string) => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(api.shell.openPath(targetPath), 'shell.openPath');
  }
};

export const showItemInFolder = (targetPath: string) => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(
      api.shell.showItemInFolder(targetPath),
      'shell.showItemInFolder'
    );
  }
};

// Clipboard
export const readClipboardText = (): string => {
  const api = getWindowDesktopApi();
  if (api) return api.clipboard.readText() || '';
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    return electron.ipcRenderer.sendSync('clipboard-read-text') || '';
  }
  return '';
};

export const writeClipboardText = (text: string) => {
  const api = getWindowDesktopApi();
  if (api) {
    api.clipboard.writeText(text);
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    electron.ipcRenderer.sendSync('clipboard-write-text', text);
  }
};

// Menus
export const setMainMenu = (template: Array<Object>) => {
  const api = getWindowDesktopApi();
  if (api) {
    api.menu.setMainMenu(template);
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    electron.ipcRenderer.send('set-main-menu', template);
  }
};

export const showEditContextMenu = (targetId?: ?string) => {
  const api = getWindowDesktopApi();
  if (api) {
    safelyIgnorePromise(
      targetId !== undefined
        ? api.menu.showEditContextMenu(targetId)
        : api.menu.showEditContextMenu(),
      'menu.showEditContextMenu'
    );
  }
};

const serializePopupMenuTemplate = (
  items: Array<Object>,
  actionHandlers: Map<string, () => void>,
  nextIdRef: {| value: number |}
): Array<Object> => {
  return items.map(item => {
    const serialized: Object = {};
    if (typeof item.label === 'string') serialized.label = item.label;
    if (typeof item.sublabel === 'string') serialized.sublabel = item.sublabel;
    if (typeof item.type === 'string') serialized.type = item.type;
    if (typeof item.role === 'string') serialized.role = item.role;
    if (typeof item.accelerator === 'string') {
      serialized.accelerator = item.accelerator;
    }
    if (typeof item.enabled === 'boolean') serialized.enabled = item.enabled;
    if (typeof item.visible === 'boolean') serialized.visible = item.visible;
    if (typeof item.checked === 'boolean') serialized.checked = item.checked;
    if (typeof item.click === 'function') {
      const actionId = `menu-action-${nextIdRef.value++}`;
      actionHandlers.set(actionId, item.click);
      serialized.actionId = actionId;
    }
    if (Array.isArray(item.submenu)) {
      serialized.submenu = serializePopupMenuTemplate(
        item.submenu,
        actionHandlers,
        nextIdRef
      );
    }
    return serialized;
  });
};

export const popupMenu = async (
  template: Array<Object>,
  dimensions: {| left: number, top: number, width: number, height: number |},
  targetId?: ?string
) => {
  const api = getWindowDesktopApi();
  if (!api) return;
  const actionHandlers = new Map<string, () => void>();
  const sanitized = serializePopupMenuTemplate(template, actionHandlers, {
    value: 0,
  });
  const result = await api.menu.popupMenu({
    template: sanitized,
    x: Math.round(dimensions.left),
    y: Math.round(dimensions.top + dimensions.height),
    ...(targetId ? { targetId } : {}),
  });
  const clickedActionId = result && result.clickedActionId;
  if (clickedActionId) {
    const handler = actionHandlers.get(clickedActionId);
    if (handler) handler();
  }
};

// Events + Generic Electron IPC fallbacks for Node/Jest mocks
export const onIpcEvent = (
  channel: string,
  callback: (...args: Array<any>) => any
): (() => void) => {
  const api = getWindowDesktopApi();
  if (api) {
    return api.on(channel, callback);
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    const wrapped = (_event: any, ...args: Array<any>) => callback(...args);
    electron.ipcRenderer.on(channel, wrapped);
    return () => {
      if (typeof electron.ipcRenderer.removeListener === 'function') {
        electron.ipcRenderer.removeListener(channel, wrapped);
      }
    };
  }
  return () => {};
};

export const removeAllIpcListeners = (channel: string) => {
  const api = getWindowDesktopApi();
  if (api) {
    api.removeAllListeners(channel);
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    electron.ipcRenderer.removeAllListeners(channel);
  }
};

// Domain bridges (with clean fallbacks to Jest-mocked ipcRenderer when running specs)
export const preview = {
  open: (options: Object): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) return api.preview.open(options);
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('preview-open', options)
      : Promise.reject(new Error('Desktop preview is not supported.'));
  },
  close: (options: Object): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) return api.preview.close(options);
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('preview-close', options)
      : Promise.resolve();
  },
  closeAll: (): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) return api.preview.closeAll();
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('preview-close-all')
      : Promise.resolve();
  },
};

export const externalEditor = {
  open: (
    channel: 'piskel-load' | 'jfxr-load' | 'yarn-load',
    input: Object
  ): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) {
      if (channel === 'piskel-load')
        return api.externalEditor.openPiskel(input);
      if (channel === 'jfxr-load') return api.externalEditor.openJfxr(input);
      if (channel === 'yarn-load') return api.externalEditor.openYarn(input);
    }
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke(channel, input)
      : Promise.resolve(null);
  },
};

export const fileTransfer = {
  downloadLocalFile: async (url: string, outputPath: string): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) await requestFileAccess(outputPath, { write: true });
    if (api) return api.fileTransfer.downloadLocalFile(url, outputPath);
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('local-file-download', url, outputPath)
      : Promise.reject(new Error('Local file download not available.'));
  },
  saveLocalFileFromArrayBuffer: async (
    arrayBuffer: ArrayBuffer,
    outputPath: string
  ): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) {
      await requestFileAccess(outputPath, { write: true });
      return api.fileTransfer.saveLocalFileFromArrayBuffer(
        arrayBuffer,
        outputPath
      );
    }
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke(
          'local-file-save-from-arraybuffer',
          arrayBuffer,
          outputPath
        )
      : Promise.reject(new Error('Local file save not available.'));
  },
  uploadLocalFile: (localFilePath: string, uploadOptions: Object) => {
    const api = getWindowDesktopApi();
    if (api) {
      api.fileTransfer.uploadLocalFile(localFilePath, uploadOptions);
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send(
        'local-file-upload',
        localFilePath,
        uploadOptions
      );
    }
  },
};

export const fsWatcher = {
  setup: (
    folderPath: string,
    serializedOptions: string | Object
  ): Promise<?string> => {
    const api = getWindowDesktopApi();
    if (api) return api.fsWatcher.setup(folderPath, serializedOptions);
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke(
          'local-filesystem-watcher-setup',
          folderPath,
          serializedOptions
        )
      : Promise.resolve(null);
  },
  disable: (id: string): Promise<void> => {
    const api = getWindowDesktopApi();
    if (api) return api.fsWatcher.disable(id);
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('local-filesystem-watcher-disable', id)
      : Promise.resolve();
  },
};

export const serveFolder = {
  start: (options: Object) => {
    const api = getWindowDesktopApi();
    if (api) {
      api.serveFolder.start(options);
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('serve-folder', options);
    }
  },
  stop: () => {
    const api = getWindowDesktopApi();
    if (api) {
      api.serveFolder.stop();
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('stop-server');
    }
  },
  getLocalNetworkIp: () => {
    const api = getWindowDesktopApi();
    if (api) {
      api.serveFolder.getLocalNetworkIp();
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('get-local-network-ip');
    }
  },
};

export const gdjsWatcher = {
  setup: () => {
    const api = getWindowDesktopApi();
    if (api) {
      api.gdjsWatcher.setup();
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('setup-local-gdjs-development-watcher');
    }
  },
  close: () => {
    const api = getWindowDesktopApi();
    if (api) {
      api.gdjsWatcher.close();
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('close-local-gdjs-development-watcher');
    }
  },
};

export const debuggerServer = {
  start: (options: Object) => {
    const api = getWindowDesktopApi();
    if (api) {
      api.debuggerServer.start(options);
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('debugger-start-server', options);
    }
  },
  sendMessage: (message: any) => {
    const api = getWindowDesktopApi();
    if (api) {
      api.debuggerServer.sendMessage(message);
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('debugger-send-message', message);
    }
  },
  closeAllConnections: () => {
    const api = getWindowDesktopApi();
    if (api) {
      api.debuggerServer.closeAllConnections();
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('debugger-close-all-connections');
    }
  },
};

export const updates = {
  checkAndDownload: (options?: Object) => {
    const api = getWindowDesktopApi();
    if (api) {
      api.updates.checkAndDownload(options);
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('updates-check-and-download', options);
    }
  },
  check: (options?: Object) => {
    const api = getWindowDesktopApi();
    if (api) {
      api.updates.check(options);
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('updates-check', options);
    }
  },
  installAndQuit: () => {
    const api = getWindowDesktopApi();
    if (api) {
      api.updates.installAndQuit();
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('updates-install-and-quit');
    }
  },
};

export const mcp = {
  ready: () => {
    const api = getWindowDesktopApi();
    if (api) {
      api.mcp.ready();
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('mcp-ready');
    }
  },
  sendCliResponse: (payload: Object) => {
    const api = getWindowDesktopApi();
    if (api) {
      api.mcp.sendCliResponse(payload);
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('mcp-send', payload);
    }
  },
  sendLiveResponse: (payload: Object) => {
    const api = getWindowDesktopApi();
    if (api) {
      api.mcp.sendLiveResponse(payload);
      return;
    }
    const electron = getNodeElectron();
    if (electron && electron.ipcRenderer) {
      electron.ipcRenderer.send('mcp-live-send', payload);
    }
  },
  getLiveServerStatus: (): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) return api.mcp.getLiveServerStatus();
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('mcp-live-server-get-status')
      : Promise.resolve(null);
  },
  setLiveServerEnabled: (enabled: boolean): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) return api.mcp.setLiveServerEnabled(enabled);
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('mcp-live-server-set-enabled', enabled)
      : Promise.resolve(null);
  },
  resetLiveServerToken: (): Promise<any> => {
    const api = getWindowDesktopApi();
    if (api) return api.mcp.resetLiveServerToken();
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('mcp-live-server-reset-token')
      : Promise.resolve(null);
  },
};

export const cli = {
  writeStdout: (text: string): Promise<void> => {
    const api = getWindowDesktopApi();
    if (api) return api.cli.writeStdout(text);
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('cli-write-stdout', text)
      : Promise.resolve();
  },
  readStdin: (): Promise<string> => {
    const api = getWindowDesktopApi();
    if (api) return api.cli.readStdin();
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('cli-read-stdin')
      : Promise.resolve('');
  },
  installInPath: (): Promise<boolean> => {
    const api = getWindowDesktopApi();
    if (api) return api.cli.installInPath();
    const electron = getNodeElectron();
    return electron && electron.ipcRenderer
      ? electron.ipcRenderer.invoke('install-cli-in-path')
      : Promise.resolve(false);
  },
};

export const updateDiscordRichPresence = (config: Object) => {
  const api = getWindowDesktopApi();
  if (api) {
    api.discord.updateRichPresence(config);
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    electron.ipcRenderer.send('update-discord-rich-presence', config);
  }
};

export const runNpmScript = (options: Object) => {
  const api = getWindowDesktopApi();
  if (api) {
    api.npmScript.run(options);
    return;
  }
  const electron = getNodeElectron();
  if (electron && electron.ipcRenderer) {
    electron.ipcRenderer.send('run-npm-script', options);
  }
};

const DesktopService = {
  requestFileAccess,
  requestProjectAccess,
  isDesktop,
  isDev,
  getWindowId,
  getPlatform,
  getArch,
  getSystemVersion,
  getPid,
  getCwd,
  getAppPath,
  getAppPathSync,
  getAppPathAsync,
  getGPUInfo,
  getArguments,
  getCliLoginEnvironment,
  getUserInfo,
  getTmpDir,
  getPath,
  getFs,
  getLocalFileUrl,
  archiveFolder,
  globFiles,
  quitApp,
  exitApp,
  setWindowProjectPath,
  setWindowTitle,
  setWindowBounds,
  showWindow,
  hideWindow,
  focusWindow,
  closeWindow,
  isWindowFullScreen,
  setWindowFullScreen,
  toggleWindowMaximize,
  setTitlebarOverlayOptions,
  readPublicCatalog,
  pickProjectLocation,
  showOpenDialog,
  showSaveDialog,
  showSaveDialogSync,
  showMessageBoxSync,
  openExternalURL,
  openPath,
  showItemInFolder,
  readClipboardText,
  writeClipboardText,
  setMainMenu,
  showEditContextMenu,
  popupMenu,
  onIpcEvent,
  removeAllIpcListeners,
  preview,
  externalEditor,
  fileTransfer,
  fsWatcher,
  serveFolder,
  gdjsWatcher,
  debuggerServer,
  updates,
  mcp,
  cli,
  updateDiscordRichPresence,
  runNpmScript,
};

export default DesktopService;
