// @flow
import { Trans, t } from '@lingui/macro';

import React from 'react';
import RaisedButton from '../../UI/RaisedButton';
import { Column, Line } from '../../UI/Grid';
import { findGDJS } from '../../GameEngineFinder/LocalGDJSFinder';
import LocalFileSystem, { type UrlFileDescriptor } from './LocalFileSystem';
import assignIn from 'lodash/assignIn';
import DesktopService from '../../Utils/DesktopService';
import {
  type ExportFlowProps,
  type ExportPipeline,
  type ExportPipelineContext,
} from '../ExportPipeline.flow';
import LocalFilePicker from '../../UI/LocalFilePicker';
import { archiveLocalFolder } from '../../Utils/LocalArchiver';
import {
  ExplanationHeader,
  DoneFooter,
  ExportFlow,
} from '../GenericExporters/FacebookInstantGamesExport';
import { downloadUrlsToLocalFiles } from '../../Utils/LocalFileDownloader';

const path = DesktopService.getPath();

const gd: libGDevelop = global.gd;

type ExportState = {
  archiveOutputFilename: string,
};

type PreparedExporter = {|
  exporter: gdjsExporter,
  localFileSystem: LocalFileSystem,
  temporaryOutputDir: string,
|};

type ExportOutput = {|
  temporaryOutputDir: string,
  urlFiles: Array<UrlFileDescriptor>,
|};

type ResourcesDownloadOutput = {|
  temporaryOutputDir: string,
|};

type CompressionOutput = string;

const exportPipelineName = 'local-facebook-instant-games';

export const localFacebookInstantGamesExportPipeline: ExportPipeline<
  ExportState,
  PreparedExporter,
  ExportOutput,
  ResourcesDownloadOutput,
  CompressionOutput
> = {
  name: exportPipelineName,

  getInitialExportState: (project: gdProject) => {
    const documentsPath = DesktopService.getAppPathSync('documents');
    return {
      archiveOutputFilename:
        DesktopService.isDesktop() && path && documentsPath
          ? path.join(documentsPath, 'fb-instant-game.zip')
          : '',
    };
  },

  canLaunchBuild: exportState => !!exportState.archiveOutputFilename,

  isNavigationDisabled: () => false,

  renderHeader: ({ project, exportState, updateExportState, exportStep }) =>
    exportStep !== 'done' ? (
      <Column noMargin expand>
        <Line>
          <ExplanationHeader />
        </Line>
        <Line>
          <LocalFilePicker
            title={'Facebook Instant Games export zip file'}
            message={
              'Choose where to save the exported file for Facebook Instant Games'
            }
            filters={[
              {
                name: 'Compressed file for Facebook Instant Games',
                extensions: ['zip'],
              },
            ]}
            value={exportState.archiveOutputFilename}
            defaultPath={DesktopService.getAppPathSync('documents')}
            onChange={value =>
              updateExportState(() => ({ archiveOutputFilename: value }))
            }
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

      // TODO: Memory leak? Check for other exporters too.
      const localFileSystem = new LocalFileSystem({
        downloadUrlsToLocalFiles: true,
      });
      const fileSystem = assignIn(
        new gd.AbstractFileSystemJS(),
        localFileSystem
      );
      const exporter = new gd.Exporter(fileSystem, gdjsRoot);
      if (!path) return Promise.reject(new Error('Unsupported'));
      const temporaryOutputDir = path.join(
        fileSystem.getTempDir(),
        'FacebookInstantGamesExport'
      );
      fileSystem.mkDir(temporaryOutputDir);
      fileSystem.clearDir(temporaryOutputDir);

      return {
        exporter,
        localFileSystem,
        temporaryOutputDir,
      };
    });
  },

  launchExport: async (
    context: ExportPipelineContext<ExportState>,
    { exporter, localFileSystem, temporaryOutputDir }: PreparedExporter,
    fallbackAuthor: ?{ id: string, username: string }
  ): Promise<ExportOutput> => {
    const exportOptions = new gd.ExportOptions(
      context.project,
      temporaryOutputDir
    );
    exportOptions.setTarget('facebookInstantGames');
    if (fallbackAuthor) {
      exportOptions.setFallbackAuthor(
        fallbackAuthor.id,
        fallbackAuthor.username
      );
    }
    const exportSucceeded = exporter.exportWholePixiProject(exportOptions);
    exportOptions.delete();
    exporter.delete();

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
    return archiveLocalFolder({
      path: temporaryOutputDir,
      outputFilename: context.exportState.archiveOutputFilename,
    });
  },

  renderDoneFooter: ({ exportState }) => {
    const openExportFolder = () => {
      if (path) {
        DesktopService.openPath(
          path.dirname(exportState.archiveOutputFilename)
        );
      }
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
