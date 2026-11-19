import BrowserS3PreviewLauncher from './BrowserExporters/BrowserS3PreviewLauncher';
import LocalPreviewLauncher from './LocalExporters/LocalPreviewLauncher';
import { uploadObjects } from '../Utils/GDevelopServices/Preview';
import BrowserSWPreviewLauncher from './BrowserExporters/BrowserSWPreviewLauncher';
import { findGDJS } from '../GameEngineFinder/BrowserS3GDJSFinder';
import { browserPreviewDebuggerServer as debuggerServer } from './BrowserExporters/BrowserPreview/BrowserPreviewDebuggerServer';
import { setGameplayTestFramePreviewLocation } from '../GameplayTests/GameplayTestFrame';
import { putFile } from './BrowserExporters/BrowserSWPreviewLauncher/BrowserSWPreviewIndexedDB';

jest.mock('../GameEngineFinder/BrowserS3GDJSFinder', () => ({
  findGDJS: jest.fn(),
}));
jest.mock('../GameplayTests/GameplayTestFrame', () => ({
  setGameplayTestFramePreviewLocation: jest.fn(),
}));
jest.mock('../EmbeddedGame/EmbeddedGameFrame', () => ({}));
jest.mock(
  './BrowserExporters/BrowserPreview/BrowserPreviewErrorDialog',
  () => () => null
);
jest.mock('./BrowserExporters/BrowserPreview/BrowserPreviewWindow', () => ({}));
jest.mock('../Utils/Platform', () => ({
  isNativeMobileApp: () => false,
}));
jest.mock('../Version', () => ({ getIDEVersionWithHash: () => 'test' }));
jest.mock('../Utils/Window', () => ({
  getArguments: () => ({}),
  isDev: () => false,
}));
jest.mock('../Utils/GDevelopServices/Project', () => ({
  getGDevelopResourceJwtToken: () => null,
}));
jest.mock(
  './BrowserExporters/BrowserPreview/BrowserPreviewDebuggerServer',
  () => ({
    browserPreviewDebuggerServer: {
      startServer: jest.fn(),
      getExistingPreviewDebuggerIds: () => ['preview'],
      sendMessage: jest.fn(),
    },
    getExistingPreviewWindowForDebuggerId: () => null,
  })
);
jest.mock(
  './BrowserExporters/BrowserSWPreviewLauncher/BrowserSWPreviewIndexedDB',
  () => ({
    getBrowserSWPreviewBaseUrl: () => 'https://preview.test/session',
    getBrowserSWPreviewRootUrl: () => 'https://preview.test',
    putFile: jest.fn(),
    deleteFilesWithPrefix: () => Promise.resolve(),
  })
);

jest.mock('../Utils/GDevelopServices/Preview', () => ({
  getBaseUrl: () => 'https://preview.test/',
  uploadObjects: jest.fn(),
}));
jest.mock('../GameEngineFinder/LocalGDJSFinder', () => ({
  findGDJS: () => Promise.resolve({ gdjsRoot: 'engine' }),
}));
jest.mock(
  './LocalExporters/LocalPreviewLauncher/LocalPreviewDebuggerServer',
  () => ({
    localPreviewDebuggerServer: {
      startServer: jest.fn(),
      getExistingPreviewDebuggerIds: () => [],
    },
    getDebuggerServerAddress: () => null,
  })
);
jest.mock(
  './LocalExporters/LocalPreviewLauncher/LocalNetworkPreviewDialog',
  () => () => null
);
jest.mock('../Profile/Subscription/SubscriptionChecker', () => ({}));
jest.mock('../Utils/LocalUserInfo', () => ({
  getUID: () => 'preview-ownership-test',
}));

const gd = global.gd;

