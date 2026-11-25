import { Trans, t } from '@lingui/macro';

import React from 'react';
import RaisedButton from '../../UI/RaisedButton';
import { Column, Line } from '../../UI/Grid';
import { findGDJS } from '../../GameEngineFinder/LocalGDJSFinder';
import LocalFileSystem, { type UrlFileDescriptor } from './LocalFileSystem';
import LocalFolderPicker from '../../UI/LocalFolderPicker';
import exportProject from '../ExportProject';
import optionalRequire from '../../Utils/OptionalRequire';
import {
  type ExportFlowProps,
  type ExportPipeline,
  type ExportPipelineContext,
} from '../ExportPipeline.flow';
import {
  ExplanationHeader,
  DoneFooter,
  ExportFlow,
} from '../GenericExporters/CordovaExport';
import { downloadUrlsToLocalFiles } from '../../Utils/LocalFileDownloader';
// It's important to use remote and not electron for folder actions,
// otherwise they will be opened in the background.
// See https://github.com/electron/electron/issues/4349#issuecomment-777475765
const remote = optionalRequire('@electron/remote');
const shell = remote ? remote.shell : null;

type ExportState = {
  outputDir: string;
};

type PreparedExporter = {
  gdjsRoot: string;
  localFileSystem: LocalFileSystem;
};

type ExportOutput = {
  urlFiles: Array<UrlFileDescriptor>;
};

type ResourcesDownloadOutput = null;
type CompressionOutput = null;

const exportPipelineName = 'local-cordova';

export const localCordovaExportPipeline: ExportPipeline<
  ExportState,
  PreparedExporter,
  ExportOutput,
  ResourcesDownloadOutput,
  CompressionOutput
> = {
  name: exportPipelineName,
  packageNameWarningType: 'mobile',

  getInitialExportState: (project: gdProject) => ({
    outputDir: project.getLastCompilationDirectory(),
  }),

  canLaunchBuild: (exportState) => !!exportState.outputDir,

  isNavigationDisabled: () => false,

  renderHeader: ({ project, exportState, updateExportState, exportStep }) =>
    exportStep !== 'done' ? (
      <Column noMargin>
        <Line>
          <Column noMargin>
            <ExplanationHeader />
          </Column>
        </Line>
        <Line>
          <LocalFolderPicker
            type="export"
            value={exportState.outputDir}
            defaultPath={project.getLastCompilationDirectory()}
            onChange={(outputDir) => {
              updateExportState(() => ({ outputDir }));
              project.setLastCompilationDirectory(outputDir);
            }}
            fullWidth
          />
        </Line>
      </Column>
    ) : null,

  renderExportFlow: (props: ExportFlowProps) => (
    <ExportFlow {...props} exportPipelineName={exportPipelineName} />
  ),

  prepareExporter: (
    context: ExportPipelineContext<ExportState>
  ): Promise<PreparedExporter> => {
    return findGDJS().then(({ gdjsRoot }) => {
      console.info('GDJS found in ', gdjsRoot);

      const localFileSystem = new LocalFileSystem({
        downloadUrlsToLocalFiles: true,
      });

      return {
        gdjsRoot,
        localFileSystem,
      };
    });
  },

  launchExport: async (
    context: ExportPipelineContext<ExportState>,
    { gdjsRoot, localFileSystem }: PreparedExporter,
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
      outputDir: context.exportState.outputDir,
      fallbackAuthor,
      target: 'cordova',
    });

    if (!exportSucceeded) {
      throw new Error(
        context.i18n._(
          t`Export failed. Check that the output folder is accessible and that you have the necessary permissions.`
        )
      );
    }

    return {
      urlFiles: localFileSystem.getAllUrlFilesIn(context.exportState.outputDir),
    };
  },

  launchResourcesDownload: async (
    context: ExportPipelineContext<ExportState>,
    { urlFiles }: ExportOutput
  ): Promise<ResourcesDownloadOutput> => {
    await downloadUrlsToLocalFiles({
      urlContainers: urlFiles,
      onProgress: context.updateStepProgress,
      throwIfAnyError: true,
    });

    return null;
  },

  launchCompression: (
    context: ExportPipelineContext<ExportState>,
    exportOutput: ResourcesDownloadOutput
  ): Promise<CompressionOutput> => {
    return Promise.resolve(null);
  },

  renderDoneFooter: ({ exportState }) => {
    const openExportFolder = () => {
      if (shell) shell.openPath(exportState.outputDir);
    };

    return (
      <DoneFooter
        renderGameButton={() => (
          <RaisedButton
            key="open"
            label={<Trans>Open folder</Trans>}
            primary={true}
            onClick={openExportFolder}
          />
        )}
      />
    );
  },
};
