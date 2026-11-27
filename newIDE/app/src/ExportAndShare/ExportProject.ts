import assignIn from 'lodash/assignIn';
import withTemporaryResource from '../Utils/WithTemporaryResource';
import type BrowserFileSystem from './BrowserExporters/BrowserFileSystem';
import type LocalFileSystem from './LocalExporters/LocalFileSystem';

const gd: libGDevelop = global.gd;

// Exporter borrows its filesystem. Keep both alive throughout the native call.
export default function exportProject({
  fileSystem,
  gdjsRoot,
  project,
  outputDir,
  fallbackAuthor,
  target,
}: {
  fileSystem: BrowserFileSystem | LocalFileSystem;
  gdjsRoot: string;
  project: gdProject;
  outputDir: string;
  fallbackAuthor:
    | {
        id: string;
        username: string;
      }
    | null
    | undefined;
  target?: string;
}): boolean {
  return withTemporaryResource(
    new gd.AbstractFileSystemJS(),
    (nativeFileSystem) => {
      assignIn(nativeFileSystem, fileSystem);
      return withTemporaryResource(
        new gd.Exporter(nativeFileSystem, gdjsRoot),
        (exporter) =>
          withTemporaryResource(
            new gd.ExportOptions(project, outputDir),
            (options) => {
              if (target) options.setTarget(target);
              if (fallbackAuthor)
                options.setFallbackAuthor(
                  fallbackAuthor.id,
                  fallbackAuthor.username
                );
              return exporter.exportWholePixiProject(options);
            }
          )
      );
    }
  );
}
