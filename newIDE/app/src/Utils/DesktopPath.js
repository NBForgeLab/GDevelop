// @flow
// Note: this file does not use export/imports and uses Flow comments to allow its usage from Node.js and TypeScript.

/*flow-include
export type ParsedPath = {|
  root: string,
  dir: string,
  base: string,
  ext: string,
  name: string,
|};

export type DesktopPathInterface = {|
  sep: string,
  delimiter: string,
  normalize: (p: string) => string,
  isAbsolute: (p: string) => boolean,
  join: (...paths: Array<string>) => string,
  resolve: (...paths: Array<string>) => string,
  relative: (from: string, to: string) => string,
  dirname: (p: string) => string,
  basename: (p: string, ext?: string) => string,
  extname: (p: string) => string,
  parse: (p: string) => ParsedPath,
  format: (pathObject: {|
    +root?: string,
    +dir?: string,
    +base?: string,
    +ext?: string,
    +name?: string,
  |}) => string,
  posix: any,
  win32: any,
|};
*/

const normalizeArray = (
  parts /*: Array<string> */,
  allowAboveRoot /*: boolean */
) /*: Array<string> */ => {
  const res = [];
  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    if (!p || p === '.') continue;
    if (p === '..') {
      if (res.length > 0 && res[res.length - 1] !== '..') {
        res.pop();
      } else if (allowAboveRoot) {
        res.push('..');
      }
    } else {
      res.push(p);
    }
  }
  return res;
};

const createPosixPath = (
  getCwd /*: () => string */
) /*: DesktopPathInterface */ => {
  const api /*: any */ = {
    sep: '/',
    delimiter: ':',
    isAbsolute: (p /*: string */) /*: boolean */ =>
      typeof p === 'string' && p.startsWith('/'),
    normalize: (p /*: string */) /*: string */ => {
      if (typeof p !== 'string' || p.length === 0) return '.';
      const isAbs = p.startsWith('/');
      const trailingSlash = p.endsWith('/');
      const normalized = normalizeArray(p.split('/'), !isAbs).join('/');
      if (!normalized && !isAbs) return '.';
      const prefix = isAbs ? '/' : '';
      const suffix =
        trailingSlash && normalized && normalized !== '/' ? '/' : '';
      return prefix + normalized + suffix;
    },
    join: (...paths /*: Array<string> */) /*: string */ => {
      const nonEmpty = paths.filter(p => typeof p === 'string' && p.length > 0);
      if (nonEmpty.length === 0) return '.';
      return api.normalize(nonEmpty.join('/'));
    },
    resolve: (...paths /*: Array<string> */) /*: string */ => {
      let resolvedPath = '';
      let resolvedAbsolute = false;
      for (let i = paths.length - 1; i >= -1 && !resolvedAbsolute; i--) {
        const p = i >= 0 ? paths[i] : getCwd() || '/';
        if (typeof p !== 'string' || p.length === 0) continue;
        resolvedPath = p + '/' + resolvedPath;
        resolvedAbsolute = p.startsWith('/');
      }
      const normalized = normalizeArray(
        resolvedPath.split('/'),
        !resolvedAbsolute
      ).join('/');
      return (resolvedAbsolute ? '/' : '') + normalized || '.';
    },
    relative: (from /*: string */, to /*: string */) /*: string */ => {
      const resolvedFrom = api.resolve(from);
      const resolvedTo = api.resolve(to);
      if (resolvedFrom === resolvedTo) return '';
      const fromParts = resolvedFrom.split('/').filter(Boolean);
      const toParts = resolvedTo.split('/').filter(Boolean);
      const length = Math.min(fromParts.length, toParts.length);
      let samePartsLength = 0;
      while (
        samePartsLength < length &&
        fromParts[samePartsLength] === toParts[samePartsLength]
      ) {
        samePartsLength++;
      }
      const outputParts = [];
      for (let i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }
      return outputParts.concat(toParts.slice(samePartsLength)).join('/');
    },
    dirname: (p /*: string */) /*: string */ => {
      if (typeof p !== 'string' || p.length === 0) return '.';
      const hasRoot = p.charCodeAt(0) === 47;
      let end = -1;
      let matchedSlash = true;
      for (let i = p.length - 1; i >= 1; i--) {
        if (p.charCodeAt(i) === 47) {
          if (!matchedSlash) {
            end = i;
            break;
          }
        } else {
          matchedSlash = false;
        }
      }
      if (end === -1) return hasRoot ? '/' : '.';
      if (hasRoot && end === 1) return '//';
      return p.slice(0, end);
    },
    basename: (p /*: string */, ext /*:: ?: string */) /*: string */ => {
      if (typeof p !== 'string' || p.length === 0) return '';
      let end = p.length;
      while (end > 0 && p[end - 1] === '/') end--;
      if (end === 0) return '';
      const start = p.lastIndexOf('/', end - 1) + 1;
      let base = p.slice(start, end);
      if (ext && base.endsWith(ext) && base.length > ext.length) {
        base = base.slice(0, base.length - ext.length);
      } else if (ext && base === ext) {
        base = '';
      }
      return base;
    },
    extname: (p /*: string */) /*: string */ => {
      const base = api.basename(p);
      if (!base || base === '.' || base === '..') return '';
      const dotIndex = base.lastIndexOf('.');
      if (dotIndex <= 0) return '';
      return base.slice(dotIndex);
    },
    parse: (p /*: string */) /*: ParsedPath */ => {
      if (typeof p !== 'string' || p.length === 0) {
        return { root: '', dir: '', base: '', ext: '', name: '' };
      }
      const root = api.isAbsolute(p) ? '/' : '';
      const base = api.basename(p);
      const ext = api.extname(base);
      const name = ext ? base.slice(0, base.length - ext.length) : base;
      let end = p.length;
      while (end > 0 && p[end - 1] === '/') end--;
      let dir = '';
      if (end === 0) {
        dir = root;
      } else {
        const lastSlash = p.lastIndexOf('/', end - 1);
        if (lastSlash === 0) {
          dir = '/';
        } else if (lastSlash > 0) {
          dir = p.slice(0, lastSlash);
        }
      }
      return {
        root,
        dir,
        base,
        ext,
        name,
      };
    },
    format: (
      obj /*: {|
      +root?: string,
      +dir?: string,
      +base?: string,
      +ext?: string,
      +name?: string,
    |} */
    ) /*: string */ => {
      const dir = obj.dir || obj.root || '';
      const base = obj.base || `${obj.name || ''}${obj.ext || ''}`;
      if (!dir) return base;
      return dir === obj.root || dir === '/'
        ? `${dir}${base}`
        : `${dir}/${base}`;
    },
  };
  api.posix = api;
  api.win32 = null;
  return api;
};

