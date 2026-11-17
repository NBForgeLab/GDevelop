// @flow
import DesktopService from '../../Utils/DesktopService';
import PromisePool from '@supercharge/promise-pool';
import { retryIfFailed } from '../../Utils/RetryIfFailed';
import newNameGenerator from '../../Utils/NewNameGenerator';
import { type FileMetadata } from '../index';
import {
  extractDecodedFilenameWithExtensionFromProductAuthorizedUrl,
  fetchTokenForPrivateGameTemplateAuthorizationIfNeeded,
  isPrivateGameTemplateResourceAuthorizedUrl,
  isProductAuthorizedResourceUrl,
} from '../../Utils/GDevelopServices/Shop';
import {
  extractDecodedFilenameWithExtensionFromPublicAssetResourceUrl,
  isPublicAssetResourceUrl,
} from '../../Utils/GDevelopServices/Asset';
import {
  isBlobURL,
  isURL,
  parseLocalFilePathOrExtensionFromMetadata,
} from '../../ResourcesList/ResourceUtils';
import { sanitizeFilename, sanitizeFilePath } from '../../Utils/Filename';
import { type AuthenticatedUser } from '../../Profile/AuthenticatedUserContext';
import { extractDecodedFilenameFromProjectResourceUrl } from '../../Utils/GDevelopServices/Project';
import axios from 'axios';
const fs = DesktopService.getFs();
const path = DesktopService.getPath();

type Options = {|
  project: gdProject,
  fileMetadata: FileMetadata,
  onProgress: (number, number) => void,
  authenticatedUser: AuthenticatedUser,
|};

const isPathInFolder = (folderPath: string, filePath: string): boolean => {
  if (!path) return false;
  const relativePath = path.relative(folderPath, filePath);
  return (
    !!relativePath &&
    relativePath !== '..' &&
    !relativePath.startsWith('..' + path.sep) &&
    !path.isAbsolute(relativePath)
  );
};

const generateUnusedFilepath = (
  basePath: string,
  alreadyUsedFilePaths: Set<string>,
  unsafeFilename: string
) => {
  if (!path || !fs) throw new Error('Unsupported');
  const localPath = path;
  const localFs = fs;
  // The filename comes from the project (a resource URL or name), so it must
  // not be able to point outside of the base folder.
  const filename = isPathInFolder(
    basePath,
    localPath.join(basePath, unsafeFilename)
  )
    ? unsafeFilename
    : sanitizeFilename(unsafeFilename);
  const directory = localPath.dirname(filename);
  const extension = localPath.extname(filename);
  const filenameWithoutExtension = localPath.basename(filename, extension);
  const name = newNameGenerator(filenameWithoutExtension, name => {
    const tentativePath = localPath.join(basePath, directory, name) + extension;
    return (
      localFs.existsSync(tentativePath) ||
      alreadyUsedFilePaths.has(tentativePath)
    );
  });
  return localPath.join(basePath, directory, name) + extension;
};

const generateUnusedFilepathFromResourceName = (
  baseAssetsPath: string,
  alreadyUsedFilePaths: Set<string>,
  resourceName: string,
  extension: string
) => {
  const filename = sanitizeFilePath(resourceName + (extension || ''));
  return generateUnusedFilepath(
    baseAssetsPath,
    alreadyUsedFilePaths,
    filename.startsWith('assets/')
      ? filename.substring('assets/'.length)
      : filename
  );
};

const downloadBlobToLocalFile = async (
  blobUrl: string,
  filePath: string
): Promise<void> => {
  if (!DesktopService.isDesktop()) throw new Error('Not supported');

  // $FlowFixMe[underconstrained-implicit-instantiation]
  const response = await axios.get(blobUrl, {
    responseType: 'arraybuffer',
  });
  const arrayBuffer = response.data;

  await DesktopService.fileTransfer.saveLocalFileFromArrayBuffer(
    arrayBuffer,
    filePath
  );
};

