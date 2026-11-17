const { fetchProtocolAsset } = require('./FetchProtocolAsset');
const fs = require('fs');
const path = require('path');
const { URL, pathToFileURL } = require('url');

const GDEVELOP_FILE_SCHEME = 'gdevelop-file';
const GDEVELOP_FILE_HOST = 'local';

/**
 * Safely parse and validate a `gdevelop-file://local/...` URL into an
 * absolute local file path, or return `null` if the URL is invalid or unsafe.
 */
const hasUnsafePathSegments = rawPath => {
  if (typeof rawPath !== 'string') return true;
  if (rawPath.includes('\0') || /%00/i.test(rawPath)) return true;

  let decodedOnce;
  try {
    decodedOnce = decodeURIComponent(rawPath);
  } catch (e) {
    return true;
  }
  if (decodedOnce.includes('\0')) return true;

  // Normalize single- or multi-encoded dots and slashes (%2e, %2f, %5c, %252e...)
  // without corrupting valid filenames containing literal '%' (e.g. 100%25.png).
  const normalizedDotsAndSlashes = rawPath
    .replace(/%(?:25)*2e/gi, '.')
    .replace(/%(?:25)*(?:2f|5c)/gi, '/');

  const hasDotDotSegment = value =>
    value.split(/[\\/]/).some(segment => segment.trim() === '..');

  return (
    hasDotDotSegment(rawPath) ||
    hasDotDotSegment(decodedOnce) ||
    hasDotDotSegment(normalizedDotsAndSlashes)
  );
};