const isWinSep = (ch /*: string */) /*: boolean */ => ch === '/' || ch === '\\';

const getWinRootEnd = (p /*: string */) /*: number */ => {
  const len = p.length;
  if (len === 0) return 0;
  if (isWinSep(p[0])) {
    if (len === 1 || !isWinSep(p[1])) return 1;
    if (len > 2 && !isWinSep(p[2])) {
      let i = 2;
      while (i < len && !isWinSep(p[i])) i++;
      if (i < len) {
        while (i < len && isWinSep(p[i])) i++;
        if (i < len) {
          while (i < len && !isWinSep(p[i])) i++;
          return i === len ? len : i + 1;
        }
      }
    }
    return 1;
  }
  if (/^[a-zA-Z]:/.test(p)) {
    return len > 2 && isWinSep(p[2]) ? 3 : 2;
  }
  return 0;
};

const splitWinRoot = (
  p /*: string */
) /*: {| root: string, rest: string, isUnc: boolean |} */ => {
  if (!p) return { root: '', rest: '', isUnc: false };
  if (isWinSep(p[0]) && isWinSep(p[1])) {
    const restParts = p.slice(2).split(/[\\/]+/);
    if (restParts.length >= 2 && restParts[0] && restParts[1]) {
      const uncRoot = `\\\\${restParts[0]}\\${restParts[1]}\\`;
      return {
        root: uncRoot,
        rest: restParts.slice(2).join('\\'),
        isUnc: true,
      };
    }
    return { root: '\\', rest: p.replace(/^[\\/]+/, ''), isUnc: false };
  }
  if (/^[a-zA-Z]:/.test(p)) {
    const hasSlash = p.length > 2 && isWinSep(p[2]);
    const root = p.slice(0, 2) + (hasSlash ? '\\' : '');
    const rest = p.slice(hasSlash ? 3 : 2);
    return { root, rest, isUnc: false };
  }
  if (isWinSep(p[0])) {
    return { root: '\\', rest: p.replace(/^[\\/]+/, ''), isUnc: false };
  }
  return { root: '', rest: p, isUnc: false };
};

