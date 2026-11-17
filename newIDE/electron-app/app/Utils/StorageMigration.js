const { BrowserWindow } = require('electron');
const fs = require('fs');
const { pathToFileURL } = require('url');

const migrations = new WeakMap();
const marker = 'gd-file-origin-migrated-v1';

// These functions run in an isolated browser world. Keep them self-contained.
async function readStorage() {
  const local = Object.keys(localStorage).map(key => [
    key,
    localStorage.getItem(key),
  ]);
  const databases = [];
  const supported = new Set([
    'gdevelop-cloud-project-autosave',
    'firebaseLocalStorageDb',
  ]);
  for (const info of await indexedDB.databases()) {
    if (!supported.has(info.name)) continue;
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(info.name);
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error('Legacy database is blocked.'));
    });
    try {
      const stores = [];
      for (const name of Array.from(db.objectStoreNames)) {
        const storeData = await new Promise((resolve, reject) => {
          const tx = db.transaction(name, 'readonly');
          const store = tx.objectStore(name);
          const data = {
            name,
            keyPath: store.keyPath,
            autoIncrement: store.autoIncrement,
            indexes: [],
            entries: [],
          };
          for (const indexName of Array.from(store.indexNames)) {
            const index = store.index(indexName);
            data.indexes.push({
              name: indexName,
              keyPath: index.keyPath,
              unique: index.unique,
              multiEntry: index.multiEntry,
            });
          }
          const cursor = store.openCursor();
          cursor.onsuccess = () => {
            const row = cursor.result;
            if (row) {
              data.entries.push([row.key, row.value]);
              row.continue();
            }
          };
          tx.oncomplete = () => resolve(data);
          tx.onerror = tx.onabort = () =>
            reject(tx.error || new Error('Reading legacy storage failed.'));
        });
        stores.push(storeData);
      }
      databases.push({ name: info.name, version: db.version, stores });
    } finally {
      db.close();
    }
  }
  return { local, databases };
}

async function mergeStorage(snapshot) {
  for (const [key, value] of snapshot.local) {
    if (localStorage.getItem(key) === null) localStorage.setItem(key, value);
  }
  for (const saved of snapshot.databases) {
    const existing = (await indexedDB.databases()).find(
      db => db.name === saved.name
    );
    const db = await new Promise((resolve, reject) => {
      const request = indexedDB.open(
        saved.name,
        Math.max(saved.version, existing ? existing.version : 0)
      );
      request.onupgradeneeded = () => {
        const db = request.result;
        for (const savedStore of saved.stores) {
          if (db.objectStoreNames.contains(savedStore.name)) continue;
          const store = db.createObjectStore(savedStore.name, {
            keyPath: savedStore.keyPath,
            autoIncrement: savedStore.autoIncrement,
          });
          for (const index of savedStore.indexes)
            store.createIndex(index.name, index.keyPath, index);
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
      request.onblocked = () =>
        reject(new Error('Destination database is blocked.'));
    });
    try {
      for (const savedStore of saved.stores) {
        await new Promise((resolve, reject) => {
          const tx = db.transaction(savedStore.name, 'readwrite');
          const store = tx.objectStore(savedStore.name);
          for (const [key, value] of savedStore.entries) {
            const existing = store.getKey(key);
            existing.onsuccess = () => {
              // Retried migrations must preserve newer data already saved at the destination.
              if (existing.result === undefined) {
                if (store.keyPath === null) store.put(value, key);
                else store.put(value);
              }
            };
          }
          tx.oncomplete = resolve;
          tx.onerror = tx.onabort = () =>
            reject(tx.error || new Error('Restoring storage failed.'));
        });
      }
    } finally {
      db.close();
    }
  }
}

const run = async ({ targetSession, legacyPath }) => {
  const windows = [];
  const open = async url => {
    const win = new BrowserWindow({
      show: false,
      webPreferences: {
        session: targetSession,
        nodeIntegration: false,
        sandbox: true,
        contextIsolation: true,
        webSecurity: true,
        javascript: false,
        images: false,
      },
    });
    windows.push(win);
    win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
    win.webContents.on('will-navigate', event => event.preventDefault());
    await win.loadURL(url);
    return win.webContents;
  };
  const execute = (contents, code) =>
    contents.executeJavaScriptInIsolatedWorld(1001, [{ code }]);
  try {
    const target = await open('gdide://app/__storage_migration__.html');
    if (
      await execute(
        target,
        `localStorage.getItem(${JSON.stringify(marker)}) === 'done'`
      )
    )
      return;
    if (fs.existsSync(legacyPath)) {
      const legacy = await open(pathToFileURL(legacyPath).href);
      const snapshot = await execute(legacy, `(${readStorage.toString()})()`);
      await execute(
        target,
        `(${mergeStorage.toString()})(${JSON.stringify(snapshot)})`
      );
    }
    await execute(
      target,
      `localStorage.setItem(${JSON.stringify(marker)}, 'done')`
    );
  } finally {
    windows.forEach(win => {
      if (!win.isDestroyed()) win.destroy();
    });
  }
};

const migrateLegacyStorage = options => {
  const { targetSession } = options;
  if (!migrations.has(targetSession)) {
    const pending = run(options).catch(error => {
      migrations.delete(targetSession);
      throw error;
    });
    migrations.set(targetSession, pending);
  }
  return migrations.get(targetSession);
};

module.exports = { migrateLegacyStorage };
