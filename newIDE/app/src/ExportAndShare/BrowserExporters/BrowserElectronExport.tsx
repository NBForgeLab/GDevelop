import * as React from 'react';
import { Trans } from '@lingui/macro';
import exportProject from '../ExportProject';
import { findGDJS } from '../../GameEngineFinder/BrowserS3GDJSFinder';
import BrowserFileSystem from './BrowserFileSystem';
import {
  type UrlFileDescriptor,
  type TextFileDescriptor,
  type BlobFileDescriptor,
  downloadUrlFilesToBlobFiles,
  archiveFiles,
} from '../../Utils/BrowserArchiver';
import {
  type ExportFlowProps,
  type ExportPipeline,
  type ExportPipelineContext,
} from '../ExportPipeline';
import RaisedButton from '../../UI/RaisedButton';
import {
  BlobDownloadUrlHolder,
  openBlobDownloadUrl,
} from '../../Utils/BlobDownloadUrlHolder';
import {
  ExplanationHeader,
  DoneFooter,
  ExportFlow,
} from '../GenericExporters/ElectronExport';

type ExportState = null;

type PreparedExporter = {
  gdjsRoot: string;
  abstractFileSystem: BrowserFileSystem;
  outputDir: string;
};

type ExportOutput = {
  textFiles: Array<TextFileDescriptor>;
  urlFiles: Array<UrlFileDescriptor>;
};

type ResourcesDownloadOutput = {
  textFiles: Array<TextFileDescriptor>;
  blobFiles: Array<BlobFileDescriptor>;
};

type CompressionOutput = Blob;

const exportPipelineName = 'browser-electron';

export const browserElectronExportPipeline: ExportPipeline<
  ExportState,
  PreparedExporter,
  ExportOutput,
  ResourcesDownloadOutput,
  CompressionOutput
> = {
  name: exportPipelineName,
  packageNameWarningType: 'desktop',

  getInitialExportState: () => null,

  canLaunchBuild: () => true,

  isNavigationDisabled: () => false,

  renderHeader: () => <ExplanationHeader />,

  renderExportFlow: (props: ExportFlowProps) => (
    <ExportFlow {...props} exportPipelineName={exportPipelineName} />
  ),

  prepareExporter: (
    context: ExportPipelineContext<ExportState>
  ): Promise<PreparedExporter> => {
    return findGDJS('electron').then(({ gdjsRoot, filesContent }) => {
      console.info('GDJS found in ', gdjsRoot);

      const outputDir = '/export/';
      const abstractFileSystem = new BrowserFileSystem({
        textFiles: filesContent,
      });

      return {
        gdjsRoot,
        outputDir,
        abstractFileSystem,
      };
    });
  },

  launchExport: (
    context: ExportPipelineContext<ExportState>,
    { gdjsRoot, outputDir, abstractFileSystem }: PreparedExporter,
    fallbackAuthor:
      | {
          id: string;
          username: string;
        }
      | null
      | undefined
  ): Promise<ExportOutput> => {
    const { project } = context;
    exportProject({
      fileSystem: abstractFileSystem,
      gdjsRoot,
      project,
      outputDir,
      fallbackAuthor,
      target: 'electron',
    });

    return Promise.resolve({
      textFiles: abstractFileSystem.getAllTextFilesIn(outputDir),
      urlFiles: abstractFileSystem.getAllUrlFilesIn(outputDir),
    });
  },

  launchResourcesDownload: (
    context: ExportPipelineContext<ExportState>,
    { textFiles, urlFiles }: ExportOutput
  ): Promise<ResourcesDownloadOutput> => {
    return downloadUrlFilesToBlobFiles({
      urlFiles,
      onProgress: context.updateStepProgress,
    }).then((blobFiles) => ({
      blobFiles,
      textFiles,
    }));
  },

  launchCompression: (
    context: ExportPipelineContext<ExportState>,
    { textFiles, blobFiles }: ResourcesDownloadOutput
  ): Promise<Blob> => {
    return archiveFiles({
      blobFiles,
      textFiles,
      basePath: '/export/',
      onProgress: context.updateStepProgress,
    });
  },

  renderDoneFooter: ({ compressionOutput, exportState }) => {
    return (
      <DoneFooter
        renderGameButton={() => (
          <BlobDownloadUrlHolder blob={compressionOutput}>
            {(blobDownloadUrl) => (
              <RaisedButton
                primary
                onClick={() => openBlobDownloadUrl(blobDownloadUrl, 'game.zip')}
                label={<Trans>Download the exported game</Trans>}
              />
            )}
          </BlobDownloadUrlHolder>
        )}
      />
    );
  },
};
