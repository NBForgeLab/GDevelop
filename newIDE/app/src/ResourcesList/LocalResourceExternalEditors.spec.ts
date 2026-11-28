import { makeTestProject } from '../fixtures/TestProject';
import optionalRequire from '../Utils/OptionalRequire';
import path from 'path';
import {
  downloadUrlsToBlobs,
  convertBlobToDataURL,
} from '../Utils/BlobDownloader';
import { downloadAndPrepareExternalEditorBase64Resources } from './LocalResourceExternalEditors';
const gd: libGDevelop = global.gd;

jest.mock('../Utils/BlobDownloader');
jest.mock('../Utils/OptionalRequire');

const mockFn = (fn: Function): jest.Mock<any, any> => fn as jest.Mock<any, any>;
const mockOptionalRequire = optionalRequire as typeof optionalRequire & {
  mockFs: {
    promises: {
      readFile: jest.Mock<any, any>;
    };
  };
};

const classicUrl = 'https://www.example.com/file-to-download.png';
const localFile = 'some/local-file.png';

const makeTestProjectWithResourcesToDownload = () => {
  const { project } = makeTestProject(gd);

  {
    const newResource = new gd.ImageResource();
    newResource.setName('MyResourceToDownload');
    newResource.setFile(classicUrl);
    project.getResourcesManager().addResource(newResource);
    newResource.delete();
  }
  {
    const newResource = new gd.ImageResource();
    newResource.setName('MyLocalFile');
    newResource.setFile(localFile);
    project.getResourcesManager().addResource(newResource);
    newResource.delete();
  }

  return project;
};

describe('LocalResourceExternalEditors', () => {
  describe('downloadAndPrepareExternalEditorBase64Resources', () => {
    let project: gdProject | null = null;
    beforeEach(() => {
      mockFn(downloadUrlsToBlobs).mockReset();
      mockFn(mockOptionalRequire.mockFs.promises.readFile).mockReset();
    });
    afterEach(() => {
      if (project) project.delete();
      project = null;
    });
    test('Can download files or read local files', async () => {
      project = makeTestProjectWithResourcesToDownload();

      // Mock the successful download of a resource.
      mockFn(downloadUrlsToBlobs).mockImplementation(
        async ({ urlContainers }) => {
          return urlContainers.map((urlContainer: unknown) => ({
            error: null,
            blob: { content: 'fake-blob' },
            item: urlContainer,
          }));
        }
      );
      mockFn(convertBlobToDataURL).mockImplementation(async () => {
        return 'data:fake/data-url;base64,0123456789ABCDEF';
      });

      // Mock the reading of a local file.
      mockFn(mockOptionalRequire.mockFs.promises.readFile).mockImplementation(
        async () => 'somefakecontent'
      );

      const result = await downloadAndPrepareExternalEditorBase64Resources({
        project,
        resourceNames: ['NotExisting', 'MyResourceToDownload', 'MyLocalFile'],
      });

      // Check that the file were downloaded/read.
      expect(mockOptionalRequire.mockFs.promises.readFile).toHaveBeenCalledWith(
        path.resolve('some/local-file.png')
      );
      expect(result).toMatchInlineSnapshot(`
[
  {
    "dataUrl": "",
    "name": "NotExisting",
  },
  {
    "dataUrl": "data:fake/data-url;base64,0123456789ABCDEF",
    "localFilePath": undefined,
    "name": "MyResourceToDownload",
  },
  {
    "dataUrl": "data:text/plain;base64,somefakecontent",
    "localFilePath": "some/local-file.png",
    "name": "MyLocalFile",
  },
]
`);
    });
  });
});
