// @flow

const setupBrowserDesktopMock = () => {
  const originalWindowDescriptor = Object.getOwnPropertyDescriptor(
    global,
    'window'
  );
  if (typeof global.window === 'undefined') {
    (global: any).window = {};
  }
  return () => {
    if (global.window) {
      delete global.window.gdevelopDesktop;
    }
    if (!originalWindowDescriptor) {
      delete (global: any).window;
    }
  };
};

describe('DesktopService', () => {
  it('preserves filesystem error codes across the context bridge', async () => {
    const cleanupWindow = setupBrowserDesktopMock();
    try {
      const failure = {
        ok: false,
        error: { message: 'Access denied', code: 'EACCES', path: '/private' },
      };
      global.window.gdevelopDesktop = {
        fs: {
          readFileSync: () => failure,
          readFile: () => Promise.resolve(failure),
        },
      };
      const fs = require('./DesktopService').getFs();
      if (!fs) throw new Error('Expected the desktop filesystem bridge.');
      expect(() => fs.readFileSync('/private')).toThrow('Access denied');
      try {
        fs.readFileSync('/private');
      } catch (error) {
        expect(error.code).toBe('EACCES');
        expect(error.path).toBe('/private');
      }
      await expect(fs.promises.readFile('/private')).rejects.toMatchObject({
        code: 'EACCES',
        path: '/private',
      });
    } finally {
      cleanupWindow();
    }
  });
  afterEach(() => {
    jest.resetModules();
    jest.clearAllMocks();
  });

  describe('Pure Web fallback (no window.gdevelopDesktop, no Electron/Node)', () => {
    it('returns safe non-desktop defaults and resolves async bridges gracefully', async () => {
      const cleanupWindow = setupBrowserDesktopMock();
      try {
        jest.doMock('./OptionalRequire', () => jest.fn(() => null));
        jest.doMock('./OptionalLazyRequire', () => jest.fn(() => () => null));
        const DesktopService = require('./DesktopService');

        expect(DesktopService.isDesktop()).toBe(false);
        expect(DesktopService.getWindowId()).toBe(0);
        expect(DesktopService.getPath()).toBeNull();
        expect(DesktopService.getFs()).toBeNull();
        expect(DesktopService.getUserInfo()).toBeNull();
        expect(DesktopService.getAppPathSync('userData')).toBe('');
        expect(await DesktopService.getAppPathAsync('userData')).toBeNull();
        expect(await DesktopService.getGPUInfo()).toBeNull();
        expect(await DesktopService.cli.readStdin()).toBe('');
        expect(await DesktopService.cli.installInPath()).toBe(false);
        await expect(DesktopService.preview.open({})).rejects.toThrow(
          'Desktop preview is not supported.'
        );
        await expect(DesktopService.preview.close({})).resolves.toBeUndefined();
        await expect(
          DesktopService.popupMenu([], {
            left: 0,
            top: 0,
            width: 10,
            height: 10,
          })
        ).resolves.toBeUndefined();

        const unsubscribe = DesktopService.onIpcEvent('some-event', () => {});
        expect(typeof unsubscribe).toBe('function');
        expect(() => unsubscribe()).not.toThrow();
      } finally {
        cleanupWindow();
      }
    });
  });

  describe('getLocalFileUrl', () => {
    it('converts Windows and POSIX paths into encoded gdevelop-file://local URLs', () => {
      jest.doMock('./OptionalRequire', () => jest.fn(() => null));
      jest.doMock('./OptionalLazyRequire', () => jest.fn(() => () => null));
      const { getLocalFileUrl } = require('./DesktopService');

      expect(getLocalFileUrl('')).toBe('');
      expect(getLocalFileUrl('C:\\Users\\My Game\\sprite #1 (100%).png')).toBe(
        'gdevelop-file://local/C:/Users/My%20Game/sprite%20%231%20(100%25).png'
      );
      expect(getLocalFileUrl('/home/dev/assets/tile map#2.png')).toBe(
        'gdevelop-file://local/home/dev/assets/tile%20map%232.png'
      );
      expect(getLocalFileUrl('https://example.com/a.png')).toBe(
        'https://example.com/a.png'
      );
      expect(getLocalFileUrl('gdevelop-file://local/C:/a.png')).toBe(
        'gdevelop-file://local/C:/a.png'
      );
      expect(getLocalFileUrl('data:image/png;base64,AAAA')).toBe(
        'data:image/png;base64,AAAA'
      );
    });
  });

  describe('Preload bridge edge cases (Dirent, getAppPathSync, titlebar targetId)', () => {
    it('rehydrates serialized Dirent methods, falls back safely on empty/throwing getAppPathSync, and forwards titlebar targetId', async () => {
      const cleanupWindow = setupBrowserDesktopMock();
      const setTitlebarOverlayOptionsMock = jest.fn(() => undefined);
      const getPathSyncMock = jest.fn((name: string) => {
        if (name === 'documents') {
          throw new Error('Failed to get documents path');
        }
        return '/fallback/' + name;
      });
      const fakeDirent = {
        __isDirent: true,
        name: 'sprites',
        parentPath: '/proj',
        isDirectory: true,
        isFile: false,
        isSymbolicLink: false,
        isFIFO: false,
        isSocket: false,
        isCharacterDevice: false,
        isBlockDevice: false,
      };
      (global: any).window.gdevelopDesktop = {
        getBootstrapData: () => ({
          isDev: false,
          platform: 'linux',
          arch: 'x64',
          systemVersion: '1.0',
          pid: 123,
          appPath: '/app',
          cwd: '/app',
          windowId: 1,
          paths: { home: '/home/dev', documents: '' },
          userInfo: { uid: 1000, username: 'dev' },
          args: {},
          cliLoginEnv: {},
          isFullScreen: false,
        }),
        fs: {
          readdir: jest.fn(async () => [fakeDirent]),
          readdirSync: jest.fn(() => [fakeDirent]),
        },
        app: {
          getPathSync: getPathSyncMock,
        },
        window: {
          setTitlebarOverlayOptions: setTitlebarOverlayOptionsMock,
        },
        on: jest.fn(() => () => {}),
        removeAllListeners: jest.fn(() => undefined),
      };

      try {
        jest.doMock('./OptionalRequire', () => jest.fn(() => null));
        jest.doMock('./OptionalLazyRequire', () => jest.fn(() => () => null));
        const DesktopService = require('./DesktopService');

        expect(DesktopService.getAppPathSync('documents')).toBe('');
        expect(getPathSyncMock).not.toHaveBeenCalled();
        expect(DesktopService.getAppPathSync('temp')).toBe('/fallback/temp');
        getPathSyncMock.mockImplementationOnce(() => {
          throw new Error('unavailable');
        });
        expect(DesktopService.getAppPathSync('music')).toBe('');

        const fs = DesktopService.getFs();
        expect(fs).not.toBeNull();
        if (fs) {
          const asyncEntries = await fs.promises.readdir('/proj', {
            withFileTypes: true,
          });
          expect(asyncEntries[0].name).toBe('sprites');
          expect(asyncEntries[0].isDirectory()).toBe(true);
          expect(asyncEntries[0].isFile()).toBe(false);

          const syncEntries = fs.readdirSync('/proj', {
            withFileTypes: true,
          });
          expect(syncEntries[0].isDirectory()).toBe(true);
          expect(syncEntries[0].isSymbolicLink()).toBe(false);
        }

        DesktopService.setTitlebarOverlayOptions({
          color: '#111111',
          symbolColor: '#ffffff',
        });
        expect(setTitlebarOverlayOptionsMock).toHaveBeenCalledWith({
          color: '#111111',
          symbolColor: '#ffffff',
        });

        DesktopService.setTitlebarOverlayOptions({
          color: '#222222',
          symbolColor: '#000000',
          targetId: 'portal-2',
        });
        expect(setTitlebarOverlayOptionsMock).toHaveBeenCalledWith(
          { color: '#222222', symbolColor: '#000000' },
          'portal-2'
        );
      } finally {
        cleanupWindow();
      }
    });
  });

  describe('Context-isolated preload bridge (window.gdevelopDesktop)', () => {
    it('routes bootstrap metadata, DesktopPath, wrapped fs, popupMenu, and IPC listeners', async () => {
      const cleanupWindow = setupBrowserDesktopMock();
      const unsubMock = jest.fn(() => undefined);
      const onMock = jest.fn(() => unsubMock);
      const removeAllListenersMock = jest.fn(() => undefined);
      const openPathMock = jest.fn(async () => {
        throw new Error('Blocked executable');
      });
      const setTitleMock = jest.fn(async () => {
        throw new Error('Window destroyed');
      });
      const showEditContextMenuMock = jest.fn(async () => undefined);
      const popupMenuMock = jest.fn(
        async ({
          template,
        }: {
          template: Array<any>,
          x: number,
          y: number,
          targetId?: string,
        }) => {
          return { clickedActionId: template[1].submenu[0].actionId };
        }
      );
      const readFileMock = jest.fn(
        async () => new Uint8Array([72, 105, 33]) // "Hi!"
      );
      const statMock = jest.fn(async () => ({
        isDirectory: false,
        isFile: true,
        isSymbolicLink: false,
        size: 3,
        mtimeMs: 1700000000000,
      }));
      const readFileSyncMock = jest.fn(
        () => new Uint8Array([65, 66]) // "AB"
      );

      global.window.gdevelopDesktop = {
        getBootstrapData: () => ({
          isDev: false,
          platform: 'win32',
          arch: 'x64',
          systemVersion: '10.0.22631',
          pid: 4321,
          appPath: 'C:\\Program Files\\GDevelop',
          cwd: 'C:\\Users\\Dev\\Projects',
          windowId: 7,
          paths: { temp: 'C:\\Temp', userData: 'C:\\Users\\Dev\\AppData' },
          userInfo: { uid: -1, username: 'dev' },
          args: { _: ['game.json'] },
          cliLoginEnv: { GDEVELOP_CLI: '1' },
          isFullScreen: false,
        }),
        fs: {
          readFile: readFileMock,
          readFileSync: readFileSyncMock,
          stat: statMock,
          lstat: statMock,
          writeFile: jest.fn(),
          outputFile: jest.fn(async () => undefined),
          copyFile: jest.fn(),
          copy: jest.fn(),
          ensureDir: jest.fn(async () => undefined),
          mkdir: jest.fn(),
          readdir: jest.fn(async () => ['game.json']),
          access: jest.fn(),
          exists: jest.fn(async () => true),
          unlink: jest.fn(),
          remove: jest.fn(),
          emptyDir: jest.fn(),
          writeFileSync: jest.fn(),
          outputFileSync: jest.fn(),
          copyFileSync: jest.fn(),
          copySync: jest.fn(),
          mkdirSync: jest.fn(),
          mkdirsSync: jest.fn(),
          ensureDirSync: jest.fn(),
          emptyDirSync: jest.fn(),
          removeSync: jest.fn(),
          unlinkSync: jest.fn(),
          readdirSync: jest.fn(() => []),
          statSync: jest.fn(() => ({
            isDirectory: true,
            isFile: false,
            isSymbolicLink: false,
            size: 0,
            mtimeMs: 1700000000000,
          })),
          lstatSync: jest.fn(),
          accessSync: jest.fn(),
          existsSync: jest.fn(() => true),
          realpathSync: jest.fn(p => p),
          archiveFolder: jest.fn(),
          glob: jest.fn(),
        },
        app: {
          getPathSync: jest.fn(() => ''),
          getPath: jest.fn(async () => 'C:\\Docs'),
          getGPUInfo: jest.fn(async () => ({ gpu: 'ok' })),
          getArgumentsSync: jest.fn(() => ({ project: 'game.json' })),
          quit: jest.fn(),
          exit: jest.fn(),
        },
        window: {
          setTitle: setTitleMock,
        },
        shell: {
          openPath: openPathMock,
        },
        menu: {
          setMainMenu: jest.fn(),
          showEditContextMenu: showEditContextMenuMock,
          popupMenu: popupMenuMock,
        },
        on: onMock,
        removeAllListeners: removeAllListenersMock,
      };

      try {
        jest.doMock('./OptionalRequire', () => jest.fn(() => null));
        jest.doMock('./OptionalLazyRequire', () => jest.fn(() => () => null));
        const DesktopService = require('./DesktopService');

        expect(DesktopService.isDesktop()).toBe(true);
        expect(DesktopService.isDev()).toBe(false);
        expect(DesktopService.getWindowId()).toBe(7);
        expect(DesktopService.getPlatform()).toBe('win32');
        expect(DesktopService.getArch()).toBe('x64');
        expect(DesktopService.getSystemVersion()).toBe('10.0.22631');
        expect(DesktopService.getPid()).toBe(4321);
        expect(DesktopService.getCwd()).toBe('C:\\Users\\Dev\\Projects');
        expect(DesktopService.getAppPath()).toBe('C:\\Program Files\\GDevelop');
        expect(DesktopService.getAppPathSync('userData')).toBe(
          'C:\\Users\\Dev\\AppData'
        );
        expect(DesktopService.getTmpDir()).toBe('C:\\Temp');
        expect(DesktopService.getUserInfo()).toEqual({
          uid: -1,
          username: 'dev',
        });
        expect(DesktopService.getArguments()).toEqual({ project: 'game.json' });

        // Uses pure-JS Win32 DesktopPath without requiring Node `path`.
        const bridgedPath = DesktopService.getPath();
        expect(bridgedPath).not.toBeNull();
        if (bridgedPath) {
          expect(bridgedPath.sep).toBe('\\');
          expect(bridgedPath.join('C:\\Games', 'assets', 'hero.png')).toBe(
            'C:\\Games\\assets\\hero.png'
          );
          expect(bridgedPath.posix.join('/a', 'b')).toBe('/a/b');
        }

        // Wrapped fs converts Uint8Array into Buffer-like toString encodings and stats dates.
        const bridgedFs = DesktopService.getFs();
        expect(bridgedFs).not.toBeNull();
        if (bridgedFs) {
          const binaryData = await bridgedFs.promises.readFile('C:\\test.txt');
          expect(binaryData.toString()).toBe('Hi!');
          expect(binaryData.toString('utf8')).toBe('Hi!');
          expect(binaryData.toString('hex')).toBe('486921');
          expect(binaryData.toString('latin1')).toBe('Hi!');

          const syncBinary = bridgedFs.readFileSync('C:\\ab.bin');
          expect(syncBinary.toString('utf8')).toBe('AB');
          expect(syncBinary.toString('utf8', 0, 1)).toBe('A');
          expect(binaryData.toString('utf8', 1, 3)).toBe('i!');

          const stats = await bridgedFs.promises.stat('C:\\test.txt');
          expect(stats.isFile()).toBe(true);
          expect(stats.isDirectory()).toBe(false);
          expect(stats.mtime instanceof Date).toBe(true);
          expect(stats.mtime.getTime()).toBe(1700000000000);

          const syncStats = bridgedFs.statSync('C:\\dir');
          expect(syncStats.isDirectory()).toBe(true);

          await new Promise((resolve, reject) => {
            bridgedFs.stat('C:\\test.txt', (err, cbStats) => {
              if (err) reject(err);
              else {
                expect(cbStats.size).toBe(3);
                resolve();
              }
            });
          });
        }

        // popupMenu strips click functions, assigns actionIds, and triggers nested submenu callback.
        const rootClick = jest.fn(() => undefined);
        const nestedClick = jest.fn(() => undefined);
        await DesktopService.popupMenu(
          [
            { label: 'Root', click: rootClick },
            {
              label: 'More',
              submenu: [{ label: 'Nested', click: nestedClick, enabled: true }],
            },
          ],
          { left: 10.4, top: 20, width: 100, height: 30.6 },
          'GDevelopWindowPortal3'
        );
        expect(popupMenuMock).toHaveBeenCalledTimes(1);
        const callArgs = popupMenuMock.mock.calls[0][0];
        expect(callArgs.x).toBe(10);
        expect(callArgs.y).toBe(51);
        expect(callArgs.targetId).toBe('GDevelopWindowPortal3');
        expect(callArgs.template[0].click).toBeUndefined();
        expect(typeof callArgs.template[0].actionId).toBe('string');
        expect(rootClick).not.toHaveBeenCalled();
        expect(nestedClick).toHaveBeenCalledTimes(1);

        DesktopService.showEditContextMenu('GDevelopWindowPortal3');
        expect(showEditContextMenuMock).toHaveBeenCalledWith(
          'GDevelopWindowPortal3'
        );

        // Fire-and-forget async wrappers attach .catch handlers so IPC rejections do not crash.
        DesktopService.setWindowTitle('Demo');
        DesktopService.openPath('C:\\tool.exe');
        await new Promise(resolve => setTimeout(resolve, 0));

        expect(
          DesktopService.getLocalFileUrl(
            'file:///C:/Users/Dev/my%20file.png?v=2'
          )
        ).toBe('gdevelop-file://local/C:/Users/Dev/my%20file.png?v=2');
        expect(
          DesktopService.getLocalFileUrl(
            'file://localhost/Users/dev/hero%201.png'
          )
        ).toBe('gdevelop-file://local/Users/dev/hero%201.png');
        expect(
          DesktopService.getLocalFileUrl('file://nas/share/dir/my%20art.png')
        ).toBe('gdevelop-file://local//nas/share/dir/my%20art.png');
        expect(
          DesktopService.getLocalFileUrl('\\\\nas\\share\\dir\\hero image.png')
        ).toBe('gdevelop-file://local//nas/share/dir/hero%20image.png');
        expect(
          DesktopService.getLocalFileUrl('gdevelop-file://local/C:/already.png')
        ).toBe('gdevelop-file://local/C:/already.png');

        const listener = jest.fn((...args: Array<any>) => undefined);
        const unsubscribe = DesktopService.onIpcEvent(
          'update-status',
          listener
        );
        expect(onMock).toHaveBeenCalledWith('update-status', listener);
        unsubscribe();
        expect(unsubMock).toHaveBeenCalledTimes(1);
        DesktopService.removeAllIpcListeners('update-status');
        expect(removeAllListenersMock).toHaveBeenCalledWith('update-status');
      } finally {
        cleanupWindow();
      }
    });
  });

  describe('Node / Jest optionalRequire fallback across jest resetMocks', () => {
    it('preserves initial mocked modules when optionalRequire returns undefined after reset', () => {
      const cleanupWindow = setupBrowserDesktopMock();
      try {
        const ipcRendererOnMock = jest.fn(
          (_channel: string, _handler: (...args: Array<any>) => any) =>
            undefined
        );
        const ipcRendererRemoveListenerMock = jest.fn(
          (_channel: string, _handler: (...args: Array<any>) => any) =>
            undefined
        );
        const fakeElectron = {
          ipcRenderer: {
            on: ipcRendererOnMock,
            removeListener: ipcRendererRemoveListenerMock,
            removeAllListeners: jest.fn(() => undefined),
            invoke: jest.fn(async () => 'invoked'),
          },
        };
        const fakeFs = { readFileSync: jest.fn(() => 'content') };
        const fakePath = {
          sep: '/',
          join: (...parts: Array<string>) => parts.join('/'),
        };

        const mockOptionalRequire = jest.fn((name: string) => {
          if (name === 'electron') return fakeElectron;
          if (name === 'fs' || name === 'fs-extra') return fakeFs;
          if (name === 'path') return fakePath;
          return null;
        });

        jest.doMock('./OptionalRequire', () => mockOptionalRequire);
        jest.doMock('./OptionalLazyRequire', () => jest.fn(() => () => null));
        const DesktopService = require('./DesktopService');

        // Simulate Jest's `resetMocks: true` clearing optionalRequire's implementation.
        mockOptionalRequire.mockReset();
        expect(mockOptionalRequire('electron')).toBeUndefined();

        expect(DesktopService.isDesktop()).toBe(true);
        expect(DesktopService.getPath()).toBe(fakePath);
        expect(DesktopService.getFs()).toBe(fakeFs);

        const cb = jest.fn((...args: Array<any>) => undefined);
        const unsubscribe = DesktopService.onIpcEvent('test-event', cb);
        expect(ipcRendererOnMock).toHaveBeenCalledTimes(1);
        const wrappedHandler = ipcRendererOnMock.mock.calls[0][1];
        wrappedHandler({ sender: 'electron' }, 'arg1', 42);
        expect(cb).toHaveBeenCalledWith('arg1', 42);

        unsubscribe();
        expect(ipcRendererRemoveListenerMock).toHaveBeenCalledWith(
          'test-event',
          wrappedHandler
        );
      } finally {
        cleanupWindow();
      }
    });
  });

  describe('readPublicCatalog & pickProjectLocation', () => {
    it('routes readPublicCatalog through preload only on gdide: protocol and falls back to HTTP otherwise', async () => {
      const cleanupWindow = setupBrowserDesktopMock();
      const originalLocationDescriptor = Object.getOwnPropertyDescriptor(
        global.window,
        'location'
      );
      const readPublicCatalogMock = jest.fn(async (name: string) => [
        { id: `bridged-${name}` },
      ]);
      const httpFallback = jest.fn(async () => [{ id: 'http-fallback' }]);

      try {
        jest.doMock('./OptionalRequire', () => jest.fn(() => null));
        jest.doMock('./OptionalLazyRequire', () => jest.fn(() => () => null));
        const DesktopServiceModule = require('./DesktopService');
        const DesktopServiceDefault = DesktopServiceModule.default;

        // Pure web fallback (no window.gdevelopDesktop)
        expect(
          await DesktopServiceModule.readPublicCatalog(
            'assetPacks',
            httpFallback
          )
        ).toEqual([{ id: 'http-fallback' }]);
        expect(httpFallback).toHaveBeenCalledTimes(1);

        // Desktop preload present, but without window.location defined
        global.window.gdevelopDesktop = {
          readPublicCatalog: readPublicCatalogMock,
        };
        expect(
          await DesktopServiceDefault.readPublicCatalog(
            'releases',
            httpFallback
          )
        ).toEqual([{ id: 'http-fallback' }]);
        expect(readPublicCatalogMock).not.toHaveBeenCalled();

        // Desktop dev server (http: protocol) must still use HTTP fallback
        Object.defineProperty(global.window, 'location', {
          configurable: true,
          value: { protocol: 'http:' },
        });
        expect(
          await DesktopServiceModule.readPublicCatalog(
            'showcasedGames',
            httpFallback
          )
        ).toEqual([{ id: 'http-fallback' }]);
        expect(readPublicCatalogMock).not.toHaveBeenCalled();
        expect(httpFallback).toHaveBeenCalledTimes(3);

        // Packaged desktop editor (gdide: protocol) must use preload bridge
        Object.defineProperty(global.window, 'location', {
          configurable: true,
          value: { protocol: 'gdide:' },
        });
        expect(
          await DesktopServiceModule.readPublicCatalog(
            'assetPacks',
            httpFallback
          )
        ).toEqual([{ id: 'bridged-assetPacks' }]);
        expect(
          await DesktopServiceDefault.readPublicCatalog(
            'gameCategories',
            httpFallback
          )
        ).toEqual([{ id: 'bridged-gameCategories' }]);
        expect(readPublicCatalogMock).toHaveBeenCalledTimes(2);
        expect(readPublicCatalogMock).toHaveBeenNthCalledWith(1, 'assetPacks');
        expect(readPublicCatalogMock).toHaveBeenNthCalledWith(
          2,
          'gameCategories'
        );
        expect(httpFallback).toHaveBeenCalledTimes(3);

        // Non-function readPublicCatalog on desktop bridge falls back to HTTP
        global.window.gdevelopDesktop = {
          readPublicCatalog: 'not-a-function',
        };
        expect(
          await DesktopServiceModule.readPublicCatalog(
            'assetPacks',
            httpFallback
          )
        ).toEqual([{ id: 'http-fallback' }]);
        expect(httpFallback).toHaveBeenCalledTimes(4);
      } finally {
        if (originalLocationDescriptor) {
          Object.defineProperty(
            global.window,
            'location',
            originalLocationDescriptor
          );
        } else if (global.window) {
          delete global.window.location;
        }
        cleanupWindow();
      }
    });

    it('delegates pickProjectLocation for file and folder modes and falls back to null on web', async () => {
      const cleanupWindow = setupBrowserDesktopMock();
      const pickProjectLocationMock = jest.fn(
        async (kind: 'file' | 'folder'): Promise<?string> =>
          kind === 'file' ? '/projects/demo/game.json' : '/projects/workspace'
      );

      try {
        jest.doMock('./OptionalRequire', () => jest.fn(() => null));
        jest.doMock('./OptionalLazyRequire', () => jest.fn(() => () => null));
        const DesktopServiceModule = require('./DesktopService');
        const DesktopServiceDefault = DesktopServiceModule.default;

        // Pure web fallback
        expect(
          await DesktopServiceModule.pickProjectLocation('file', '/default')
        ).toBeNull();
        expect(
          await DesktopServiceDefault.pickProjectLocation('folder', '/default')
        ).toBeNull();

        // Desktop bridge present
        global.window.gdevelopDesktop = {
          dialog: {
            pickProjectLocation: pickProjectLocationMock,
          },
        };
        expect(
          await DesktopServiceModule.pickProjectLocation('file', '/last/dir')
        ).toBe('/projects/demo/game.json');
        expect(
          await DesktopServiceDefault.pickProjectLocation(
            'folder',
            '/last/workspace'
          )
        ).toBe('/projects/workspace');
        expect(pickProjectLocationMock).toHaveBeenNthCalledWith(
          1,
          'file',
          '/last/dir'
        );
        expect(pickProjectLocationMock).toHaveBeenNthCalledWith(
          2,
          'folder',
          '/last/workspace'
        );

        // Canceled dialog returns null
        pickProjectLocationMock.mockImplementationOnce(async () => null);
        expect(
          await DesktopServiceModule.pickProjectLocation('folder')
        ).toBeNull();

        // Missing or non-function pickProjectLocation on desktop bridge falls back to null
        global.window.gdevelopDesktop = { dialog: {} };
        expect(
          await DesktopServiceModule.pickProjectLocation('file')
        ).toBeNull();
        global.window.gdevelopDesktop = {
          dialog: { pickProjectLocation: 'not-a-function' },
        };
        expect(
          await DesktopServiceDefault.pickProjectLocation('folder')
        ).toBeNull();
      } finally {
        cleanupWindow();
      }
    });
  });
});