const resolveGdevelopFileUrlToLocalPath = (
  requestUrl,
  platform = process.platform
) => {
  if (typeof requestUrl !== 'string' || !requestUrl) return null;

  const schemeAuthorityMatch = /^[a-zA-Z][a-zA-Z0-9+.-]*:\/\/[^/?#]+([^?#]*)/.exec(
    requestUrl
  );
  if (schemeAuthorityMatch && hasUnsafePathSegments(schemeAuthorityMatch[1])) {
    return null;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(requestUrl);
  } catch (e) {
    return null;
  }

  if (parsedUrl.protocol !== `${GDEVELOP_FILE_SCHEME}:`) return null;
  if (parsedUrl.hostname !== GDEVELOP_FILE_HOST) return null;
  if (parsedUrl.port || parsedUrl.username || parsedUrl.password) return null;

  let decodedPathname;
  try {
    decodedPathname = decodeURIComponent(parsedUrl.pathname || '');
  } catch (e) {
    return null;
  }

  if (!decodedPathname || decodedPathname.includes('\0')) return null;

  // Reject explicit dot-dot traversal segments before normalization.
  const rawSegments = decodedPathname.split(/[\\/]/);
  if (rawSegments.some(segment => segment === '..')) {
    return null;
  }

  if (platform === 'win32') {
    // Support explicit UNC URLs (`gdevelop-file://local//server/share/...`),
    // which `isPathAllowed` strictly gates to pre-authorized UNC shares before any FS I/O.
    if (/^\/\/[^/]+\/[^/]+(?:\/|$)/.test(decodedPathname)) {
      return path.win32.resolve(decodedPathname.replace(/\//g, '\\'));
    }
    // Expect `/C:/...` -> `C:/...` (reject relative paths without drive letter).
    if (!/^\/[A-Za-z]:\//.test(decodedPathname)) return null;
    const windowsPath = decodedPathname.slice(1);
    return path.win32.resolve(windowsPath);
  }

  if (!decodedPathname.startsWith('/')) return null;
  return path.posix.resolve(decodedPathname);
};

const buildAllowedOrigins = options => {
  const isObjectOptions =
    options && typeof options === 'object' && !Array.isArray(options);
  const isDev = isObjectOptions ? !!options.isDev : false;
  const developmentServerBaseUrl = isObjectOptions
    ? options.developmentServerBaseUrl
    : typeof options === 'string'
    ? options
    : '';

  const origins = new Set([
    'gdide://app',
    'gdide://external',
    'gdevelop-file://local',
  ]);
  if (isDev) {
    origins.add('http://localhost:3000');
    if (developmentServerBaseUrl) {
      try {
        origins.add(new URL(developmentServerBaseUrl).origin);
      } catch (e) {}
    }
  }
  return origins;
};

const getCorsHeaders = (request, allowedOrigins) => {
  const requestOrigin =
    request &&
    request.headers &&
    typeof request.headers.get === 'function' &&
    request.headers.get('origin');
  const headers = {
    Vary: 'Origin',
    'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };
  if (requestOrigin && allowedOrigins.has(requestOrigin)) {
    headers['Access-Control-Allow-Origin'] = requestOrigin;
  }
  return headers;
};

const SENSITIVE_DIR_SEGMENTS = new Set([
  '.ssh',
  '.gnupg',
  '.gpg',
  '.aws',
  '.azure',
  '.kube',
  '.docker',
]);

const resolveCanonicalPathSync = (targetPath, platform = process.platform) => {
  if (typeof targetPath !== 'string' || !targetPath) return null;
  const pathImpl = platform === 'win32' ? path.win32 : path.posix;
  const resolved = pathImpl.resolve(targetPath);
  const realpathFn =
    fs.realpathSync && typeof fs.realpathSync.native === 'function'
      ? fs.realpathSync.native
      : fs.realpathSync;
  try {
    return realpathFn(resolved);
  } catch (error) {
    if (!error || (error.code !== 'ENOENT' && error.code !== 'ENOTDIR')) {
      return null;
    }
  }

  // File or leaf directory does not exist yet: canonicalize deepest existing ancestor.
  const trailingSegments = [];
  let cursor = resolved;
  while (true) {
    const parent = pathImpl.dirname(cursor);
    if (parent === cursor) {
      return null;
    }
    trailingSegments.unshift(pathImpl.basename(cursor));
    cursor = parent;
    try {
      const canonicalAncestor = realpathFn(cursor);
      return pathImpl.resolve(canonicalAncestor, ...trailingSegments);
    } catch (error) {
      if (!error || (error.code !== 'ENOENT' && error.code !== 'ENOTDIR')) {
        return null;
      }
    }
  }
};

const toCanonicalComparisonPath = (targetPath, platform = process.platform) => {
  if (typeof targetPath !== 'string' || !targetPath) return '';
  const pathImpl = platform === 'win32' ? path.win32 : path.posix;
  let normalized = pathImpl.normalize(targetPath);
  const parsedRoot = pathImpl.parse(normalized).root;
  if (normalized.length > parsedRoot.length && /[\\/]$/.test(normalized)) {
    normalized = normalized.replace(/[\\/]+$/, '');
  }
  return platform === 'win32' ? normalized.toLowerCase() : normalized;
};

const isPathWithinCanonicalRoot = (
  candidateCanonicalPath,
  rootCanonicalPath,
  platform = process.platform
) => {
  if (!candidateCanonicalPath || !rootCanonicalPath) return false;
  const pathImpl = platform === 'win32' ? path.win32 : path.posix;
  const candidate = toCanonicalComparisonPath(candidateCanonicalPath, platform);
  const root = toCanonicalComparisonPath(rootCanonicalPath, platform);
  if (!candidate || !root) return false;
  const rel = pathImpl.relative(root, candidate);
  return (
    rel === '' ||
    (rel !== '..' &&
      !rel.startsWith(`..${pathImpl.sep}`) &&
      !pathImpl.isAbsolute(rel))
  );
};

const isSensitiveCanonicalPath = (
  canonicalPath,
  platform = process.platform
) => {
  if (typeof canonicalPath !== 'string' || !canonicalPath) return true;
  const compared = toCanonicalComparisonPath(canonicalPath, platform);
  const segments = compared.split(/[\\/]+/).filter(Boolean);
  if (segments.some(seg => SENSITIVE_DIR_SEGMENTS.has(seg))) {
    return true;
  }
  if (platform === 'win32') {
    const systemRoot = toCanonicalComparisonPath(
      process.env.SystemRoot || 'C:\\Windows',
      'win32'
    );
    if (
      systemRoot &&
      (isPathWithinCanonicalRoot(
        compared,
        path.win32.join(systemRoot, 'System32'),
        'win32'
      ) ||
        isPathWithinCanonicalRoot(
          compared,
          path.win32.join(systemRoot, 'SysWOW64'),
          'win32'
        ))
    ) {
      return true;
    }
  } else {
    const blockedPrefixes = ['/etc', '/private/etc', '/proc', '/sys', '/dev'];
    if (
      blockedPrefixes.some(prefix =>
        isPathWithinCanonicalRoot(compared, prefix, 'posix')
      )
    ) {
      return true;
    }
  }
  return false;
};

const registerGdevelopFileProtocol = (options = {}) => {
  const electron =
    !options.protocol || !options.net ? require('electron') : null;
  const protocol = options.protocol || electron.protocol;
  const net = options.net || electron.net;
  const isDev = !!options.isDev;
  const developmentServerBaseUrl =
    options.developmentServerBaseUrl ||
    process.env.GDEVELOP_DEV_SERVER_URL ||
    'http://localhost:3000';
  const allowedOrigins = buildAllowedOrigins({
    isDev,
    developmentServerBaseUrl,
  });
  const checkIsPathAllowed = options.isPathAllowed || (() => false);

  protocol.handle(GDEVELOP_FILE_SCHEME, async request => {
    const corsHeaders = getCorsHeaders(request, allowedOrigins);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', {
        status: 405,
        headers: corsHeaders,
      });
    }

    const localPath = resolveGdevelopFileUrlToLocalPath(request.url);
    if (!localPath) {
      return new Response('Invalid local file URL', {
        status: 400,
        headers: corsHeaders,
      });
    }

    if (!checkIsPathAllowed(localPath)) {
      return new Response('Forbidden', {
        status: 403,
        headers: corsHeaders,
      });
    }

    let realPath;
    try {
      realPath = await fs.promises.realpath(localPath);
      if (!checkIsPathAllowed(realPath)) {
        return new Response('Forbidden', {
          status: 403,
          headers: corsHeaders,
        });
      }
      const stat = await fs.promises.stat(realPath);
      if (!stat.isFile()) {
        return new Response('Not a file', {
          status: 403,
          headers: corsHeaders,
        });
      }
    } catch (error) {
      const status =
        error && (error.code === 'ENOENT' || error.code === 'ENOTDIR')
          ? 404
          : 500;
      return new Response(
        status === 404 ? 'File not found' : 'Unable to read local file',
        { status, headers: corsHeaders }
      );
    }

    try {
      const upstreamResponse = await fetchProtocolAsset(
        net,
        pathToFileURL(realPath).href,
        request
      );
      const responseHeaders = new Headers(upstreamResponse.headers);
      Object.entries(corsHeaders).forEach(([key, value]) => {
        responseHeaders.set(key, value);
      });
      const responseBody =
        request.method === 'HEAD' ||
        upstreamResponse.status === 204 ||
        upstreamResponse.status === 205 ||
        upstreamResponse.status === 304
          ? null
          : upstreamResponse.body;
      return new Response(responseBody, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
        headers: responseHeaders,
      });
    } catch (error) {
      return new Response('Failed to fetch local file', {
        status: 500,
        headers: corsHeaders,
      });
    }
  });
};

module.exports = {
  GDEVELOP_FILE_SCHEME,
  GDEVELOP_FILE_HOST,
  resolveGdevelopFileUrlToLocalPath,
  buildAllowedOrigins,
  resolveCanonicalPathSync,
  isSensitiveCanonicalPath,
  isPathWithinCanonicalRoot,
  registerGdevelopFileProtocol,
};
