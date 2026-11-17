// Run with Electron. Uses a disposable profile and hidden windows only.
const { app, BrowserWindow, protocol, session } = require('electron');
const assert = require('assert');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { pathToFileURL } = require('url');
const root = fs.mkdtempSync(path.join(os.tmpdir(), 'gd-storage-migration-'));
app.setPath('userData', path.join(root, 'profile'));
protocol.registerSchemesAsPrivileged([
  {
    scheme: 'gdide',
    privileges: { standard: true, secure: true, supportFetchAPI: true },
  },
]);
app.on('window-all-closed', () => {});
app
  .whenReady()
  .then(async () => {
    const { migrateLegacyStorage } = require('../app/Utils/StorageMigration');
    const legacyPath = path.join(root, 'legacy.html');
    fs.writeFileSync(legacyPath, '<html></html>');
    protocol.handle(
      'gdide',
      () =>
        new Response('<html></html>', {
          headers: { 'content-type': 'text/html' },
        })
    );
    const old = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    await old.loadURL(pathToFileURL(legacyPath).href);
    await old.webContents.executeJavaScript(`(async () => {
    localStorage.setItem('gd-preferences', '{"theme":"dark"}');
    await new Promise((resolve, reject) => {
      const r = indexedDB.open('gdevelop-cloud-project-autosave', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('cloud-project-autosaves', { keyPath: 'userProjectKey' });
      r.onerror = () => reject(r.error);
      r.onsuccess = () => {
        const db = r.result, tx = db.transaction('cloud-project-autosaves', 'readwrite');
        tx.objectStore('cloud-project-autosaves').put({userProjectKey:'user/project', project:'unsaved work', createdAt:123});
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  })()`);
    old.destroy();
    await migrateLegacyStorage({
      targetSession: session.defaultSession,
      legacyPath,
    });
    const current = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
      },
    });
    await current.loadURL('gdide://app/__storage_migration__.html');
    assert.strictEqual(
      await current.webContents.executeJavaScript(
        "localStorage.getItem('gd-preferences')"
      ),
      '{"theme":"dark"}'
    );
    const cached = await current.webContents
      .executeJavaScript(`new Promise((resolve,reject) => {
    const r = indexedDB.open('gdevelop-cloud-project-autosave');
    r.onsuccess = () => {const db=r.result;const q=db.transaction('cloud-project-autosaves').objectStore('cloud-project-autosaves').get('user/project');q.onsuccess=()=>{db.close();resolve(q.result)};q.onerror=()=>reject(q.error)};
    r.onerror=()=>reject(r.error);
  })`);
    assert.strictEqual(cached.project, 'unsaved work');
    await current.webContents.executeJavaScript(
      "localStorage.setItem('gd-preferences','newer')"
    );
    // Simulate a fresh process with a partially completed migration, not the
    // in-memory promise cache. Destination changes must survive a retry.
    await current.webContents.executeJavaScript(
      "localStorage.removeItem('gd-file-origin-migrated-v1')"
    );
    delete require.cache[require.resolve('../app/Utils/StorageMigration')];
    await require('../app/Utils/StorageMigration').migrateLegacyStorage({
      targetSession: session.defaultSession,
      legacyPath,
    });
    assert.strictEqual(
      await current.webContents.executeJavaScript(
        "localStorage.getItem('gd-preferences')"
      ),
      'newer'
    );
    current.destroy();
    // Exercise the actual sandbox preload and delayed synchronous IPC reply.
    const { createFileAccessPolicy } = require('../app/Utils/FileAccessPolicy');
    const { createAuthorizedIpc } = require('../app/Utils/AuthorizedIpc');
    const { ipcMain } = require('electron');
    const mainWindows = new Set();
    const ipc = createAuthorizedIpc(
      ipcMain,
      event =>
        event.senderFrame === event.sender.mainFrame &&
        Array.from(mainWindows).some(win => win.webContents === event.sender)
    );
    require('../app/DesktopIpcHandlers').setupDesktopIpcHandlers({
      isDev: false,
      mainWindows,
      ipc,
      getDefaultArgs: () => ({}),
      fileAccessPolicy: createFileAccessPolicy({ writeRoots: [root] }),
    });
    const editor = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.resolve(__dirname, '../app/preload.js'),
      },
    });
    mainWindows.add(editor);
    await editor.loadURL('gdide://app/__storage_migration__.html');
    const content = await editor.webContents.executeJavaScript(
      `window.gdevelopDesktop.fs.readFileSync(${JSON.stringify(
        legacyPath
      )}, 'utf8')`
    );
    assert.strictEqual(content.ok, true);
    assert.strictEqual(content.result, '<html></html>');
    const missingPath = path.join(root, 'missing.txt');
    const missing = await editor.webContents.executeJavaScript(
      `window.gdevelopDesktop.fs.readFileSync(${JSON.stringify(
        missingPath
      )}, 'utf8')`
    );
    assert.strictEqual(missing.error.code, 'ENOENT');
    assert.strictEqual(missing.error.path, missingPath);
    const denied = await editor.webContents.executeJavaScript(
      `window.gdevelopDesktop.fs.readFile(${JSON.stringify(
        path.join(os.homedir(), '.ssh', 'id_rsa')
      )}, 'utf8').then(response=>!response.ok && response.error.code === 'EACCES')`
    );
    assert.strictEqual(denied, true);
    editor.destroy();
    // Steam identifiers are BigInts. Verify structured-clone and contextBridge
    // transport with the real sandbox preload, not only Node mocks.
    ipcMain.on('preview-steam-sync', event => {
      event.returnValue = {
        ok: true,
        result: { steamId64: 76561198000000000n },
      };
    });
    const preview = new BrowserWindow({
      show: false,
      webPreferences: {
        sandbox: true,
        contextIsolation: true,
        nodeIntegration: false,
        preload: path.resolve(__dirname, '../app/previewPreload.js'),
      },
    });
    await preview.loadURL('gdide://app/__storage_migration__.html');
    assert.strictEqual(
      await preview.webContents.executeJavaScript(
        "window.gdevelopPreview.steam.call('localplayer.getSteamId', []).steamId64.toString()"
      ),
      '76561198000000000'
    );
    preview.destroy();
    console.log('Storage migration integration assertions passed.');
    app.exit(0);
  })
  .catch(error => {
    console.error(error);
    app.exit(1);
  });
setTimeout(() => {
  console.error('Storage migration test timed out');
  app.exit(1);
}, 60000).unref();
