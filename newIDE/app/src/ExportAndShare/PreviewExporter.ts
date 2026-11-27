import assignIn from 'lodash/assignIn';
import type LocalFileSystem from './LocalExporters/LocalFileSystem';
import type BrowserSWFileSystem from './BrowserExporters/BrowserSWFileSystem';
import type BrowserS3FileSystem from './BrowserExporters/BrowserS3FileSystem';
import withTemporaryResource from '../Utils/WithTemporaryResource';

const gd: libGDevelop = global.gd;

export async function withPreviewExporter(
  {
    fileSystem,
    project,
    gdjsRoot,
    outputDir,
  }: {
    fileSystem: LocalFileSystem | BrowserSWFileSystem | BrowserS3FileSystem;
    project: gdProject;
    gdjsRoot: string;
    outputDir: string;
  },
  run: (
    arg0: gdjsExporter,
    previewExportOptions: gdPreviewExportOptions
  ) => void | Promise<void>
): Promise<void> {
  const adapter = new gd.AbstractFileSystemJS();
  let exporter;
  let options;
  try {
    assignIn(adapter, fileSystem);
    exporter = new gd.Exporter(adapter, gdjsRoot);
    options = new gd.PreviewExportOptions(project, outputDir);
    // The service-worker launcher also uses these wrappers after writing to IndexedDB.
    await run(exporter, options);
  } finally {
    if (options) options.delete();
    if (exporter) exporter.delete();
    adapter.delete();
  }
}

export function serializeHotReloadData(
  exporter: gdjsExporter,
  project: gdProject,
  options: gdPreviewExportOptions
): {
  projectData: any;
  runtimeGameOptions: any;
} {
  const projectData = withTemporaryResource(
    new gd.SerializerElement(),
    (element) => {
      exporter.serializeProjectData(project, options, element);
      return JSON.parse(gd.Serializer.toJSON(element));
    }
  );
  const runtimeGameOptions = withTemporaryResource(
    new gd.SerializerElement(),
    (element) => {
      exporter.serializeRuntimeGameOptions(options, element);
      return JSON.parse(gd.Serializer.toJSON(element));
    }
  );
  return { projectData, runtimeGameOptions };
}