// This mover can be used for both public URLs and Cloud project resources.
export const moveUrlResourcesToLocalFiles = async ({
  project,
  fileMetadata,
  onProgress,
  authenticatedUser,
}: Options): Promise<{
  erroredResources: Array<{ error: any, resourceName: string }>,
}> => {
  if (!fs || !path || !DesktopService.isDesktop())
    throw new Error('Unsupported');
  const localFs = fs;
  const localPath = path;

  // Get all resources to download.
  const resourcesManager = project.getResourcesManager();
  const allResourceNames = resourcesManager.getAllResourceNames().toJSArray();
  const resourcesToFetchNames = allResourceNames.filter(resourceName => {
    const resource = resourcesManager.getResource(resourceName);
    const resourceFile = resource.getFile();
    return isURL(resourceFile);
  });
  const tokenForPrivateGameTemplateAuthorization = await fetchTokenForPrivateGameTemplateAuthorizationIfNeeded(
    {
      authenticatedUser,
      allResourcePaths: resourcesToFetchNames.map(resourceName => {
        const resource = resourcesManager.getResource(resourceName);
        return resource.getFile();
      }),
    }
  );

  const projectPath = localPath.dirname(fileMetadata.fileIdentifier);
  const baseAssetsPath = localPath.join(projectPath, 'assets');
  const downloadedFilePaths = new Set<string>();
  const erroredResources = [];

  let fetchedResourcesCount = 0;

  await PromisePool.withConcurrency(50)
    .for(resourcesToFetchNames) // It's important not to loop on allResourceNames, as calling the onProgress can be costly on the UI.
    .process(async resourceName => {
      const resource = resourcesManager.getResource(resourceName);

      const resourceFile = resource.getFile();
      if (isURL(resourceFile)) {
        if (isBlobURL(resourceFile)) {
          try {
            const {
              localFilePath,
              extension,
            } = parseLocalFilePathOrExtensionFromMetadata(resource);
            const resolvedLocalFilePath = localFilePath
              ? localPath.resolve(projectPath, localFilePath)
              : null;
            // The local file path comes from the project, so it's only used
            // if it stays inside the project folder.
            const downloadedFilePath =
              resolvedLocalFilePath &&
              isPathInFolder(projectPath, resolvedLocalFilePath)
                ? resolvedLocalFilePath
                : generateUnusedFilepathFromResourceName(
                    baseAssetsPath,
                    downloadedFilePaths,
                    resource.getName(),
                    extension || ''
                  );

            await localFs.ensureDir(baseAssetsPath);
            await localFs.ensureDir(localPath.dirname(downloadedFilePath));
            await downloadBlobToLocalFile(resourceFile, downloadedFilePath);
            resource.setFile(
              localPath
                .relative(projectPath, downloadedFilePath)
                .replace(/\\/g, '/')
            );
          } catch (error) {
            erroredResources.push({ resourceName, error });
          }
        } else {
          let filename;
          if (isProductAuthorizedResourceUrl(resourceFile)) {
            // Resource is coming from a private asset or private game template.
            filename = extractDecodedFilenameWithExtensionFromProductAuthorizedUrl(
              resourceFile
            );
          } else if (isPublicAssetResourceUrl(resourceFile)) {
            // Resource is coming from a public asset.
            filename = extractDecodedFilenameWithExtensionFromPublicAssetResourceUrl(
              resourceFile
            );
          } else {
            // Resource is a project resource or a generic url.
            filename = extractDecodedFilenameFromProjectResourceUrl(
              resourceFile
            );
          }

          // Find a new file for the resource to download.
          const downloadedFilePath = generateUnusedFilepath(
            baseAssetsPath,
            downloadedFilePaths,
            filename
          );
          downloadedFilePaths.add(downloadedFilePath);

          try {
            await retryIfFailed({ times: 2 }, async () => {
              await localFs.ensureDir(baseAssetsPath);
              const resourceUrl = new URL(resourceFile);
              if (
                isPrivateGameTemplateResourceAuthorizedUrl(resourceUrl.href) &&
                tokenForPrivateGameTemplateAuthorization
              ) {
                resourceUrl.searchParams.set(
                  'token',
                  tokenForPrivateGameTemplateAuthorization
                );
              }
              const encodedUrl = resourceUrl.href; // Encode the URL to support special characters in file names.
              await DesktopService.fileTransfer.downloadLocalFile(
                encodedUrl,
                downloadedFilePath
              );
              resource.setFile(
                localPath
                  .relative(projectPath, downloadedFilePath)
                  .replace(/\\/g, '/')
              );
            });
          } catch (error) {
            erroredResources.push({ resourceName, error });
          }
        }
      }

      onProgress(fetchedResourcesCount++, resourcesToFetchNames.length);
    });

  return {
    erroredResources,
  };
};
