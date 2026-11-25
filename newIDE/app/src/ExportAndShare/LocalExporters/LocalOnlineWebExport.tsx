import { t } from '@lingui/macro';
import * as React from 'react';
import exportProject from '../ExportProject';
import {
  type Build,
  buildWeb,
  getBuildFileUploadOptions,
} from '../../Utils/GDevelopServices/Build';
import { uploadLocalFile } from './LocalFileUploader';
import { type AuthenticatedUser } from '../../Profile/AuthenticatedUserContext';
import { findGDJS } from '../../GameEngineFinder/LocalGDJSFinder';
import { archiveLocalFolder } from '../../Utils/LocalArchiver';
import optionalRequire from '../../Utils/OptionalRequire';
import LocalFileSystem, { type UrlFileDescriptor } from './LocalFileSystem';
import {
  type ExportPipeline,
  type ExportPipelineContext,
  type ExportFlowProps,
} from '../ExportPipeline.flow';
import { ExplanationHeader } from '../GenericExporters/OnlineWebExport';
import { downloadUrlsToLocalFiles } from '../../Utils/LocalFileDownloader';
import OnlineWebExportFlow from '../GenericExporters/OnlineWebExport/OnlineWebExportFlow';

const path = optionalRequire('path');
const os = optionalRequire('os');
type ExportState = null;

type PreparedExporter = {
  gdjsRoot: string;
  localFileSystem: LocalFileSystem;
  temporaryOutputDir: string;
};

type ExportOutput = {
  temporaryOutputDir: string;
  urlFiles: Array<UrlFileDescriptor>;
};

type ResourcesDownloadOutput = {
  temporaryOutputDir: string;
};

type CompressionOutput = string;

const exportPipelineName = 'local-online-web';

export const localOnlineWebExportPipeline: ExportPipeline<
  ExportState,
  PreparedExporter,
  ExportOutput,
  ResourcesDownloadOutput,
  CompressionOutput
> = {
  name: exportPipelineName,
  onlineBuildType: 'web-build',

  getInitialExportState: () => null,

  // Build can be launched if just opened the dialog or build errored, re-enabled when done.
  canLaunchBuild: (exportState, errored, exportStep) =>
    errored || exportStep === '' || exportStep === 'done',

  // Navigation is enabled when the build is errored or if the build is not done.
  isNavigationDisabled: (exportStep, errored) =>
    !errored && !['', 'done'].includes(exportStep),

  renderHeader: ({ uiMode }) => <ExplanationHeader uiMode={uiMode} />,

  renderExportFlow: (props: ExportFlowProps) => (
    <OnlineWebExportFlow {...props} exportPipelineName={exportPipelineName} />
  ),

  prepareExporter: (
    context: ExportPipelineContext<ExportState>
  ): Promise<PreparedExporter> => {
    return findGDJS().then(({ gdjsRoot }) => {
      console.info('GDJS found in ', gdjsRoot);

      const localFileSystem = new LocalFileSystem({
        downloadUrlsToLocalFiles: true,
      });
      const temporaryOutputDir = path.join(
        localFileSystem.getTempDir(),
        'OnlineWebExport'
      );
      localFileSystem.mkDir(temporaryOutputDir);
      localFileSystem.clearDir(temporaryOutputDir);

      return {
        gdjsRoot,
        localFileSystem,
        temporaryOutputDir,
      };
    });
  },

  launchExport: async (
    context: ExportPipelineContext<ExportState>,
    { gdjsRoot, localFileSystem, temporaryOutputDir }: PreparedExporter,
    fallbackAuthor:
      | {
          id: string;
          username: string;
        }
      | null
      | undefined
  ): Promise<ExportOutput> => {
    const exportSucceeded = exportProject({
      fileSystem: localFileSystem,
      gdjsRoot,
      project: context.project,
      outputDir: temporaryOutputDir,
      fallbackAuthor,
    });

    if (!exportSucceeded) {
      throw new Error(
        context.i18n._(
          t`Export failed. Check that the output folder is accessible and that you have the necessary permissions.`
        )
      );
    }

    return {
      temporaryOutputDir,
      urlFiles: localFileSystem.getAllUrlFilesIn(temporaryOutputDir),
    };
  },

  launchResourcesDownload: async (
    context: ExportPipelineContext<ExportState>,
    { temporaryOutputDir, urlFiles }: ExportOutput
  ): Promise<ResourcesDownloadOutput> => {
    await downloadUrlsToLocalFiles({
      urlContainers: urlFiles,
      onProgress: context.updateStepProgress,
      throwIfAnyError: true,
    });

    return { temporaryOutputDir };
  },

  launchCompression: (
    context: ExportPipelineContext<ExportState>,
    { temporaryOutputDir }: ResourcesDownloadOutput
  ): Promise<CompressionOutput> => {
    const archiveOutputDir = os.tmpdir();
    return archiveLocalFolder({
      path: temporaryOutputDir,
      outputFilename: path.join(archiveOutputDir, 'game-archive.zip'),
      sizeLimit: 250 * 1000 * 1000,
    });
  },

  launchUpload: (
    context: ExportPipelineContext<ExportState>,
    outputFile: CompressionOutput
  ): Promise<string> => {
    return getBuildFileUploadOptions().then((uploadOptions) => {
      return uploadLocalFile(
        outputFile,
        uploadOptions,
        context.updateStepProgress
      ).then(() => uploadOptions.key);
    });
  },

  launchOnlineBuild: (
    exportState: ExportState,
    authenticatedUser: AuthenticatedUser,
    uploadBucketKey: string,
    gameId: string,
    options: {
      gameName: string;
      gameVersion: string;
    },
    payWithCredits: boolean
  ): Promise<Build> => {
    const { getAuthorizationHeader, firebaseUser } = authenticatedUser;
    if (!firebaseUser)
      return Promise.reject(new Error('User is not authenticated'));

    return buildWeb(
      getAuthorizationHeader,
      firebaseUser.uid,
      uploadBucketKey,
      gameId,
      options,
      payWithCredits
    );
  },
};
