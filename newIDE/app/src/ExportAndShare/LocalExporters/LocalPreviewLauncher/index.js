// @flow
import { Trans } from '@lingui/macro';

import * as React from 'react';
import LocalFileSystem from '../LocalFileSystem';
import DesktopService from '../../../Utils/DesktopService';
import { findGDJS } from '../../../GameEngineFinder/LocalGDJSFinder';
import LocalNetworkPreviewDialog from './LocalNetworkPreviewDialog';
import assignIn from 'lodash/assignIn';
import {
  type PreviewOptions,
  type PreviewLauncherProps,
  type CaptureOptions,
} from '../../PreviewLauncher.flow';
import SubscriptionChecker, {
  type SubscriptionCheckerInterface,
} from '../../../Profile/Subscription/SubscriptionChecker';
import {
  getDebuggerServerAddress,
  localPreviewDebuggerServer,
} from './LocalPreviewDebuggerServer';
import Window from '../../../Utils/Window';
import { getIDEVersionWithHash } from '../../../Version';
import { setEmbeddedGameFramePreviewLocation } from '../../../EmbeddedGame/EmbeddedGameFrame';
import { setGameplayTestFramePreviewLocation } from '../../../GameplayTests/GameplayTestFrame';
const path = DesktopService.getPath();
const gd: libGDevelop = global.gd;

let nextPreviewId = 1;

type State = {|
  networkPreviewDialogOpen: boolean,
  networkPreviewHost: ?string,
  networkPreviewPort: ?number,
  networkPreviewError: ?any,
  hotReloadsCount: number,
  previewGamePath: ?string,
  previewBrowserWindowOptions: ?{
    width: number,
    height: number,
    useContentSize: boolean,
    title: string,
    backgroundColor: string,
  },
  hideMenuBar: boolean,
  alwaysOnTop: boolean,
  numberOfWindows: number,
  captureOptions: ?CaptureOptions,
|};

// Keep hot reloads for the same project in one directory without sharing output
// with another project or another editor window.
const projectDirectoryIds = new WeakMap<gdProject, number>();
let nextProjectDirectoryId = 1;
const getProjectDirectoryName = (project: gdProject): string => {
  let id = projectDirectoryIds.get(project);
  if (id === undefined) {
    id = nextProjectDirectoryId++;
    projectDirectoryIds.set(project, id);
  }
  return `window-${DesktopService.getWindowId()}-project-${id}`;
};

const prepareExporter = async ({
  project,
  isForInGameEdition,
  isForGameplayTest,
}: {
  project: gdProject,
  isForInGameEdition: boolean,
  isForGameplayTest: boolean,
}): Promise<{|
  outputDir: string,
  exporter: gdjsExporter,
  gdjsRoot: string,
|}> => {
  const { gdjsRoot } = await findGDJS();
  console.info('GDJS found in ', gdjsRoot);

  if (!path) {
    throw new Error('Desktop path is not available for preview export.');
  }
  const localFileSystem = new LocalFileSystem({
    downloadUrlsToLocalFiles: false,
  });
  const fileSystem = assignIn(new gd.AbstractFileSystemJS(), localFileSystem);
  const outputDir = path.join(
    fileSystem.getTempDir(),
    getProjectDirectoryName(project),
    isForGameplayTest
      ? 'gameplay-test-preview'
      : isForInGameEdition
      ? 'in-game-editor-preview'
      : 'preview'
  );
  const exporter = new gd.Exporter(fileSystem, gdjsRoot);

  return {
    outputDir,
    exporter,
    gdjsRoot,
  };
};

export default class LocalPreviewLauncher extends React.Component<
  PreviewLauncherProps,
  State