describe('preview ownership', () => {
  let project;
  let launcher;
  let released;

  beforeEach(() => {
    jest.clearAllMocks();
    project = gd.ProjectHelper.createNewGDJSProject();
    project.setName('Native preview');
    project.insertNewLayout('Scene', 0);
    launcher = new BrowserSWPreviewLauncher({
      getIncludeFileHashs: () => ({}),
      crashReportUploadLevel: 'none',
    });
    launcher.setState = jest.fn();
    findGDJS.mockResolvedValue({
      gdjsRoot: 'https://engine.test',
      filesContent: [
        {
          filePath: 'https://engine.test/Runtime/index.html',
          text: '<html><!-- GDJS_CODE_FILES --></html>',
        },
      ],
    });
    released = [];
    [
      'PreviewExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
      'SerializerElement',
    ].forEach(name => {
      const prototype = gd[name].prototype;
      const release = prototype.delete;
      jest.spyOn(prototype, 'delete').mockImplementation(function() {
        released.push(name);
        return release.call(this);
      });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    project.delete();
  });

  it('keeps native resources through the pending write and delivers hot reload data', async () => {
    let finishWrite;
    let signalWrite;
    const started = new Promise(resolve => {
      signalWrite = resolve;
    });
    const pending = new Promise(resolve => {
      finishWrite = resolve;
    });
    putFile.mockImplementation(() => {
      signalWrite();
      return pending;
    });
    const launch = launcher.launchPreview({
      project,
      sceneName: 'Scene',
      hotReload: true,
      shouldGenerateScenesEventsCode: true,
    });
    await started;
    expect(released).not.toContain('Exporter');
    expect(debuggerServer.sendMessage).not.toHaveBeenCalled();
    finishWrite();
    await launch;
    expect(debuggerServer.sendMessage).toHaveBeenCalledWith(
      'preview',
      expect.objectContaining({
        command: 'hotReload',
        payload: expect.objectContaining({
          projectData: expect.objectContaining({
            properties: expect.objectContaining({ name: 'Native preview' }),
          }),
          runtimeGameOptions: expect.any(Object),
        }),
      })
    );
    expect(released.slice(-5)).toEqual([
      'SerializerElement',
      'SerializerElement',
      'PreviewExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
    ]);
  });

  it('releases the partly serialized hot reload and reports the original error', async () => {
    const failure = new Error('runtime options failed');
    putFile.mockResolvedValue(undefined);
    jest
      .spyOn(gd.Exporter.prototype, 'serializeRuntimeGameOptions')
      .mockImplementation(() => {
        throw failure;
      });
    await launcher.launchPreview({
      project,
      sceneName: 'Scene',
      hotReload: true,
    });
    expect(launcher.setState).toHaveBeenCalledWith({ error: failure });
    expect(debuggerServer.sendMessage).not.toHaveBeenCalled();
    expect(released.slice(-5)).toEqual([
      'SerializerElement',
      'SerializerElement',
      'PreviewExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
    ]);
  });

  it('releases the exporter and its filesystem when creating options fails', async () => {
    const failure = new Error('preview options failed');
    jest.spyOn(gd, 'PreviewExportOptions').mockImplementation(() => {
      throw failure;
    });
    await launcher.launchPreview({ project, sceneName: 'Scene' });
    expect(launcher.setState).toHaveBeenCalledWith({ error: failure });
    expect(released).toEqual(['Exporter', 'AbstractFileSystemJS']);
  });

  it('releases all native resources when storage rejects a gameplay preview', async () => {
    const failure = new Error('storage unavailable');
    putFile.mockRejectedValue(failure);
    await expect(
      launcher.launchPreview({
        project,
        sceneName: 'Scene',
        isForGameplayTest: true,
      })
    ).rejects.toThrow('storage unavailable');
    expect(setGameplayTestFramePreviewLocation).not.toHaveBeenCalled();
    expect(released.slice(-3)).toEqual([
      'PreviewExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
    ]);
  });

  it('releases the native resources before S3 uploads the exported files', async () => {
    const s3Launcher = new BrowserS3PreviewLauncher(launcher.props);
    s3Launcher.setState = jest.fn();
    const failure = new Error('upload failed');
    let releasedBeforeUpload;
    uploadObjects.mockImplementation(async () => {
      releasedBeforeUpload = released.slice();
      throw failure;
    });
    await s3Launcher.launchPreview({
      project,
      sceneName: 'Scene',
      numberOfWindows: 0,
    });
    expect(uploadObjects).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ Key: expect.stringMatching(/index\.html$/) }),
      ])
    );
    expect(releasedBeforeUpload.slice(-3)).toEqual([
      'PreviewExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
    ]);
    expect(s3Launcher.setState).toHaveBeenCalledWith({ error: failure });
  });

  it('releases native resources on a desktop export error before opening a window', async () => {
    const localLauncher = new LocalPreviewLauncher(launcher.props);
    const openWindow = jest.spyOn(localLauncher, '_openPreviewWindow');
    const failure = new Error('export failed');
    jest
      .spyOn(gd.Exporter.prototype, 'exportProjectForPixiPreview')
      .mockImplementation(() => {
        throw failure;
      });
    await expect(
      localLauncher.launchPreview({
        project,
        sceneName: 'Scene',
        numberOfWindows: 1,
      })
    ).rejects.toBe(failure);
    expect(openWindow).not.toHaveBeenCalled();
    expect(released).toEqual([
      'PreviewExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
    ]);
  });
});
