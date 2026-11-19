const assert = require('assert');
const fs = require('fs');
const Module = require('module');
const os = require('os');
const path = require('path');

// Mock `electron` BEFORE requiring Electron app modules so Node never attempts
// to invoke/download the Electron binary during unit verification.
const registeredIpcHandlers = new Map();
const registeredIpcListeners = new Map();
const registeredProtocols = new Map();
const exposedApis = new Map();
const openedExternalUrls = [];
const openedPaths = [];
const menuPopups = [];
const invokedIpcCalls = [];
const sentIpcCalls = [];
const createdSessions = [];
let nextWindowId = 100;

class FakeEventEmitter {
  constructor() {
    this._listeners = new Map();
  }
  on(event, fn) {
    const list = this._listeners.get(event) || [];
    list.push(fn);
    this._listeners.set(event, list);
    return this;
  }
  once(event, fn) {
    const listener = (...args) => {
      this.removeListener(event, listener);
      fn(...args);
    };
    return this.on(event, listener);
  }
  removeListener(event, fn) {
    const list = this._listeners.get(event) || [];
    this._listeners.set(event, list.filter(item => item !== fn));
    return this;
  }
  emit(event, ...args) {
    const list = [...(this._listeners.get(event) || [])];
    list.forEach(fn => fn(...args));
  }
}

class FakeBrowserWindow extends FakeEventEmitter {
  constructor(options = {}) {
    super();
    this.id = nextWindowId++;
    this.options = options;
    this._destroyed = false;
    this._title = '';
    this._shown = false;
    const wc = new FakeEventEmitter();
    wc.id = this.id * 10;
    wc.sentMessages = [];
    wc._url = 'gdide://external/piskel/index.html';
    wc.isDestroyed = () => this._destroyed;
    wc.send = (channel, ...args) => {
      wc.sentMessages.push({ channel, args });
    };
    wc.getURL = () => wc._url;
    wc.setWindowOpenHandler = handler => {
      wc._windowOpenHandler = handler;
    };
    wc.ownerWindow = this;
    this.webContents = wc;
    FakeBrowserWindow.instances.push(this);
  }
  setMenu() {}
  setMenuBarVisibility() {}
  setTitle(t) {
    this._title = t;
  }
  getTitle() {
    return this._title;
  }
  loadURL(url) {
    this.webContents._url = url;
  }
  openDevTools() {}
  show() {
    this._shown = true;
  }
  getSize() {
    return [1280, 800];
  }
  isDestroyed() {
    return this._destroyed;
  }
  close() {
    if (this._destroyed) return;
    this.emit('close');
    if (!this._destroyed) {
      this._destroyed = true;
      this.emit('closed');
    }
  }
  destroy() {
    if (this._destroyed) return;
    this._destroyed = true;
    this.emit('closed');
  }
}
FakeBrowserWindow.instances = [];
FakeBrowserWindow.fromWebContents = wc => (wc && wc.ownerWindow) || null;
FakeBrowserWindow.getFocusedWindow = () => null;

const defaultSessionCookies = {
  get: async () => [{ name: 'gd_resource', value: 'default-session-cookie' }],
};

const fakeAppHandlers = new FakeEventEmitter();
let nextFetchImpl = async url =>
  new Response(`FETCHED:${url}`, {
    status: 200,
    headers: { 'Content-Type': 'text/plain' },
  });

const fakeElectron = {
  app: {
    getName: () => 'GDevelop',
    getVersion: () => '5.0.0',
    getAppPath: () => path.join(__dirname, '..', 'app'),
    getPath: name => path.join(os.tmpdir(), `gdevelop-fake-${name}`),
    getGPUInfo: async type => ({ type }),
    quit: () => {},
    on: (ev, fn) => fakeAppHandlers.on(ev, fn),
    emit: (ev, ...args) => fakeAppHandlers.emit(ev, ...args),
  },
  session: {
    fromPartition: partition => ({
      partition,
      protocol: {
        isProtocolHandled: scheme =>
          registeredProtocols.has(partition + ':' + scheme),
        unhandle: scheme =>
          registeredProtocols.delete(partition + ':' + scheme),
        handle: (scheme, handler) =>
          registeredProtocols.set(`${partition}:${scheme}`, handler),
      },
    }),
    defaultSession: {
      cookies: defaultSessionCookies,
      protocol: {
        handle: (scheme, handler) =>
          registeredProtocols.set(`default:${scheme}`, handler),
        isProtocolHandled: scheme =>
          registeredProtocols.has(`default:${scheme}`),
      },
    },
  },
  BrowserWindow: FakeBrowserWindow,
  Menu: {
    buildFromTemplate: template => ({
      template,
      popup: opts => {
        menuPopups.push({ template, opts });
        if (opts && typeof opts.callback === 'function') opts.callback();
      },
    }),
  },
  dialog: {
    showOpenDialog: async () => ({ canceled: true, filePaths: [] }),
    showSaveDialog: async () => ({ canceled: true }),
    showSaveDialogSync: () => undefined,
    showMessageBox: async () => ({ response: 0 }),
    showMessageBoxSync: () => 0,
  },
  ipcMain: {
    handle: (channel, handler) => registeredIpcHandlers.set(channel, handler),
    on: (channel, handler) => {
      const list = registeredIpcListeners.get(`main:${channel}`) || [];
      list.push(handler);
      registeredIpcListeners.set(`main:${channel}`, list);
      registeredIpcListeners.set(channel, handler);
    },
    removeListener: (channel, handler) => {
      const list = registeredIpcListeners.get(`main:${channel}`) || [];
      const next = list.filter(fn => fn !== handler);
      registeredIpcListeners.set(`main:${channel}`, next);
      if (registeredIpcListeners.get(channel) === handler) {
        if (next.length > 0) registeredIpcListeners.set(channel, next[0]);
        else registeredIpcListeners.delete(channel);
      }
    },
  },
  ipcRenderer: {
    on: (channel, handler) => {
      const list = registeredIpcListeners.get(`renderer:${channel}`) || [];
      list.push(handler);
      registeredIpcListeners.set(`renderer:${channel}`, list);
    },
    removeListener: (channel, handler) => {
      const list = registeredIpcListeners.get(`renderer:${channel}`) || [];
      registeredIpcListeners.set(
        `renderer:${channel}`,
        list.filter(fn => fn !== handler)
      );
    },
    removeAllListeners: channel => {
      registeredIpcListeners.delete(`renderer:${channel}`);
    },
    send: (channel, ...args) => {
      sentIpcCalls.push({ channel, args });
    },
    sendSync: channel => {
      if (channel === 'desktop-get-bootstrap-data-sync') {
        return { platform: process.platform, paths: {} };
      }
      return null;
    },
    invoke: async (channel, ...args) => {
      invokedIpcCalls.push({ channel, args });
      if (channel === 'desktop-fs-invoke' && args[0] === 'readFile') {
        return {
          ok: false,
          error: {
            message: 'ENOENT: no such file',
            code: 'ENOENT',
            errno: -4058,
            syscall: 'open',
            path: args[1] && args[1][0],
          },
        };
      }
      return null;
    },
  },
  contextBridge: {
    exposeInMainWorld: (name, api) => {
      exposedApis.set(name, api);
    },
  },
  protocol: {
    handle: (scheme, handler) => registeredProtocols.set(scheme, handler),
    isProtocolHandled: scheme => registeredProtocols.has(scheme),
    isProtocolRegistered: scheme => registeredProtocols.has(scheme),
  },
  net: {
    fetch: async (...args) => nextFetchImpl(...args),
  },
  screen: {
    getDisplayMatching: () => ({ scaleFactor: 1 }),
    getPrimaryDisplay: () => ({ workAreaSize: { width: 1920, height: 1080 } }),
  },
  shell: {
    openExternal: async url => {
      openedExternalUrls.push(url);
    },
    openPath: async p => {
      openedPaths.push(p);
      return '';
    },
    showItemInFolder: () => {},
  },
};

const originalLoad = Module._load;
Module._load = function patchedLoad(request, parent, isMain) {
  if (request === 'electron') return fakeElectron;
  return originalLoad.call(this, request, parent, isMain);
};