> {
  canDoNetworkPreview = (): any => true;

  // $FlowFixMe[missing-local-annot]
  state = {
    networkPreviewDialogOpen: false,
    networkPreviewHost: null,
    networkPreviewPort: null,
    networkPreviewError: null,
    previewGamePath: null,
    previewBrowserWindowOptions: null,
    hotReloadsCount: 0,
    hideMenuBar: true,
    alwaysOnTop: true,
    numberOfWindows: 1,
    captureOptions: null,
  };
  _networkPreviewSubscriptionChecker: ?SubscriptionCheckerInterface = null;
  _hotReloadSubscriptionChecker: ?SubscriptionCheckerInterface = null;
  _unsubscribePreviewWindowClosed: ?() => void = null;
  _unsubscribeServeFolderDone: ?() => void = null;
  _unsubscribeLocalNetworkIp: ?() => void = null;

  componentWillUnmount() {
    if (this._unsubscribePreviewWindowClosed) {
      this._unsubscribePreviewWindowClosed();
      this._unsubscribePreviewWindowClosed = null;
    }
    if (this._unsubscribeServeFolderDone) {
      this._unsubscribeServeFolderDone();
      this._unsubscribeServeFolderDone = null;
    }
    if (this._unsubscribeLocalNetworkIp) {
      this._unsubscribeLocalNetworkIp();
      this._unsubscribeLocalNetworkIp = null;
    }
  }

  _openPreviewBrowserWindow = () => {
    const {
      previewGamePath,
      previewBrowserWindowOptions,
      captureOptions,
      alwaysOnTop,
      hideMenuBar,
      numberOfWindows,
    } = this.state;
    if (!previewBrowserWindowOptions || !previewGamePath) return;

    if (!DesktopService.isDesktop()) return;

    const previewIndexHtmlPath = DesktopService.getLocalFileUrl(
      path
        ? path.join(previewGamePath, 'index.html')
        : `${previewGamePath}/index.html`
    );

    if (this._unsubscribePreviewWindowClosed) {
      this._unsubscribePreviewWindowClosed();
      this._unsubscribePreviewWindowClosed = null;
    }
    this._unsubscribePreviewWindowClosed = DesktopService.onIpcEvent(
      'preview-window-closed',
      async () => {
        if (captureOptions) {
          await this.props.onCaptureFinished(captureOptions);
        }
      }
    );

    DesktopService.preview
      .open({
        previewBrowserWindowOptions,
        previewGameIndexHtmlPath: previewIndexHtmlPath,
        alwaysOnTop,
        hideMenuBar,
        numberOfWindows,
        captureOptions,
      })
      .catch(error => {
        console.error('Unable to open preview window:', error);
      });
  };

  closePreview = (windowId: number) => {
    if (!DesktopService.isDesktop()) return;
    DesktopService.preview.close({ windowId });
  };

  closeAllPreviews = () => {
    if (DesktopService.isDesktop()) {
      DesktopService.preview.closeAll().catch(error => {
        console.info('Unable to close all preview windows - ignoring.', error);
      });
    }

    // This should be unnecessary since the preview windows are closed above.
    const previewDebuggerServer = this.getPreviewDebuggerServer();
    if (previewDebuggerServer) {
      previewDebuggerServer.closeAllConnections();
    }
  };

  _openPreviewWindow = (
    project: gdProject,
    gamePath: string,
    options: PreviewOptions
  ): void => {
    this.setState(
      // $FlowFixMe[incompatible-type]
      {
        previewBrowserWindowOptions: {
          width: project.getGameResolutionWidth(),
          height: project.getGameResolutionHeight(),
          useContentSize: true,
          title: `Preview of ${project.getName()}`,
          backgroundColor: '#000000',
          webPreferences: {
            backgroundThrottling: false,
          },
        },
        previewGamePath: gamePath,
        hideMenuBar: !options.getIsMenuBarHiddenInPreview(),
        alwaysOnTop: options.getIsAlwaysOnTopInPreview(),
        numberOfWindows: options.numberOfWindows,
        captureOptions: options.captureOptions,
      },
      () => {
        if (!options.networkPreview) {
          this._openPreviewBrowserWindow();
        } else {
          if (!DesktopService.isDesktop()) return;

          if (this._unsubscribeServeFolderDone) {
            this._unsubscribeServeFolderDone();
            this._unsubscribeServeFolderDone = null;
          }
          if (this._unsubscribeLocalNetworkIp) {
            this._unsubscribeLocalNetworkIp();
            this._unsubscribeLocalNetworkIp = null;
          }
          this._unsubscribeServeFolderDone = DesktopService.onIpcEvent(
            'serve-folder-done',
            (err, serverParams) => {
              if (err) {
                this.setState({
                  networkPreviewDialogOpen: true,
                  networkPreviewPort: null,
                  networkPreviewHost: null,
                  networkPreviewError: err,
                });
              } else {
                this.setState({
                  networkPreviewDialogOpen: true,
                  networkPreviewPort: serverParams.port,
                });
              }

              setTimeout(() => this._checkSubscriptionForNetworkPreview());
            }
          );
          this._unsubscribeLocalNetworkIp = DesktopService.onIpcEvent(
            'local-network-ip',
            ipAddress => {
              this.setState({
                networkPreviewHost: ipAddress,
              });
            }
          );
          DesktopService.serveFolder.start({
            root: gamePath,
          });
          DesktopService.serveFolder.getLocalNetworkIp();
        }
      }
    );
  };

  launchPreview = async (previewOptions: PreviewOptions): Promise<any> => {
    const {
      project,
      sceneName,
      externalLayoutName,
      eventsBasedObjectType,
      eventsBasedObjectVariantName,
    } = previewOptions;

    const previewId = nextPreviewId++;
    console.log(
      `[LocalPreviewLauncher] Launching preview #${previewId} with options:`,
      previewOptions
    );

    // Start the debugger server for previews. Even if not used,
    // useful if the user opens the Debugger editor later, or want to
    // hot reload.
    try {
      await this.getPreviewDebuggerServer().startServer({});
    } catch (err) {
      console.error(
        'Unable to start the Debugger Server for the preview:',
        err
      );
    }

    const { outputDir, exporter } = await prepareExporter({
      project,
      isForInGameEdition: previewOptions.isForInGameEdition,
      isForGameplayTest: !!previewOptions.isForGameplayTest,
    });

    var previewStartTime = performance.now();

    const previewExportOptions = new gd.PreviewExportOptions(
      project,
      outputDir
    );
    previewExportOptions.setIsDevelopmentEnvironment(Window.isDev());
    previewExportOptions.setLayoutName(sceneName);
    previewExportOptions.setIsInGameEdition(previewOptions.isForInGameEdition);
    previewExportOptions.setEditorId(previewOptions.editorId || '');
    if (externalLayoutName) {
      previewExportOptions.setExternalLayoutName(externalLayoutName);
    }
    if (eventsBasedObjectType) {
      previewExportOptions.setEventsBasedObjectType(eventsBasedObjectType);
      previewExportOptions.setEventsBasedObjectVariantName(
        eventsBasedObjectVariantName || ''
      );
    }

    if (previewOptions.isForInGameEdition || previewOptions.isForGameplayTest) {
      previewExportOptions.useWindowMessageDebuggerClient();
    } else {
      const previewDebuggerServerAddress = getDebuggerServerAddress();
      if (previewDebuggerServerAddress) {
        previewExportOptions.useWebsocketDebuggerClientWithServerAddress(
          previewDebuggerServerAddress.address,
          '' + previewDebuggerServerAddress.port
        );
      }
    }

    const includeFileHashs = this.props.getIncludeFileHashs();
    for (const includeFile in includeFileHashs) {
      const hash = includeFileHashs[includeFile];
      previewExportOptions.setIncludeFileHash(includeFile, hash);
    }

    // TODO Filter according to isForInGameEdition because the first game preview
    // won't necessarily be the first debugger.
    // It doesn't have any side effect because when it wont actually do an hot-reload
    // since the game preview doesn't exist yet.
    const debuggerIds = previewOptions.isForInGameEdition
      ? this.getPreviewDebuggerServer().getExistingEmbeddedGameFrameDebuggerIds()
      : this.getPreviewDebuggerServer().getExistingPreviewDebuggerIds();
    const shouldHotReload =
      previewOptions.hotReload &&
      !previewOptions.isForGameplayTest &&
      !!debuggerIds.length;
    if (shouldHotReload) {
      previewExportOptions.setShouldClearExportFolder(
        previewOptions.shouldHardReload
      );
      // At hot-reload, the ProjectData are passed into the message.
      // It means that we don't need to write them in a file.
      previewExportOptions.setShouldReloadProjectData(false);
      previewExportOptions.setShouldReloadLibraries(
        previewOptions.shouldReloadLibraries ||
          previewOptions.shouldGenerateScenesEventsCode
      );
      previewExportOptions.setShouldGenerateScenesEventsCode(
        previewOptions.shouldGenerateScenesEventsCode
      );
    }

    previewExportOptions.setFullLoadingScreen(previewOptions.fullLoadingScreen);
    previewExportOptions.setGDevelopVersionWithHash(getIDEVersionWithHash());
    previewExportOptions.setCrashReportUploadLevel(
      this.props.crashReportUploadLevel
    );
    previewExportOptions.setPreviewContext('preview');
    previewExportOptions.setProjectTemplateSlug(project.getTemplateSlug());

    if (previewOptions.inAppTutorialMessageInPreview) {
      previewExportOptions.setInAppTutorialMessageInPreview(
        previewOptions.inAppTutorialMessageInPreview,
        previewOptions.inAppTutorialMessagePositionInPreview
      );
    }

    if (previewOptions.fallbackAuthor) {
      previewExportOptions.setFallbackAuthor(
        previewOptions.fallbackAuthor.id,
        previewOptions.fallbackAuthor.username
      );
    }
    if (previewOptions.authenticatedPlayer) {
      previewExportOptions.setAuthenticatedPlayer(
        previewOptions.authenticatedPlayer.playerId,
        previewOptions.authenticatedPlayer.playerUsername,
        previewOptions.authenticatedPlayer.playerToken
      );
    }
    if (previewOptions.captureOptions) {
      if (previewOptions.captureOptions.screenshots) {
        previewOptions.captureOptions.screenshots.forEach(screenshot => {
          previewExportOptions.addScreenshotCapture(
            screenshot.delayTimeInSeconds,
            screenshot.signedUrl,
            screenshot.publicUrl
          );
        });
      }
    }
    if (
      previewOptions.captureOptions &&
      previewOptions.captureOptions.previewVideo
    ) {
      previewExportOptions.setPreviewVideoCapture(
        previewOptions.captureOptions.previewVideo.signedUrl,
        previewOptions.captureOptions.previewVideo.publicUrl,
        previewOptions.captureOptions.previewVideo.isRecordedByUser
      );
    }
    if (previewOptions.editorCameraState3D) {
      previewExportOptions.setEditorCameraState3D(
        previewOptions.editorCameraState3D.cameraMode,
        previewOptions.editorCameraState3D.positionX,
        previewOptions.editorCameraState3D.positionY,
        previewOptions.editorCameraState3D.positionZ,
        previewOptions.editorCameraState3D.rotationAngle,
        previewOptions.editorCameraState3D.elevationAngle,
        previewOptions.editorCameraState3D.distance
      );
    }
    if (previewOptions.inGameEditorSettings) {
      previewExportOptions.setInGameEditorSettingsJson(
        JSON.stringify(previewOptions.inGameEditorSettings)
      );
    }

    exporter.exportProjectForPixiPreview(previewExportOptions);

    if (shouldHotReload) {
      const projectDataElement = new gd.SerializerElement();
      exporter.serializeProjectData(
        project,
        previewExportOptions,
        projectDataElement
      );
      const projectData = JSON.parse(gd.Serializer.toJSON(projectDataElement));
      projectDataElement.delete();

      const runtimeGameOptionsElement = new gd.SerializerElement();
      exporter.serializeRuntimeGameOptions(
        previewExportOptions,
        runtimeGameOptionsElement
      );
      const runtimeGameOptions = JSON.parse(
        gd.Serializer.toJSON(runtimeGameOptionsElement)
      );
      runtimeGameOptionsElement.delete();

      if (previewOptions.shouldHardReload) {
        console.log(
          `[LocalPreviewLauncher] Triggering hard reload for preview #${previewId}...`
        );
        debuggerIds.forEach(debuggerId => {
          this.getPreviewDebuggerServer().sendMessage(debuggerId, {
            command: 'hardReload',
          });
        });
      } else {
        debuggerIds.forEach(debuggerId => {
          console.log(
            `[LocalPreviewLauncher] Triggering hot reload for preview #${previewId}...`
          );
          this.getPreviewDebuggerServer().sendMessage(debuggerId, {
            command: 'hotReload',
            payload: {
              shouldReloadResources: previewOptions.shouldReloadResources,
              projectData,
              runtimeGameOptions,
            },
          });
        });
      }
      if (!previewOptions.isForInGameEdition) {
        if (
          this.state.hotReloadsCount % 16 === 0 &&
          this._hotReloadSubscriptionChecker
        ) {
          this._hotReloadSubscriptionChecker.checkUserHasSubscription();
        }
        this.setState(state => ({
          hotReloadsCount: state.hotReloadsCount + 1,
        }));
      }
    } else {
      if (previewOptions.isForInGameEdition) {
        setEmbeddedGameFramePreviewLocation({
          previewIndexHtmlLocation: DesktopService.getLocalFileUrl(
            path
              ? path.join(outputDir, 'index.html')
              : `${outputDir}/index.html`
          ),
        });
      }

      if (previewOptions.isForGameplayTest) {
        // The preview is shown in (and run by) the gameplay test frame:
        // no window to open. The previewId in the URL forces the frame to
        // reload the game when the same preview is re-exported.
        setGameplayTestFramePreviewLocation({
          previewIndexHtmlLocation: `${DesktopService.getLocalFileUrl(
            path
              ? path.join(outputDir, 'index.html')
              : `${outputDir}/index.html`
          )}?previewId=${previewId}`,
          // The game window of the frame is fixed at the project
          // resolution: the frame only zooms its display.
          gameResolution: {
            width: project.getGameResolutionWidth(),
            height: project.getGameResolutionHeight(),
          },
        });
      } else if (previewOptions.numberOfWindows >= 1) {
        this._openPreviewWindow(project, outputDir, previewOptions);
      }
    }

    exporter.delete();
    previewExportOptions.delete();

    const previewStopTime = performance.now();
    console.info(
      `[LocalPreviewLauncher] Preview #${previewId} took ${previewStopTime -
        previewStartTime}ms`
    );
  };

  getPreviewDebuggerServer(): any {
    return localPreviewDebuggerServer;
  }

  _checkSubscriptionForNetworkPreview = (): any => {
    if (!this._networkPreviewSubscriptionChecker) return true;

    return this._networkPreviewSubscriptionChecker.checkUserHasSubscription();
  };

  render(): any {
    const {
      networkPreviewDialogOpen,
      networkPreviewHost,
      networkPreviewPort,
      networkPreviewError,
    } = this.state;

    return (
      <React.Fragment>
        <SubscriptionChecker
          ref={subscriptionChecker =>
            (this._networkPreviewSubscriptionChecker = subscriptionChecker)
          }
          onChangeSubscription={() =>
            this.setState({ networkPreviewDialogOpen: false })
          }
          id="Preview over wifi"
          title={<Trans>Preview over wifi</Trans>}
          placementId="preview-wifi"
          mode="try"
          isNotShownDuringInAppTutorial
        />
        <SubscriptionChecker
          ref={subscriptionChecker =>
            (this._hotReloadSubscriptionChecker = subscriptionChecker)
          }
          id="Hot reloading"
          title={
            <Trans>Live preview (apply changes to the running preview)</Trans>
          }
          placementId="hot-reloading"
          mode="try"
          isNotShownDuringInAppTutorial
        />
        <LocalNetworkPreviewDialog
          open={networkPreviewDialogOpen}
          url={
            networkPreviewHost && networkPreviewPort
              ? `${networkPreviewHost}:${networkPreviewPort}`
              : null
          }
          error={networkPreviewError}
          onClose={() => this.setState({ networkPreviewDialogOpen: false })}
          onExport={this.props.onExport}
          onRunPreviewLocally={this._openPreviewBrowserWindow}
        />
      </React.Fragment>
    );
  }
}
