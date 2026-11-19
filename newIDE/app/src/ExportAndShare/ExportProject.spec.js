import BrowserFileSystem from './BrowserExporters/BrowserFileSystem';
import exportProject from './ExportProject';

const gd = global.gd;

describe('native export ownership', () => {
  let project;
  let releaseOrder;
  let run;
  let setTarget;
  let setAuthor;

  const performExport = () =>
    exportProject({
      project,
      gdjsRoot: '/engine',
      fileSystem: new BrowserFileSystem({ textFiles: [] }),
      outputDir: '/output',
      target: 'cordova',
      fallbackAuthor: { id: 'author', username: 'Author' },
    });

  beforeEach(() => {
    project = gd.ProjectHelper.createNewGDJSProject();
    releaseOrder = [];
    ['AbstractFileSystemJS', 'Exporter', 'ExportOptions'].forEach(name => {
      const prototype = gd[name].prototype;
      const release = prototype.delete;
      jest.spyOn(prototype, 'delete').mockImplementation(function() {
        releaseOrder.push(name);
        return release.call(this);
      });
    });
    run = jest.spyOn(gd.Exporter.prototype, 'exportWholePixiProject');
    setTarget = jest.spyOn(gd.ExportOptions.prototype, 'setTarget');
    setAuthor = jest.spyOn(gd.ExportOptions.prototype, 'setFallbackAuthor');
  });

  afterEach(() => {
    jest.restoreAllMocks();
    project.delete();
  });

  it('keeps exported HTML and the manifest readable after native disposal', () => {
    const fileSystem = new BrowserFileSystem({
      textFiles: [
        {
          filePath: '/engine/Runtime/index.html',
          text: '<html><!-- GDJS_CODE_FILES --></html>',
        },
        { filePath: '/engine/Runtime/Electron/LICENSE.GDevelop.txt', text: '' },
      ],
    });
    project.setName('Export ownership test');
    expect(
      exportProject({
        project,
        gdjsRoot: '/engine',
        outputDir: '/output',
        fileSystem,
        fallbackAuthor: null,
      })
    ).toBe(true);
    expect(releaseOrder).toEqual([
      'ExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
    ]);
    expect(fileSystem.readFile('/output/index.html')).toContain('data.js');
    expect(
      JSON.parse(fileSystem.readFile('/output/manifest.webmanifest')).name
    ).toBe('Export ownership test');
  });

  it.each([true, false])('preserves native export result %s', result => {
    run.mockReturnValue(result);
    expect(performExport()).toBe(result);
    expect(setTarget).toHaveBeenCalledWith('cordova');
    expect(setAuthor).toHaveBeenCalledWith('author', 'Author');
    expect(releaseOrder).toEqual([
      'ExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
    ]);
  });

  it('releases every allocated wrapper if setting options fails', () => {
    setAuthor.mockImplementation(() => {
      throw new Error('configuration failed');
    });
    expect(performExport).toThrow('configuration failed');
    expect(run).not.toHaveBeenCalled();
    expect(releaseOrder).toEqual([
      'ExportOptions',
      'Exporter',
      'AbstractFileSystemJS',
    ]);
  });

  it('releases the filesystem if assigning its implementation fails', () => {
    expect(() =>
      exportProject({
        project,
        gdjsRoot: '/engine',
        outputDir: '/output',
        fallbackAuthor: null,
        fileSystem: {
          get readFile() {
            throw new Error('unavailable');
          },
        },
      })
    ).toThrow('unavailable');
    expect(releaseOrder).toEqual(['AbstractFileSystemJS']);
  });
});
