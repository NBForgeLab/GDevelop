const { fetchProtocolAsset } = require('./FetchProtocolAsset');
const { protocol, net } = require('electron');
const path = require('path');
const { URL, pathToFileURL } = require('url');

// Another dev server (for example one started on another port for a second
// checkout, or to run CLI commands while the usual one is in use).
const normalizeBaseUrl = url => String(url || '').replace(/\/+$/, '');
const developmentServerBaseUrl = normalizeBaseUrl(
  process.env.GDEVELOP_DEV_SERVER_URL || 'http://localhost:3000'
);
const appPublicFolderBaseUrl = path.resolve(path.join(__dirname, '..', 'www'));

/**
 * Load the given path, relative to the app public folder.
 */
const load = ({ isDev, devTools, path: targetPath, window }) => {
  const safeTargetPath = String(targetPath || '');
  const normalizedPath = safeTargetPath.startsWith('/')
    ? safeTargetPath
    : `/${safeTargetPath}`;
  if (isDev) {
    // Development (server hosted by npm run start)
    window.loadURL(developmentServerBaseUrl + normalizedPath);
    window.openDevTools();
  } else {
    // Production (with npm run build), loaded via secure standard custom origin gdide://app
    // so ES module scripts, WebAssembly, and fetch() work with webSecurity: true.
    window.loadURL(`gdide://app${normalizedPath}`);
    if (devTools) window.openDevTools();
  }
};

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

/**
 * Resolve a `gdide://app/...` or `gdide://external/...` request URL into a
 * safe relative path inside the app's public/www directory.
 */
const resolveGdideRelativePath = requestUrl => {
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

  if (parsedUrl.protocol !== 'gdide:') return null;
  if (parsedUrl.port || parsedUrl.username || parsedUrl.password) return null;

  let rawPathname;
  try {
    rawPathname = decodeURIComponent(parsedUrl.pathname || '/');
  } catch (e) {
    return null;
  }
  if (rawPathname.includes('\0')) return null;
  const rawSegments = rawPathname.split(/[\\/]/);
  if (rawSegments.some(segment => segment === '..')) return null;

  let relativePath;
  if (parsedUrl.hostname === 'app') {
    relativePath = rawPathname.replace(/^\/+/, '');
  } else if (parsedUrl.hostname === 'external') {
    relativePath = `external/${rawPathname.replace(/^\/+/, '')}`;
  } else {
    return null;
  }

  if (!relativePath) relativePath = 'index.html';

  const normalizedPosix = path.posix.normalize(`/${relativePath}`).slice(1);
  if (normalizedPosix.startsWith('..')) return null;

  return normalizedPosix;
};

/**
 * Resolve a `gdide://` URL to an absolute file path strictly contained inside
 * `baseRoot` (default: the packaged `www` directory).
 */
const resolveGdideRequestPath = (
  requestUrl,
  baseRoot = appPublicFolderBaseUrl
) => {
  const relativePath = resolveGdideRelativePath(requestUrl);
  if (!relativePath) return null;

  const resolvedRoot = path.resolve(baseRoot);
  const resolvedTarget = path.resolve(resolvedRoot, relativePath);
  const relFromRoot = path.relative(resolvedRoot, resolvedTarget);
  if (
    !relFromRoot ||
    relFromRoot === '..' ||
    relFromRoot.startsWith(`..${path.sep}`) ||
    path.isAbsolute(relFromRoot)
  ) {
    return null;
  }

  return resolvedTarget;
};

/**
 * Register gdide:// scheme to serve app and external editor files in Electron
 * cleanly with `webSecurity: true` and HTML ES modules support.
 */
const registerGdideProtocol = ({
  isDev,
  protocol: customProtocol,
  externalOnly = false,
  developmentServerBaseUrl: customDevServerBaseUrl,
}) => {
  const targetProtocol = customProtocol || protocol;
  const activeDevServerBaseUrl = normalizeBaseUrl(
    customDevServerBaseUrl || developmentServerBaseUrl
  );
  if (!targetProtocol || typeof targetProtocol.handle !== 'function') {
    return;
  }

  targetProtocol.handle('gdide', async request => {
    if (externalOnly && new URL(request.url).host !== 'external')
      return new Response('Forbidden', { status: 403 });
    if (request.url === 'gdide://app/__storage_migration__.html') {
      return new Response('<!doctype html><html><head><meta charset="utf-8"></head></html>', {
        headers: { 'Content-Type': 'text/html', 'Content-Security-Policy': "default-src 'none'" },
      });
    }
    const requestOrigin =
      request && request.headers && typeof request.headers.get === 'function'
        ? request.headers.get('origin')
        : null;
    const corsHeaders = {
      Vary: 'Origin',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    };
    let allowedDevOrigin = null;
    if (isDev && activeDevServerBaseUrl) {
      try {
        allowedDevOrigin = new URL(activeDevServerBaseUrl).origin;
      } catch (e) {}
    }
    if (
      requestOrigin &&
      (requestOrigin === 'gdide://app' ||
        requestOrigin === 'gdide://external' ||
        (isDev &&
          (requestOrigin === 'http://localhost:3000' ||
            requestOrigin === allowedDevOrigin)))
    ) {
      corsHeaders['Access-Control-Allow-Origin'] = requestOrigin;
    }

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: corsHeaders });
    }

    if (request.method !== 'GET' && request.method !== 'HEAD') {
      return new Response('Method Not Allowed', { status: 405, headers: corsHeaders });
    }

    const relativePath = resolveGdideRelativePath(request.url);
    if (!relativePath) {
      return new Response('Forbidden', { status: 403, headers: corsHeaders });
    }

    let upstreamUrl;
    if (isDev) {
      let suffix = '';
      try {
        const parsed = new URL(request.url);
        suffix = parsed.search || '';
      } catch (e) {}
      upstreamUrl = `${activeDevServerBaseUrl}/${relativePath}${suffix}`;
    } else {
      const localPath = resolveGdideRequestPath(request.url);
      if (!localPath) {
        return new Response('Forbidden', { status: 403, headers: corsHeaders });
      }
      upstreamUrl = pathToFileURL(localPath).href;
    }

    let upstreamResponse;
    try {
      upstreamResponse = await fetchProtocolAsset(net, upstreamUrl, request);
    } catch (error) {
      return new Response('Upstream request failed', {
        status: 502,
        headers: corsHeaders,
      });
    }
    const responseHeaders = new Headers(upstreamResponse.headers);
    Object.entries(corsHeaders).forEach(([key, value]) => {
      responseHeaders.set(key, value);
    });
    const isNullBodyStatus =
      (request && request.method && request.method.toUpperCase() === 'HEAD') ||
      upstreamResponse.status === 204 ||
      upstreamResponse.status === 205 ||
      upstreamResponse.status === 304;
    return new Response(isNullBodyStatus ? null : upstreamResponse.body, {
      status: upstreamResponse.status,
      statusText: upstreamResponse.statusText,
      headers: responseHeaders,
    });
  });
};

module.exports = {
  load,
  registerGdideProtocol,
  developmentServerBaseUrl,
  resolveGdideRelativePath,
  resolveGdideRequestPath,
};