const makeMockRequest = (url, method = 'GET', origin = null) => ({
  url,
  method,
  headers: new Headers(origin ? { origin } : {}),
});

const run = async () => {
  const {
    resolveGdevelopFileUrlToLocalPath,
    registerGdevelopFileProtocol,
  } = require('../app/Utils/GdevelopFileProtocol');
  const {
    resolveGdideRelativePath,
    resolveGdideRequestPath,
    registerGdideProtocol,
  } = require('../app/Utils/UrlLoader');
  const {
    ALLOWED_APP_PATHS,
    buildNpmScriptSpawnConfig,
    isSafeExternalUrl,
    sanitizePopupMenuTemplate,
    setupDesktopIpcHandlers,
  } = require('../app/DesktopIpcHandlers');
  const {
    sanitizePreviewBrowserWindowOptions,
    assertSafePreviewIndexUrl,
    assertSafePreviewFilePath,
  } = require('../app/PreviewWindow');
  const { downloadLocalFile } = require('../app/LocalFileDownloader');
  const {
    loadExternalEditorWindow,
  } = require('../app/LocalExternalEditorWindow');
  require('../app/preload');
  require('../app/externalEditorPreload');
  require('../app/previewPreload');

  const tmpRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-sec-bridge-test-'));
  const sampleFile = path.join(tmpRoot, 'My Asset #1.txt');
  const subDir = path.join(tmpRoot, 'sub');
  fs.mkdirSync(subDir);
  fs.writeFileSync(sampleFile, 'hello-gdevelop', 'utf8');
  fs.writeFileSync(path.join(subDir, 'level.json'), '{}', 'utf8');

  try {
    // 1. GdevelopFileProtocol path validation
    assert.strictEqual(
      resolveGdevelopFileUrlToLocalPath(
        'gdevelop-file://local/C:/Users/Dev/My%20Game/sprite%20%231.png',
        'win32'
      ),
      path.win32.resolve('C:/Users/Dev/My Game/sprite #1.png')
    );
    assert.strictEqual(
      resolveGdevelopFileUrlToLocalPath(
        'gdevelop-file://local/home/dev/My%20Game/a%20%25.png',
        'linux'
      ),
      path.posix.resolve('/home/dev/My Game/a %.png')
    );

    // Explicit Win32 UNC URL resolution (gated by canonical allowlist before FS I/O)
    assert.strictEqual(
      resolveGdevelopFileUrlToLocalPath(
        'gdevelop-file://local//server/share/file.png',
        'win32'
      ),
      path.win32.resolve('\\\\server\\share\\file.png')
    );

    const invalidFileUrls = [
      '',
      null,
      'file:///etc/passwd',
      'http://local/C:/a.png',
      'gdevelop-file://evil-host/C:/a.png',
      'gdevelop-file://user:pass@local/C:/a.png',
      'gdevelop-file://local:8080/C:/a.png',
      'gdevelop-file://local/C:/a/%ZZ/b.png',
      'gdevelop-file://local/C:/a/foo%00.png',
      'gdevelop-file://local/C:/a/../secret.txt',
      'gdevelop-file://local/C:/a/..%2Fsecret.txt',
      'gdevelop-file://local/C:/a/%2e%2e/secret.txt',
      'gdevelop-file://local/C:/a/%252e%252e/secret.txt',
      'gdevelop-file://local/relative/path.png',
    ];
    invalidFileUrls.forEach(badUrl => {
      assert.strictEqual(
        resolveGdevelopFileUrlToLocalPath(badUrl, 'win32'),
        null,
        `Expected null for win32 url: ${String(badUrl)}`
      );
    });
    assert.strictEqual(
      resolveGdevelopFileUrlToLocalPath(
        'gdevelop-file://local/home/user/%2e%2e/etc/passwd',
        'linux'
      ),
      null
    );

    // 2. Canonical file root allowlisting & registerGdevelopFileProtocol live handler checks
    const outsideRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gd-sec-outside-')
    );
    const outsideSecretFile = path.join(outsideRoot, 'secret.txt');
    fs.writeFileSync(outsideSecretFile, 'TOP-SECRET', 'utf8');
    const escapedSymlinkPath = path.join(tmpRoot, 'escape-link.txt');
    let symlinkCreated = false;
    try {
      fs.symlinkSync(outsideSecretFile, escapedSymlinkPath);
      symlinkCreated = true;
    } catch (e) {
      // Symlinks may require privileges on some Windows setups; non-symlink outside check still runs.
    }

    const { createFileAccessPolicy } = require('../app/Utils/FileAccessPolicy');
    const rootsManager = createFileAccessPolicy({ readRoots: [tmpRoot] });
    assert.strictEqual(rootsManager.hasAccess(sampleFile), true);
    assert.strictEqual(rootsManager.hasAccess(outsideSecretFile), false);
    if (symlinkCreated) {
      assert.strictEqual(rootsManager.hasAccess(escapedSymlinkPath), false);
    }

    registerGdevelopFileProtocol({
      isDev: true,
      developmentServerBaseUrl: 'http://localhost:3000/',
      isPathAllowed: candidate => rootsManager.hasAccess(candidate),
    });
    const gdFileHandler = registeredProtocols.get('gdevelop-file');
    assert.strictEqual(typeof gdFileHandler, 'function');

    const toGdevUrl = filePath => {
      const normalized = filePath.replace(/\\/g, '/').replace(/^\/+/, '');
      return `gdevelop-file://local/${normalized
        .split('/')
        .map((seg, i) =>
          i === 0 && /^[A-Za-z]:$/.test(seg) ? seg : encodeURIComponent(seg)
        )
        .join('/')}`;
    };

    const sampleUrl = toGdevUrl(sampleFile);
    const outsideUrl = toGdevUrl(outsideSecretFile);

    const okRes = await gdFileHandler(
      makeMockRequest(sampleUrl, 'GET', 'gdide://app')
    );
    assert.strictEqual(okRes.status, 200);
    assert.strictEqual(
      okRes.headers.get('Access-Control-Allow-Origin'),
      'gdide://app'
    );

    const deniedOutsideRes = await gdFileHandler(
      makeMockRequest(outsideUrl, 'GET', 'gdide://app')
    );
    assert.strictEqual(deniedOutsideRes.status, 403);
    if (symlinkCreated) {
      const deniedSymlinkRes = await gdFileHandler(
        makeMockRequest(toGdevUrl(escapedSymlinkPath), 'GET', 'gdide://app')
      );
      assert.strictEqual(deniedSymlinkRes.status, 403);
    }

    const untrustedOriginRes = await gdFileHandler(
      makeMockRequest(sampleUrl, 'GET', 'https://evil.example')
    );
    assert.strictEqual(
      untrustedOriginRes.headers.get('Access-Control-Allow-Origin'),
      null
    );

    const devOptionsRes = await gdFileHandler(
      makeMockRequest(sampleUrl, 'OPTIONS', 'http://localhost:3000')
    );
    assert.strictEqual(devOptionsRes.status, 204);
    assert.strictEqual(
      devOptionsRes.headers.get('Access-Control-Allow-Origin'),
      'http://localhost:3000'
    );

    // Production (`isDev: false`) must NOT grant CORS to http://localhost:3000
    registerGdevelopFileProtocol({
      isDev: false,
      developmentServerBaseUrl: 'http://localhost:3000',
      isPathAllowed: candidate => rootsManager.hasAccess(candidate),
    });
    const prodGdFileHandler = registeredProtocols.get('gdevelop-file');
    const prodOptionsRes = await prodGdFileHandler(
      makeMockRequest(sampleUrl, 'OPTIONS', 'http://localhost:3000')
    );
    assert.strictEqual(
      prodOptionsRes.headers.get('Access-Control-Allow-Origin'),
      null
    );

    // Restore allowlist handler for subsequent checks
    registerGdevelopFileProtocol({
      isDev: true,
      developmentServerBaseUrl: 'http://localhost:3000',
      isPathAllowed: candidate => rootsManager.hasAccess(candidate),
    });
    const gdFileActiveHandler = registeredProtocols.get('gdevelop-file');

    const postRes = await gdFileActiveHandler(
      makeMockRequest(sampleUrl, 'POST')
    );
    assert.strictEqual(postRes.status, 405);

    const badTraversalRes = await gdFileActiveHandler(
      makeMockRequest('gdevelop-file://local/C:/a/%2e%2e/secret.txt', 'GET')
    );
    assert.strictEqual(badTraversalRes.status, 400);

    const dirUrl = toGdevUrl(subDir);
    const dirRes = await gdFileActiveHandler(makeMockRequest(dirUrl, 'GET'));
    assert.strictEqual(dirRes.status, 403);

    const missingRes = await gdFileActiveHandler(
      makeMockRequest(`${sampleUrl}-missing`, 'GET')
    );
    assert.strictEqual(missingRes.status, 404);

    const headRes = await gdFileActiveHandler(
      makeMockRequest(sampleUrl, 'HEAD')
    );
    assert.strictEqual(headRes.status, 200);
    assert.strictEqual(headRes.body, null);

    try {
      fs.rmSync(outsideRoot, { recursive: true, force: true });
    } catch (e) {}

    // 3. UrlLoader (gdide://) checks
    const fakeWwwRoot = path.join(tmpRoot, 'www');
    assert.strictEqual(
      resolveGdideRequestPath('gdide://app/', fakeWwwRoot),
      path.resolve(fakeWwwRoot, 'index.html')
    );
    assert.strictEqual(
      resolveGdideRequestPath(
        'gdide://external/piskel/index.html',
        fakeWwwRoot
      ),
      path.resolve(fakeWwwRoot, 'external', 'piskel', 'index.html')
    );
    [
      'gdide://other/index.html',
      'gdide://app/../../etc/passwd',
      'gdide://external/..%2F..%2Findex.html',
      'gdide://app/%2e%2e/index.html',
      'gdide://app/%252e%252e/index.html',
      'gdide://app/foo%00.js',
      'https://app/index.html',
    ].forEach(badGdideUrl => {
      assert.strictEqual(
        resolveGdideRequestPath(badGdideUrl, fakeWwwRoot),
        null,
        `Expected null for gdide url: ${badGdideUrl}`
      );
    });
    assert.strictEqual(
      resolveGdideRelativePath('gdide://app/%2e%2e/secret.js'),
      null
    );

    registerGdideProtocol({
      isDev: false,
      developmentServerBaseUrl: 'http://localhost:3000/',
    });
    const gdideHandler = registeredProtocols.get('gdide');
    assert.strictEqual(typeof gdideHandler, 'function');
    const gdideForbidden = await gdideHandler(
      makeMockRequest('gdide://external/../../index.html', 'GET')
    );
    assert.strictEqual(gdideForbidden.status, 403);

    // Production gdide:// must not return localhost dev CORS headers
    const gdideProdCors = await gdideHandler(
      makeMockRequest(
        'gdide://app/index.html',
        'OPTIONS',
        'http://localhost:3000'
      )
    );
    assert.strictEqual(
      gdideProdCors.headers.get('Access-Control-Allow-Origin'),
      null
    );

    // Dev gdide:// strips trailing slash on devServerUrl and handles HEAD/204/304 & fetch errors cleanly
    registerGdideProtocol({
      isDev: true,
      developmentServerBaseUrl: 'http://localhost:3000///',
    });
    const gdideDevHandler = registeredProtocols.get('gdide');
    let capturedFetchUrl = null;
    const upstreamOptions = [];
    nextFetchImpl = async (url, options) => {
      capturedFetchUrl = url;
      upstreamOptions.push(options);
      return new Response(null, { status: 304 });
    };
    const gdide304Res = await gdideDevHandler({
      url: 'gdide://app/index.html',
      method: 'GET',
      headers: new Headers({ Range: 'bytes=0-15', Origin: 'gdide://external' }),
    });
    assert.deepStrictEqual(Array.from(upstreamOptions[0].headers.entries()), [
      ['range', 'bytes=0-15'],
    ]);
    assert.strictEqual(upstreamOptions[0].credentials, 'omit');
    assert.strictEqual(capturedFetchUrl, 'http://localhost:3000/index.html');
    assert.strictEqual(gdide304Res.status, 304);
    assert.strictEqual(gdide304Res.body, null);

    nextFetchImpl = async () => {
      throw new Error('ECONNREFUSED');
    };
    const gdideErrRes = await gdideDevHandler(
      makeMockRequest('gdide://app/index.html', 'GET')
    );
    assert.strictEqual(gdideErrRes.status, 502);
    nextFetchImpl = async url =>
      new Response(`FETCHED:${url}`, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });

    // 4. DesktopIpcHandlers security & fs checks
    assert.strictEqual(isSafeExternalUrl('https://gdevelop.io'), true);
    assert.strictEqual(isSafeExternalUrl('http://localhost:3000'), true);
    assert.strictEqual(isSafeExternalUrl('mailto:dev@example.com'), true);
    assert.strictEqual(isSafeExternalUrl('javascript:alert(1)'), false);
    assert.strictEqual(isSafeExternalUrl('file:///etc/passwd'), false);
    assert.strictEqual(isSafeExternalUrl('data:text/html,<script>'), false);

    const clickedIds = [];
    const sanitizedMenu = sanitizePopupMenuTemplate(
      [
        {
          label: 'Copy',
          role: 'copy',
          evilFn: () => {},
          actionId: 'a1',
        },
        {
          label: 'Injected',
          role: 'notARealElectronRole',
          type: 'bogusType',
          submenu: [{ label: 'Sub', actionId: 'a2' }],
        },
      ],
      id => clickedIds.push(id)
    );
    assert.strictEqual(sanitizedMenu[0].evilFn, undefined);
    assert.strictEqual(sanitizedMenu[0].role, 'copy');
    sanitizedMenu[0].click();
    assert.strictEqual(sanitizedMenu[1].role, undefined);
    assert.strictEqual(sanitizedMenu[1].type, undefined);
    sanitizedMenu[1].submenu[0].click();
    assert.deepStrictEqual(clickedIds, ['a1', 'a2']);

    const {
      resolvePreviewDirectory,
    } = require('../app/Utils/PreviewDirectory');
    for (const invalid of [
      undefined,
      '',
      '.',
      sampleFile,
      tmpRoot,
      os.tmpdir(),
    ]) {
      assert.throws(() => resolvePreviewDirectory(invalid, tmpRoot));
    }
    assert.strictEqual(
      resolvePreviewDirectory(subDir, tmpRoot),
      fs.realpathSync(subDir)
    );
    const { readFileOptions } = require('../app/Utils/ReadFileOptions');
    assert.deepStrictEqual(
      readFileOptions({ encoding: 'utf8', flag: 'unknown' }),
      {
        encoding: 'utf8',
        flag: 'r',
      }
    );
    const popoutWin = new FakeBrowserWindow();
    const selectedGrants = [];
    const testFileAccessPolicy = require('../app/Utils/FileAccessPolicy').createFileAccessPolicy(
      { writeRoots: [tmpRoot] }
    );
    setupDesktopIpcHandlers({
      grantSelectedPath: (...grant) => {
        selectedGrants.push(grant);
        const [target, mode, directory] = grant;
        return directory
          ? testFileAccessPolicy.grantRoot(target, mode)
          : testFileAccessPolicy.grantFile(target, mode);
      },
      fileAccessPolicy: testFileAccessPolicy,
      isDev: true,
      getDefaultArgs: () => ({}),
      getWindowArgsForWebContents: sender => (sender && sender.args) || null,
      resolveWindowByTargetId: targetId =>
        targetId === 'GDevelopWindowPortal7' ? popoutWin : null,
      mainWindows: [],
    });

    const readCatalog = registeredIpcHandlers.get(
      'desktop-read-public-catalog'
    );
    const previousFetch = nextFetchImpl;
    try {
      const expectedCatalogUrls = [
        ['bundles', 'https://api.gdevelop.io/shop/bundle'],
        ['templates', 'https://api.gdevelop.io/shop/game-template'],
        ['credits', 'https://api.gdevelop.io/shop/credits-package'],
        ['assetPacks', 'https://api.gdevelop.io/shop/asset-pack'],
        [
          'givenAwayProducts',
          'https://api.gdevelop.io/shop/given-away-product',
        ],
        ['releases', 'https://api.gdevelop.io/release/release?last=4'],
        ['showcasedGames', 'https://api.gdevelop.io/game/showcased-game'],
        ['gameCategories', 'https://api.gdevelop.io/game/game-category'],
        ['marketingPlans', 'https://api.gdevelop.io/game/marketing-plan'],
        ['recommendations', 'https://api.gdevelop.io/user/recommendation'],
        ['achievements', 'https://api.gdevelop.io/user/achievement'],
        ['announcements', 'https://api.gdevelop.io/release/announcement'],
        ['promotions', 'https://api.gdevelop.io/release/promotion'],
        [
          'extension',
          'https://api.gdevelop.io/asset/extension?environment=live',
        ],
        ['behavior', 'https://api.gdevelop.io/asset/behavior?environment=live'],
        ['object', 'https://api.gdevelop.io/asset/object?environment=live'],
        ['assets', 'https://api.gdevelop.io/asset/asset?environment=live'],
        [
          'stagingAssets',
          'https://api.gdevelop.io/asset/asset?environment=staging',
        ],
        [
          'resources',
          'https://api.gdevelop.io/asset/resource?environment=live',
        ],
        [
          'stagingResources',
          'https://api.gdevelop.io/asset/resource?environment=staging',
        ],
        ['authors', 'https://api.gdevelop.io/asset/author?environment=live'],
        [
          'stagingAuthors',
          'https://api.gdevelop.io/asset/author?environment=staging',
        ],
        ['licenses', 'https://api.gdevelop.io/asset/license?environment=live'],
        [
          'stagingLicenses',
          'https://api.gdevelop.io/asset/license?environment=staging',
        ],
        [
          'assetLicenses',
          'https://api.gdevelop.io/shop/product-license?productType=asset-pack',
        ],
        [
          'templateLicenses',
          'https://api.gdevelop.io/shop/product-license?productType=game-template',
        ],
        [
          'subscriptionPlans',
          'https://api.gdevelop.io/usage/subscription-plan?includeLegacy=false',
        ],
        [
          'subscriptionPlansWithLegacy',
          'https://api.gdevelop.io/usage/subscription-plan?includeLegacy=true',
        ],
        [
          'pricingSystems',
          'https://api.gdevelop.io/usage/subscription-plan-pricing-system?includeLegacy=false',
        ],
        [
          'pricingSystemsWithLegacy',
          'https://api.gdevelop.io/usage/subscription-plan-pricing-system?includeLegacy=true',
        ],
        [
          'gameCommentQualityRatingsLeaderboards',
          'https://api.gdevelop.io/game/game-comment-quality-ratings-leaderboard?leaderboardRegionName=global',
        ],
        [
          'userCommentQualityRatingsLeaderboards',
          'https://api.gdevelop.io/user/user-comment-quality-ratings-leaderboard?leaderboardRegionName=global',
        ],
        [
          'aiSettings',
          'https://public-resources.gdevelop.io/ai/ai-settings-v2.json',
        ],
        [
          'stagingAiSettings',
          'https://public-resources.gdevelop.io/staging/ai/ai-settings-v2.json',
        ],
        ['courses', 'https://api.gdevelop.io/asset/course'],
        ['listedCourses', 'https://api.gdevelop.io/shop/course'],
        ['listedChapters', 'https://api.gdevelop.io/shop/course-chapter'],
        [
          'tutorials',
          'https://api.gdevelop.io/asset/tutorial?include=upcoming',
        ],
        [
          'inAppTutorials',
          'https://api.gdevelop.io/asset/in-app-tutorial-short-header',
        ],
        ['examples', 'https://api.gdevelop.io/asset/example?environment=live'],
      ];
      assert.strictEqual(expectedCatalogUrls.length, 40);
      let expectedUrl = null;
      nextFetchImpl = async (url, options) => {
        assert.strictEqual(url, expectedUrl);
        assert.strictEqual(options.credentials, 'omit');
        assert.strictEqual(options.redirect, 'error');
        assert.ok(options.signal);
        return Response.json([{ catalogUrl: url }]);
      };
      for (const badCatalogKey of ['unsupported', 'toString', null, 42]) {
        await assert.rejects(
          () => readCatalog({}, badCatalogKey),
          /Unknown public catalog/
        );
      }
      for (const [catalogKey, catalogUrl] of expectedCatalogUrls) {
        expectedUrl = catalogUrl;
        assert.deepStrictEqual(await readCatalog({}, catalogKey), [
          { catalogUrl },
        ]);
      }
      nextFetchImpl = async () =>
        new Response('Upstream error', { status: 500 });
      await assert.rejects(
        () => readCatalog({}, 'assetPacks'),
        /Catalog request failed \(500\)/
      );
      nextFetchImpl = async () =>
        new Response('not-json', {
          status: 200,
          headers: { 'Content-Type': 'text/plain' },
        });
      await assert.rejects(() => readCatalog({}, 'assetPacks'));
    } finally {
      nextFetchImpl = previousFetch;
    }

    const originalPicker = fakeElectron.dialog.showOpenDialog;
    let pickedWorkspaceOutsideRoot = null;
    try {
      fakeElectron.dialog.showOpenDialog = async () => ({
        filePaths: [sampleFile, subDir],
      });
      await registeredIpcHandlers.get('desktop-dialog-show-open')({}, {});
      assert.deepStrictEqual(selectedGrants, [
        [sampleFile, 'read', false],
        [subDir, 'read', true],
      ]);
      selectedGrants.length = 0;
      const pickProject = registeredIpcHandlers.get(
        'desktop-pick-project-location'
      );
      await assert.rejects(
        () => pickProject({}, 'invalid'),
        /Unknown project picker mode/
      );
      let pickerCalledOnBadDefault = false;
      fakeElectron.dialog.showOpenDialog = async () => {
        pickerCalledOnBadDefault = true;
        return { canceled: true, filePaths: [] };
      };
      await assert.rejects(
        () => pickProject({}, 'folder', '/tmp/bad\0path'),
        /Invalid default path/
      );
      assert.strictEqual(pickerCalledOnBadDefault, false);

      const projectFile = path.join(subDir, 'game.json');
      fakeElectron.dialog.showOpenDialog = async (_win, options) => {
        assert.deepStrictEqual(options.properties, ['openFile']);
        assert.strictEqual(options.defaultPath, undefined);
        return { canceled: false, filePaths: [projectFile] };
      };
      assert.strictEqual(await pickProject({}, 'file', '   '), projectFile);
      assert.deepStrictEqual(selectedGrants, [[subDir, 'write', true]]);
      selectedGrants.length = 0;

      fakeElectron.dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [sampleFile],
      });
      await assert.rejects(
        () => pickProject({}, 'file'),
        /Expected a project JSON file/
      );
      assert.deepStrictEqual(selectedGrants, []);

      const jsonNamedDir = path.join(tmpRoot, 'dir.json');
      fs.mkdirSync(jsonNamedDir);
      try {
        fakeElectron.dialog.showOpenDialog = async () => ({
          canceled: false,
          filePaths: [jsonNamedDir],
        });
        await assert.rejects(
          () => pickProject({}, 'file'),
          /Expected a project JSON file/
        );
        assert.deepStrictEqual(selectedGrants, []);
      } finally {
        fs.rmdirSync(jsonNamedDir);
      }

      fakeElectron.dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [sampleFile],
      });
      await assert.rejects(
        () => pickProject({}, 'folder'),
        /Expected a project folder/
      );
      assert.deepStrictEqual(selectedGrants, []);

      const sensitiveProjectFile = path.join(os.homedir(), '.ssh', 'game.json');
      fakeElectron.dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [sensitiveProjectFile],
      });
      await assert.rejects(
        () => pickProject({}, 'file'),
        /File write access is not authorized/
      );
      assert.strictEqual(
        testFileAccessPolicy.hasAccess(sensitiveProjectFile, 'write'),
        false
      );
      selectedGrants.length = 0;

      const sensitiveDir = path.join(os.homedir(), '.ssh');
      fakeElectron.dialog.showOpenDialog = async () => ({
        canceled: false,
        filePaths: [sensitiveDir],
      });
      await assert.rejects(
        () => pickProject({}, 'folder'),
        /File write access is not authorized/
      );
      assert.strictEqual(
        testFileAccessPolicy.hasAccess(sensitiveDir, 'write'),
        false
      );
      selectedGrants.length = 0;

      pickedWorkspaceOutsideRoot = fs.mkdtempSync(
        path.join(os.tmpdir(), 'gd-sec-picked-workspace-')
      );
      fakeElectron.dialog.showOpenDialog = async (_win, options) => {
        assert.deepStrictEqual(options.properties, [
          'openDirectory',
          'createDirectory',
        ]);
        assert.strictEqual(options.defaultPath, pickedWorkspaceOutsideRoot);
        return { canceled: false, filePaths: [pickedWorkspaceOutsideRoot] };
      };
      assert.strictEqual(
        await pickProject({}, 'folder', pickedWorkspaceOutsideRoot),
        pickedWorkspaceOutsideRoot
      );
      assert.deepStrictEqual(selectedGrants, [
        [pickedWorkspaceOutsideRoot, 'write', true],
      ]);
      assert.strictEqual(
        testFileAccessPolicy.hasAccess(pickedWorkspaceOutsideRoot, 'write'),
        true
      );
      selectedGrants.length = 0;

      for (const canceledResult of [
        { canceled: true, filePaths: [] },
        null,
        { canceled: false },
      ]) {
        fakeElectron.dialog.showOpenDialog = async () => canceledResult;
        assert.strictEqual(await pickProject({}, 'folder', ''), null);
        assert.deepStrictEqual(selectedGrants, []);
      }
    } finally {
      fakeElectron.dialog.showOpenDialog = originalPicker;
      if (pickedWorkspaceOutsideRoot) {
        try {
          fs.rmSync(pickedWorkspaceOutsideRoot, {
            recursive: true,
            force: true,
          });
        } catch (e) {}
      }
    }

    const openPathHandler = registeredIpcHandlers.get(
      'desktop-shell-open-path'
    );
    const badExeFile = path.join(tmpRoot, 'payload.exe');
    fs.writeFileSync(badExeFile, 'MZ', 'utf8');
    await assert.rejects(
      () => openPathHandler({}, badExeFile),
      /Refused to directly launch executable file via shell\.openPath/
    );
    const badBundleDir = path.join(tmpRoot, 'Evil.app');
    fs.mkdirSync(badBundleDir);
    await assert.rejects(
      () => openPathHandler({}, badBundleDir),
      /Refused to directly launch executable bundle via shell\.openPath/
    );
    await openPathHandler({}, sampleFile);
    assert.ok(openedPaths.includes(path.resolve(sampleFile)));

    // Popup menu routes to target pop-out window when targetId is provided
    menuPopups.length = 0;
    const popupMenuHandler = registeredIpcHandlers.get('desktop-popup-menu');
    const mainWinForMenu = new FakeBrowserWindow();
    const popupPromise = popupMenuHandler(
      { sender: mainWinForMenu.webContents },
      {
        template: [{ label: 'Item', actionId: 'act-1' }],
        x: 5,
        y: 10,
        targetId: 'GDevelopWindowPortal7',
      }
    );
    await popupPromise;
    assert.strictEqual(
      menuPopups[menuPopups.length - 1].opts.window,
      popoutWin
    );

    const openExternalHandler = registeredIpcHandlers.get(
      'desktop-shell-open-external'
    );
    await assert.rejects(
      () => openExternalHandler({}, 'javascript:alert(1)'),
      /Refused to open unsafe external URL/
    );
    await assert.rejects(
      () => openExternalHandler({}, 'file:///C:/Windows/System32/calc.exe'),
      /Refused to open unsafe external URL/
    );
    await openExternalHandler({}, 'https://gdevelop.io');
    assert.deepStrictEqual(openedExternalUrls, ['https://gdevelop.io']);

    const getPathHandler = registeredIpcHandlers.get('desktop-app-get-path');
    assert.throws(
      () => getPathHandler({}, 'crashDumps'),
      /Disallowed app path requested/
    );
    assert.ok(await getPathHandler({}, 'userData'));

    const getPathSyncHandler = registeredIpcListeners.get(
      'desktop-app-get-path-sync'
    );
    const syncDisallowedEvt = {};
    getPathSyncHandler(syncDisallowedEvt, 'logs');
    assert.strictEqual(syncDisallowedEvt.returnValue.ok, false);

    const fsInvoke = registeredIpcHandlers.get('desktop-fs-invoke');
    const unauthorizedRead = await fsInvoke({}, 'readFile', [
      path.join(os.homedir(), '.ssh', 'id_rsa'),
    ]);
    assert.strictEqual(unauthorizedRead.ok, false);
    assert.strictEqual(unauthorizedRead.error.code, 'EACCES');
    const unauthorizedWrite = await fsInvoke({}, 'writeFile', [
      path.join(os.homedir(), 'outside-project.txt'),
      'no',
    ]);
    assert.strictEqual(unauthorizedWrite.ok, false);
    assert.strictEqual(unauthorizedWrite.error.code, 'EACCES');
    await assert.rejects(
      () => fsInvoke({}, 'readFile', ['']),
      /Invalid file system path/
    );
    await assert.rejects(
      () => fsInvoke({}, 'readFile', ['C:\\bad\0path.txt']),
      /Invalid file system path/
    );
    await assert.rejects(
      () => fsInvoke({}, 'execArbitraryCommand', [sampleFile]),
      /Disallowed fs operation/
    );
    const base64Envelope = await fsInvoke({}, 'readFile', [
      sampleFile,
      'base64',
    ]);
    assert.strictEqual(base64Envelope.ok, true);
    assert.strictEqual(
      Buffer.from(base64Envelope.result, 'base64').toString('utf8'),
      'hello-gdevelop'
    );
    const statsEnvelope = await fsInvoke({}, 'stat', [sampleFile]);
    assert.strictEqual(statsEnvelope.ok, true);
    assert.strictEqual(statsEnvelope.result.isFile, true);
    assert.strictEqual(statsEnvelope.result.isDirectory, false);
    const enoentEnvelope = await fsInvoke({}, 'readFile', [
      path.join(tmpRoot, 'does-not-exist.txt'),
      'utf8',
    ]);
    assert.strictEqual(enoentEnvelope.ok, false);
    assert.strictEqual(enoentEnvelope.error.code, 'ENOENT');

    const globOutsideRoot = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gd-sec-glob-outside-')
    );
    fs.writeFileSync(path.join(globOutsideRoot, 'leaked.json'), '{}', 'utf8');
    let globSymlinkCreated = false;
    try {
      fs.symlinkSync(
        path.join(globOutsideRoot, 'leaked.json'),
        path.join(tmpRoot, 'linked-outside.json')
      );
      globSymlinkCreated = true;
    } catch (e) {}

    const globHandler = registeredIpcHandlers.get('desktop-glob');
    const matched = await globHandler(
      {},
      { baseFolder: tmpRoot, extensions: ['json'] }
    );
    assert.strictEqual(matched.length, 1);
    assert.ok(matched[0].endsWith('/sub/level.json'));
    if (globSymlinkCreated) {
      assert.strictEqual(
        matched.some(entry => entry.includes('linked-outside.json')),
        false
      );
    }
    try {
      fs.rmSync(globOutsideRoot, { recursive: true, force: true });
    } catch (e) {}

    // desktop-archive-folder unlinks partial zip when sizeLimit is exceeded
    const archiveHandler = registeredIpcHandlers.get('desktop-archive-folder');
    const oversizeZipPath = path.join(tmpRoot, 'oversize.zip');
    await assert.rejects(
      () =>
        archiveHandler(
          {},
          {
            folderPath: tmpRoot,
            outputFilename: oversizeZipPath,
            sizeLimit: 1,
          }
        ),
      /above the limit allowed/
    );
    assert.strictEqual(fs.existsSync(oversizeZipPath), false);

    // Readdir with withFileTypes preserves serialized Dirent flags
    const asyncDirentsEnvelope = await fsInvoke({}, 'readdir', [
      tmpRoot,
      { withFileTypes: true },
    ]);
    assert.strictEqual(asyncDirentsEnvelope.ok, true);
    const subDirent = asyncDirentsEnvelope.result.find(
      d => d && d.name === 'sub'
    );
    assert.ok(subDirent && subDirent.__isDirent === true);
    assert.strictEqual(subDirent.isDirectory, true);
    assert.strictEqual(subDirent.isFile, false);

    assert.ok(ALLOWED_APP_PATHS.has('userData'));
    const fsSyncHandler = registeredIpcListeners.get('desktop-fs-sync');
    const readdirSyncEvt = {};
    await fsSyncHandler(readdirSyncEvt, {
      op: 'readdirSync',
      args: [tmpRoot, { withFileTypes: true }],
    });
    assert.strictEqual(readdirSyncEvt.returnValue.ok, true);
    const fileDirent = readdirSyncEvt.returnValue.result.find(
      d => d && d.name === 'My Asset #1.txt'
    );
    assert.ok(fileDirent && fileDirent.__isDirent === true);
    assert.strictEqual(fileDirent.isFile, true);
    assert.strictEqual(fileDirent.isDirectory, false);

    // cliLoginEnv must not leak into normal IDE windows
    const getBootstrapSync = registeredIpcListeners.get(
      'desktop-get-bootstrap-data-sync'
    );
    const prevEmail = process.env.GDEVELOP_CLI_EMAIL;
    const prevPassword = process.env.GDEVELOP_CLI_PASSWORD;
    process.env.GDEVELOP_CLI_EMAIL = 'cli@example.com';
    process.env.GDEVELOP_CLI_PASSWORD = 'secret-password';
    try {
      const normalWinEvt = {};
      getBootstrapSync(normalWinEvt);
      assert.deepStrictEqual(normalWinEvt.returnValue.cliLoginEnv, {});

      const cliWinEvt = { sender: { args: { 'run-command': 'export' } } };
      getBootstrapSync(cliWinEvt);
      assert.deepStrictEqual(cliWinEvt.returnValue.cliLoginEnv, {
        GDEVELOP_CLI_EMAIL: 'cli@example.com',
        GDEVELOP_CLI_PASSWORD: 'secret-password',
      });
    } finally {
      if (prevEmail === undefined) delete process.env.GDEVELOP_CLI_EMAIL;
      else process.env.GDEVELOP_CLI_EMAIL = prevEmail;
      if (prevPassword === undefined) delete process.env.GDEVELOP_CLI_PASSWORD;
      else process.env.GDEVELOP_CLI_PASSWORD = prevPassword;
    }

    // buildNpmScriptSpawnConfig validation & injection defenses
    assert.throws(
      () =>
        buildNpmScriptSpawnConfig({
          projectPath: tmpRoot,
          npmScript: 'build && calc.exe',
          keepTerminalOpen: false,
          platform: 'win32',
        }),
      /Invalid npm script name/
    );
    assert.throws(
      () =>
        buildNpmScriptSpawnConfig({
          projectPath: tmpRoot,
          npmScript: 'build; rm -rf /',
          keepTerminalOpen: false,
          platform: 'linux',
        }),
      /Invalid npm script name/
    );
    const linuxNpmConfig = buildNpmScriptSpawnConfig({
      projectPath: tmpRoot,
      npmScript: 'build:desktop',
      keepTerminalOpen: false,
      platform: 'linux',
      failureMessage: 'oops "quoted" & failed',
    });
    assert.ok(Array.isArray(linuxNpmConfig.terminals));
    assert.strictEqual(linuxNpmConfig.terminals[0].cmd, 'x-terminal-emulator');
    assert.strictEqual(linuxNpmConfig.terminals[0].args[6], 'build:desktop');
    const winNpmConfig = buildNpmScriptSpawnConfig({
      projectPath: tmpRoot,
      npmScript: 'build:desktop',
      keepTerminalOpen: false,
      platform: 'win32',
      failureMessage: 'failed (paren) & calc',
    });
    assert.strictEqual(winNpmConfig.command, 'cmd.exe');
    assert.strictEqual(
      winNpmConfig.args[5].includes('failed paren  calc'),
      true
    );

    // PreviewWindow option/URL/path sanitization
    const sanitizedPreviewOpts = sanitizePreviewBrowserWindowOptions({
      width: 1280.4,
      height: 720,
      webPreferences: {
        preload: '/evil/preload.js',
        nodeIntegration: true,
        sandbox: false,
        webSecurity: false,
        contextIsolation: false,
        backgroundThrottling: true,
      },
    });
    assert.strictEqual(sanitizedPreviewOpts.width, 1280);
    assert.strictEqual(
      sanitizedPreviewOpts.webPreferences.nodeIntegration,
      false
    );
    assert.strictEqual(sanitizedPreviewOpts.webPreferences.sandbox, true);
    assert.strictEqual(sanitizedPreviewOpts.webPreferences.webSecurity, true);
    assert.strictEqual(
      sanitizedPreviewOpts.webPreferences.contextIsolation,
      true
    );
    assert.strictEqual(
      sanitizedPreviewOpts.webPreferences.preload,
      path.join(__dirname, '..', 'app', 'previewPreload.js')
    );
    assert.strictEqual(
      sanitizedPreviewOpts.webPreferences.backgroundThrottling,
      true
    );
    assert.throws(
      () => assertSafePreviewIndexUrl('file:///C:/game/index.html'),
      /Disallowed preview URL protocol/
    );
    assert.strictEqual(
      assertSafePreviewIndexUrl('gdevelop-file://local/C:/game/index.html'),
      'gdevelop-file://local/C:/game/index.html'
    );
    assert.throws(
      () => assertSafePreviewIndexUrl('https://evil.example/preview.html'),
      /Disallowed preview URL protocol/
    );
    assert.throws(
      () => assertSafePreviewIndexUrl('http://evil.example/preview.html'),
      /Disallowed preview remote host/
    );
    assert.strictEqual(
      assertSafePreviewIndexUrl('http://localhost:8080/index.html'),
      'http://localhost:8080/index.html'
    );
    assert.throws(
      () => assertSafePreviewIndexUrl('javascript:alert(1)'),
      /Disallowed preview URL protocol/
    );
    assert.throws(
      () =>
        assertSafePreviewFilePath(
          path.join(fakeElectron.app.getPath('userData'), 'open-projects.json')
        ),
      /Refused preview access to GDevelop IDE userData/
    );
    assert.throws(
      () =>
        assertSafePreviewFilePath(
          path.join(fakeElectron.app.getAppPath(), 'preview-write.txt'),
          { isWrite: true }
        ),
      /Refused preview write inside application bundle/
    );
    assert.ok(
      assertSafePreviewFilePath(
        path.join(
          fakeElectron.app.getPath('userData'),
          'PreviewUserData',
          'save.json'
        ),
        { isWrite: true }
      )
    );

    assert.throws(
      () =>
        assertSafePreviewFilePath(
          path.join(os.homedir(), 'Startup', 'payload.cmd'),
          { isWrite: true }
        ),
      /not authorized/
    );

    // LocalExternalEditorWindow supports independent concurrent sessions & destroyed parent
    const destroyedParent = { isDestroyed: () => true };
    const prevCount = FakeBrowserWindow.instances.length;
    const p1 = loadExternalEditorWindow({
      devTools: false,
      parentWindow: destroyedParent,
      indexSubPath: 'piskel/index.html',
      externalEditorInput: { id: 1 },
    });
    const p2 = loadExternalEditorWindow({
      devTools: false,
      parentWindow: destroyedParent,
      indexSubPath: 'jfxr/index.html',
      externalEditorInput: { id: 2 },
    });
    assert.strictEqual(FakeBrowserWindow.instances.length, prevCount + 2);
    const modal1 = FakeBrowserWindow.instances[prevCount];
    const modal2 = FakeBrowserWindow.instances[prevCount + 1];
    assert.strictEqual(modal1.options.modal, false);
    const saveHandlers =
      registeredIpcListeners.get('main:save-external-editor-output') || [];
    saveHandlers.forEach(fn =>
      fn({ sender: modal1.webContents }, { edited: 'first' })
    );
    saveHandlers.forEach(fn =>
      fn({ sender: modal2.webContents }, { edited: 'second' })
    );
    modal2.close();
    assert.strictEqual(
      modal1.options.webPreferences.session.partition,
      'persist:gdevelop-external-editors'
    );
    assert.ok(modal1.webContents.getURL().startsWith('gdide://external/'));
    const externalProtocol = registeredProtocols.get(
      'persist:gdevelop-external-editors:gdide'
    );
    assert.strictEqual(
      (await externalProtocol(makeMockRequest('gdide://app/index.html')))
        .status,
      403
    );
    modal1.close();
    assert.deepStrictEqual(await p2, { edited: 'second' });
    assert.deepStrictEqual(await p1, { edited: 'first' });

    // LocalFileDownloader uses provided session cookies rather than hardcoding defaultSession
    const appAxios = require(require.resolve('axios', {
      paths: [path.join(__dirname, '..', 'app')],
    }));
    const prevHttpGet = appAxios.get;
    const capturedHeaders = [];
    appAxios.get = async (_url, opts) => {
      capturedHeaders.push(opts.headers);
      throw new Error('STOP_AFTER_HEADER_CHECK');
    };
    const customSession = {
      cookies: {
        get: async () => [
          { name: 'gd_resource', value: 'custom-partition-cookie' },
        ],
      },
    };
    await assert.rejects(
      () =>
        downloadLocalFile(
          'https://resources.gdevelop.io/asset.png',
          path.join(tmpRoot, 'dl.png'),
          customSession
        ),
      /STOP_AFTER_HEADER_CHECK/
    );
    assert.deepStrictEqual(capturedHeaders[0], {
      Cookie: 'gd_resource=custom-partition-cookie',
    });
    appAxios.get = prevHttpGet;

    // LocalFilesystemWatcher calls watcher.close() on disable (not just unwatch)
    const chokidar = require(require.resolve('chokidar', {
      paths: [path.join(__dirname, '..', 'app')],
    }));
    const origWatch = chokidar.watch;
    let watcherClosed = false;
    let watcherUnwatched = false;
    chokidar.watch = () => {
      const fakeWatcher = {
        on: () => fakeWatcher,
        unwatch: () => {
          watcherUnwatched = true;
        },
        close: async () => {
          watcherClosed = true;
        },
      };
      return fakeWatcher;
    };
    const {
      setupWatcher,
      disableWatcher,
    } = require('../app/LocalFilesystemWatcher');
    const subId = setupWatcher(
      tmpRoot,
      () => {},
      JSON.stringify({ ignore: [] })
    );
    await disableWatcher(subId);
    chokidar.watch = origWatch;
    assert.strictEqual(watcherClosed, true);
    assert.strictEqual(watcherUnwatched, false);

    // 5. preload.js & externalEditorPreload.js checks
    const desktopApi = exposedApis.get('gdevelopDesktop');
    invokedIpcCalls.length = 0;
    await desktopApi.window.setTitlebarOverlayOptions(
      { color: '#111111', symbolColor: '#ffffff' },
      'window-42'
    );
    await desktopApi.readPublicCatalog('assetPacks');
    await desktopApi.dialog.pickProjectLocation('folder', '/tmp/workspace');
    assert.deepStrictEqual(invokedIpcCalls, [
      {
        channel: 'titlebar-set-overlay-options',
        args: [{ color: '#111111', symbolColor: '#ffffff' }, 'window-42'],
      },
      {
        channel: 'desktop-read-public-catalog',
        args: ['assetPacks'],
      },
      {
        channel: 'desktop-pick-project-location',
        args: ['folder', '/tmp/workspace'],
      },
    ]);
    assert.ok(desktopApi && Object.isFrozen(desktopApi));
    assert.strictEqual(desktopApi.ipcRenderer, undefined);
    assert.strictEqual(desktopApi.require, undefined);
    assert.throws(
      () => desktopApi.on('arbitrary-unlisted-channel', () => {}),
      /Disallowed desktop event channel/
    );

    const received = [];
    const unsubscribe = desktopApi.on('project-file-changed', (...args) =>
      received.push(args)
    );
    const receivedSecond = [];
    const unsubscribeSecond = desktopApi.on('project-file-changed', (...args) =>
      receivedSecond.push(args)
    );
    const wrappedListeners =
      registeredIpcListeners.get('renderer:project-file-changed') || [];
    assert.strictEqual(wrappedListeners.length, 2);
    wrappedListeners.forEach(fn =>
      fn({ sender: 'internal-ipc-event' }, '/path/game.json')
    );
    assert.deepStrictEqual(received, [['/path/game.json']]);
    assert.deepStrictEqual(receivedSecond, [['/path/game.json']]);
    unsubscribe();
    assert.strictEqual(
      (registeredIpcListeners.get('renderer:project-file-changed') || [])
        .length,
      1
    );
    unsubscribeSecond();
    assert.strictEqual(
      (registeredIpcListeners.get('renderer:project-file-changed') || [])
        .length,
      0
    );

    // Same callback registered twice independently keeps both until respective unsubscribe runs
    const sharedResults = [];
    const sharedCb = v => sharedResults.push(v);
    const unsubSharedA = desktopApi.on('project-file-changed', sharedCb);
    const unsubSharedB = desktopApi.on('project-file-changed', sharedCb);
    assert.strictEqual(
      (registeredIpcListeners.get('renderer:project-file-changed') || [])
        .length,
      2
    );
    unsubSharedA();
    assert.strictEqual(
      (registeredIpcListeners.get('renderer:project-file-changed') || [])
        .length,
      1
    );
    unsubSharedB();
    assert.strictEqual(
      (registeredIpcListeners.get('renderer:project-file-changed') || [])
        .length,
      0
    );

    // exitCode forwarding and ENOENT error.code preservation through preload.js
    sentIpcCalls.length = 0;
    desktopApi.app.exit(42);
    assert.deepStrictEqual(sentIpcCalls, [{ channel: 'app-exit', args: [42] }]);
    const missingEnvelope = await desktopApi.fs.readFile(
      '/non-existent',
      'utf8'
    );
    assert.strictEqual(missingEnvelope.ok, false);
    assert.strictEqual(missingEnvelope.error.code, 'ENOENT');

    const extEditorApi = exposedApis.get('gdevelopExternalEditor');
    assert.ok(extEditorApi && Object.isFrozen(extEditorApi));

    const previewBridgeApi = exposedApis.get('gdevelopPreview');
    assert.ok(previewBridgeApi && Object.isFrozen(previewBridgeApi));
    assert.strictEqual(previewBridgeApi.ipcRenderer, undefined);
    assert.strictEqual(previewBridgeApi.require, undefined);
    assert.throws(
      () => previewBridgeApi.windowCallSync('eval'),
      /Disallowed preview window method/
    );

    // Regression checks for PreviewWindow allowlist & destroyed-window guards,
    // UrlLoader dev path normalization, MainMenu & DesktopIpcHandlers destroyed guards.
    const {
      openPreviewWindow,
      closePreviewWindow,
    } = require('../app/PreviewWindow');
    const { load: loadUrlWithLoader } = require('../app/Utils/UrlLoader');
    const {
      buildElectronMenuFromDeclarativeTemplate,
    } = require('../app/MainMenu');
    const { attachWindowDesktopEvents } = require('../app/DesktopIpcHandlers');

    const previewOutsideDir = fs.mkdtempSync(
      path.join(os.tmpdir(), 'gd-sec-preview-outside-')
    );
    try {
      const outsideHtmlPath = path.join(previewOutsideDir, 'index.html');
      fs.writeFileSync(outsideHtmlPath, '<html>secret</html>', 'utf8');
      const allowedPreviewDir = path.join(tmpRoot, 'preview-export');
      fs.mkdirSync(allowedPreviewDir);
      const allowedHtmlPath = path.join(allowedPreviewDir, 'index.html');
      fs.writeFileSync(allowedHtmlPath, '<html>ok</html>', 'utf8');

      assert.throws(
        () =>
          openPreviewWindow({
            parentWindow: new FakeBrowserWindow(),
            previewBrowserWindowOptions: {},
            previewGameIndexHtmlPath: toGdevUrl(outsideHtmlPath),
            alwaysOnTop: false,
            hideMenuBar: false,
            numberOfWindows: 1,
            openEvent: null,
            temporaryDirectory: tmpRoot,
          }),
        /Expected a generated preview directory/
      );
      const destroyedParentForPreview = new FakeBrowserWindow();
      destroyedParentForPreview.destroy();
      const beforePreviewCount = FakeBrowserWindow.instances.length;
      openPreviewWindow({
        parentWindow: destroyedParentForPreview,
        previewBrowserWindowOptions: {},
        previewGameIndexHtmlPath: toGdevUrl(allowedHtmlPath),
        alwaysOnTop: true,
        hideMenuBar: false,
        numberOfWindows: 1,
        openEvent: null,
        temporaryDirectory: tmpRoot,
      });
      assert.strictEqual(
        FakeBrowserWindow.instances.length,
        beforePreviewCount + 1
      );
      const openedPreviewWin =
        FakeBrowserWindow.instances[FakeBrowserWindow.instances.length - 1];
      assert.strictEqual(openedPreviewWin.options.parent, null);
      const previewFsSync = registeredIpcListeners.get('preview-fs-sync');
      const previewRead = { sender: openedPreviewWin.webContents };
      await previewFsSync(previewRead, {
        op: 'readFileSync',
        args: [allowedHtmlPath, 'utf8'],
      });
      assert.deepStrictEqual(previewRead.returnValue, {
        ok: true,
        result: '<html>ok</html>',
      });
      const previewDenied = { sender: openedPreviewWin.webContents };
      await previewFsSync(previewDenied, {
        op: 'writeFileSync',
        args: [sampleFile, 'overwrite'],
      });
      assert.strictEqual(previewDenied.returnValue.error.code, 'EACCES');
      assert.strictEqual(fs.readFileSync(sampleFile, 'utf8'), 'hello-gdevelop');
      assert.strictEqual(
        openedPreviewWin.options.webPreferences.session.partition,
        'persist:gdevelop-preview'
      );
      const previewProtocol = registeredProtocols.get(
        'persist:gdevelop-preview:gdevelop-file'
      );
      assert.strictEqual(
        (await previewProtocol(makeMockRequest(toGdevUrl(allowedHtmlPath))))
          .status,
        200
      );
      // A file permitted to the editor must still be denied to game code.
      assert.strictEqual(
        (await previewProtocol(makeMockRequest(toGdevUrl(sampleFile)))).status,
        403
      );
      const secondDir = path.join(tmpRoot, 'second-preview');
      fs.mkdirSync(secondDir);
      const secondEntry = path.join(secondDir, 'index.html');
      fs.writeFileSync(secondEntry, 'second game');
      openPreviewWindow({
        previewBrowserWindowOptions: {},
        previewGameIndexHtmlPath: toGdevUrl(secondEntry),
        numberOfWindows: 1,
        temporaryDirectory: tmpRoot,
      });
      const secondWindow =
        FakeBrowserWindow.instances[FakeBrowserWindow.instances.length - 1];
      const secondPartition =
        secondWindow.options.webPreferences.session.partition;
      const secondProtocol = registeredProtocols.get(
        secondPartition + ':gdevelop-file'
      );
      assert.strictEqual(
        (await secondProtocol(makeMockRequest(toGdevUrl(secondEntry)))).status,
        200
      );
      assert.strictEqual(
        (await secondProtocol(makeMockRequest(toGdevUrl(allowedHtmlPath))))
          .status,
        403
      );
      assert.strictEqual(
        (await previewProtocol(makeMockRequest(toGdevUrl(secondEntry)))).status,
        403
      );
      closePreviewWindow(secondWindow.id);
      closePreviewWindow(openedPreviewWin.id);
      assert.strictEqual(
        (await previewProtocol(makeMockRequest(toGdevUrl(allowedHtmlPath))))
          .status,
        403
      );
    } finally {
      fs.rmSync(previewOutsideDir, { recursive: true, force: true });
    }

    // UrlLoader normalizes relative paths in isDev mode as well as production mode
    const devUrlWin = new FakeBrowserWindow();
    loadUrlWithLoader({
      isDev: true,
      devTools: false,
      path: 'external/piskel/index.html',
      window: devUrlWin,
    });
    assert.strictEqual(
      devUrlWin.webContents._url,
      'http://localhost:3000/external/piskel/index.html'
    );
    loadUrlWithLoader({
      isDev: true,
      devTools: false,
      path: '/index.html',
      window: devUrlWin,
    });
    assert.strictEqual(
      devUrlWin.webContents._url,
      'http://localhost:3000/index.html'
    );

    // MainMenu click does not crash when target window or webContents is destroyed
    const destroyedMenuWin = new FakeBrowserWindow();
    destroyedMenuWin.destroy();
    const builtMenu = buildElectronMenuFromDeclarativeTemplate(
      destroyedMenuWin,
      [
        {
          label: 'File',
          submenu: [{ label: 'Save', onClickSendEvent: 'main-menu-save' }],
        },
      ]
    );
    builtMenu.template[0].submenu[0].click();
    assert.strictEqual(destroyedMenuWin.webContents.sentMessages.length, 0);

    // DesktopIpcHandlers window event listeners guard destroyed webContents
    const halfDestroyedWin = new FakeBrowserWindow();
    halfDestroyedWin.webContents.isDestroyed = () => true;
    setupDesktopIpcHandlers({
      isDev: true,
      getDefaultArgs: () => ({}),
      getWindowArgsForWebContents: () => null,
      resolveWindowByTargetId: () => null,
      mainWindows: [halfDestroyedWin],
    });
    attachWindowDesktopEvents(halfDestroyedWin);
    halfDestroyedWin.emit('focus');
    halfDestroyedWin.emit('blur');
    halfDestroyedWin.emit('enter-full-screen');
    halfDestroyedWin.emit('leave-full-screen');
    fakeElectron.app.emit('browser-window-focus', {}, halfDestroyedWin);
    fakeElectron.app.emit('browser-window-blur', {}, halfDestroyedWin);
    assert.strictEqual(halfDestroyedWin.webContents.sentMessages.length, 0);

    // 6. Security flags & @electron/remote audit in Electron source & manifests
    const electronRootPkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'package.json'), 'utf8')
    );
    const electronAppPkg = JSON.parse(
      fs.readFileSync(path.join(__dirname, '..', 'app', 'package.json'), 'utf8')
    );
    ['dependencies', 'devDependencies', 'optionalDependencies'].forEach(key => {
      assert.strictEqual(
        electronRootPkg[key] && electronRootPkg[key]['@electron/remote'],
        undefined
      );
      assert.strictEqual(
        electronAppPkg[key] && electronAppPkg[key]['@electron/remote'],
        undefined
      );
    });

    ['main.js', 'LocalExternalEditorWindow.js', 'PreviewWindow.js'].forEach(
      file => {
        const content = fs.readFileSync(
          path.join(__dirname, '..', 'app', file),
          'utf8'
        );
        assert.ok(
          /contextIsolation:\s*true/.test(content),
          `${file} must enforce contextIsolation: true`
        );
        assert.ok(
          /nodeIntegration:\s*false/.test(content),
          `${file} must enforce nodeIntegration: false`
        );
        assert.ok(
          /sandbox:\s*true/.test(content),
          `${file} must enforce sandbox: true`
        );
        assert.ok(
          /webSecurity:\s*true/.test(content),
          `${file} must enforce webSecurity: true`
        );
        assert.strictEqual(/@electron\/remote/.test(content), false);
        assert.strictEqual(/contextIsolation:\s*false/.test(content), false);
        assert.strictEqual(/nodeIntegration:\s*true/.test(content), false);
        assert.strictEqual(/webSecurity:\s*false/.test(content), false);
        assert.strictEqual(/sandbox:\s*false/.test(content), false);
      }
    );

    console.log('ALL ELECTRON SECURITY & BRIDGE ASSERTIONS PASSED');
  } finally {
    Module._load = originalLoad;
    fs.rmSync(tmpRoot, { recursive: true, force: true });
  }
};

run().catch(err => {
  console.error(err);
  process.exit(1);
});