const createWin32Path = (
  getCwd /*: () => string */,
  posixApi /*: DesktopPathInterface */
) /*: DesktopPathInterface */ => {
  const api /*: any */ = {
    sep: '\\',
    delimiter: ';',
    posix: posixApi,
    isAbsolute: (p /*: string */) /*: boolean */ => {
      if (typeof p !== 'string' || p.length === 0) return false;
      if (isWinSep(p[0])) return true;
      return /^[a-zA-Z]:[\\/]/.test(p);
    },
    normalize: (p /*: string */) /*: string */ => {
      if (typeof p !== 'string' || p.length === 0) return '.';
      const trailingSlash = isWinSep(p[p.length - 1]);
      const { root, rest } = splitWinRoot(p);
      const isAbs = Boolean(
        root && (root.endsWith('\\') || root.startsWith('\\'))
      );
      const parts = rest.split(/[\\/]+/);
      const normalized = normalizeArray(parts, !isAbs).join('\\');
      if (!normalized) {
        if (!root) return trailingSlash ? '.\\' : '.';
        if (/^[a-zA-Z]:$/.test(root)) {
          return root + (trailingSlash ? '.\\' : '.');
        }
        return root;
      }
      const suffix =
        trailingSlash && normalized && !normalized.endsWith('\\') ? '\\' : '';
      return root + normalized + suffix;
    },
    join: (...paths /*: Array<string> */) /*: string */ => {
      const nonEmpty = paths.filter(p => typeof p === 'string' && p.length > 0);
      if (nonEmpty.length === 0) return '.';
      return api.normalize(nonEmpty.join('\\'));
    },
    resolve: (...paths /*: Array<string> */) /*: string */ => {
      let resolvedDevice = '';
      let resolvedTail = '';
      let resolvedAbsolute = false;

      for (let i = paths.length - 1; i >= -1; i--) {
        let p = '';
        if (i >= 0) {
          p = paths[i];
        } else {
          const cwd = getCwd();
          if (!resolvedDevice) {
            p = cwd && splitWinRoot(cwd).root ? cwd : 'C:\\';
          } else {
            p =
              cwd &&
              cwd.slice(0, 2).toLowerCase() === resolvedDevice.toLowerCase()
                ? cwd
                : `${resolvedDevice}\\`;
          }
        }
        if (typeof p !== 'string' || p.length === 0) continue;

        const { root, rest, isUnc } = splitWinRoot(p);
        const device = isUnc
          ? root
          : root && /^[a-zA-Z]:/.test(root)
          ? root.slice(0, 2)
          : '';
        if (
          device &&
          resolvedDevice &&
          device.toLowerCase() !== resolvedDevice.toLowerCase()
        ) {
          continue;
        }
        if (!resolvedDevice && device) resolvedDevice = device;
        if (!resolvedAbsolute) {
          resolvedTail = rest + '\\' + resolvedTail;
          resolvedAbsolute = Boolean(
            isUnc || (root && (root.endsWith('\\') || root.startsWith('\\')))
          );
        }
        if (resolvedDevice && resolvedAbsolute) break;
      }

      const normalized = normalizeArray(
        resolvedTail.split(/[\\/]+/),
        !resolvedAbsolute
      ).join('\\');
      const rootPrefix = resolvedDevice
        ? resolvedDevice.endsWith('\\')
          ? resolvedDevice
          : `${resolvedDevice}\\`
        : resolvedAbsolute
        ? '\\'
        : '';
      return rootPrefix + normalized || '.';
    },
    relative: (from /*: string */, to /*: string */) /*: string */ => {
      const resolvedFrom = api.resolve(from);
      const resolvedTo = api.resolve(to);
      if (resolvedFrom.toLowerCase() === resolvedTo.toLowerCase()) return '';

      const fromSplit = splitWinRoot(resolvedFrom);
      const toSplit = splitWinRoot(resolvedTo);
      if (fromSplit.root.toLowerCase() !== toSplit.root.toLowerCase()) {
        return resolvedTo;
      }

      const fromParts = fromSplit.rest.split('\\').filter(Boolean);
      const toParts = toSplit.rest.split('\\').filter(Boolean);
      const length = Math.min(fromParts.length, toParts.length);
      let samePartsLength = 0;
      while (
        samePartsLength < length &&
        fromParts[samePartsLength].toLowerCase() ===
          toParts[samePartsLength].toLowerCase()
      ) {
        samePartsLength++;
      }
      const outputParts = [];
      for (let i = samePartsLength; i < fromParts.length; i++) {
        outputParts.push('..');
      }
      return outputParts.concat(toParts.slice(samePartsLength)).join('\\');
    },
    dirname: (p /*: string */) /*: string */ => {
      if (typeof p !== 'string' || p.length === 0) return '.';
      const rootEnd = getWinRootEnd(p);
      let end = p.length - 1;
      while (end >= rootEnd && isWinSep(p[end])) end--;
      if (end < rootEnd) {
        return rootEnd > 0 ? p.slice(0, rootEnd) : '.';
      }
      let slashIndex = -1;
      for (let i = end; i >= rootEnd; i--) {
        if (isWinSep(p[i])) {
          slashIndex = i;
          break;
        }
      }
      if (slashIndex === -1) {
        return rootEnd > 0 ? p.slice(0, rootEnd) : '.';
      }
      return p.slice(0, slashIndex);
    },
    basename: (p /*: string */, ext /*:: ?: string */) /*: string */ => {
      if (typeof p !== 'string' || p.length === 0) return '';
      let start = 0;
      let end = p.length;
      while (end > 0 && isWinSep(p[end - 1])) end--;
      if (end === 0) return '';
      if (end === 2 && /^[a-zA-Z]:$/.test(p.slice(0, 2))) return '';
      for (let i = end - 1; i >= 0; i--) {
        if (
          isWinSep(p[i]) ||
          (i === 1 && p[1] === ':' && /[a-zA-Z]/.test(p[0]))
        ) {
          start = i + 1;
          break;
        }
      }
      let base = p.slice(start, end);
      if (ext && base.endsWith(ext) && base.length > ext.length) {
        base = base.slice(0, base.length - ext.length);
      } else if (ext && base === ext) {
        base = '';
      }
      return base;
    },
    extname: (p /*: string */) /*: string */ => {
      const base = api.basename(p);
      if (!base || base === '.' || base === '..') return '';
      const dotIndex = base.lastIndexOf('.');
      if (dotIndex <= 0) return '';
      return base.slice(dotIndex);
    },
    parse: (p /*: string */) /*: ParsedPath */ => {
      if (typeof p !== 'string' || p.length === 0) {
        return { root: '', dir: '', base: '', ext: '', name: '' };
      }
      const rootEnd = getWinRootEnd(p);
      const root = p.slice(0, rootEnd);
      let end = p.length;
      while (end > rootEnd && isWinSep(p[end - 1])) end--;
      if (end <= rootEnd) {
        return { root, dir: root, base: '', ext: '', name: '' };
      }
      let lastSep = -1;
      for (let i = end - 1; i >= rootEnd; i--) {
        if (isWinSep(p[i])) {
          lastSep = i;
          break;
        }
      }
      const base =
        lastSep === -1 ? p.slice(rootEnd, end) : p.slice(lastSep + 1, end);
      const dir = lastSep === -1 ? root : p.slice(0, lastSep);
      const ext = api.extname(base);
      const name = ext ? base.slice(0, base.length - ext.length) : base;
      return {
        root,
        dir,
        base,
        ext,
        name,
      };
    },
    format: (
      obj /*: {|
      +root?: string,
      +dir?: string,
      +base?: string,
      +ext?: string,
      +name?: string,
    |} */
    ) /*: string */ => {
      const dir = obj.dir || obj.root || '';
      const base = obj.base || `${obj.name || ''}${obj.ext || ''}`;
      if (!dir) return base;
      return dir === obj.root || isWinSep(dir[dir.length - 1])
        ? `${dir}${base}`
        : `${dir}\\${base}`;
    },
  };
  api.win32 = api;
  return api;
};

const createDesktopPath = (
  { platform, getCwd } /*: {|
  platform: string,
  getCwd?: () => string,
|} */
) /*: DesktopPathInterface */ => {
  const cwdFn = getCwd || (() => '/');
  const posixPath = createPosixPath(cwdFn);
  const win32Path = createWin32Path(cwdFn, posixPath);
  posixPath.win32 = win32Path;
  if (platform === 'win32') {
    return win32Path;
  }
  return posixPath;
};

module.exports = {
  createDesktopPath,
};
