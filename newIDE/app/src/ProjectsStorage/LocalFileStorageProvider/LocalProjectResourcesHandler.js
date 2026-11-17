// @flow

import {
  applyResourceDefaults,
  getLocalResourceFullPath,
  getResourceFilePathStatus,
} from '../../ResourcesList/ResourceUtils';
import { mapVector } from '../../Utils/MapFor';
import newNameGenerator from '../../Utils/NewNameGenerator';
import DesktopService from '../../Utils/DesktopService';
import { copyTextToClipboard } from '../../Utils/Clipboard';

const gd: libGDevelop = global.gd;

const path = DesktopService.getPath();

export const locateResourceFile = ({
  project,
  resource,
}: {|
  project: gdProject,
  resource: gdResource,
|}) => {
  if (!path) return;
  const resourceFilePath = getLocalResourceFullPath(
    project,
    resource.getName()
  );

  DesktopService.showItemInFolder(path.resolve(resourceFilePath));
};

export const openResourceFile = ({
  project,
  resource,
}: {|
  project: gdProject,
  resource: gdResource,
|}) => {
  if (!path) return;
  const resourceFilePath = getLocalResourceFullPath(
    project,
    resource.getName()
  );
  DesktopService.openPath(path.resolve(resourceFilePath));
};

export const copyResourceFilePath = ({
  project,
  resource,
}: {|
  project: gdProject,
  resource: gdResource,
|}) => {
  if (!path) return;
  const resourceFilePath = getLocalResourceFullPath(
    project,
    resource.getName()
  );
  copyTextToClipboard(path.resolve(resourceFilePath));
};

export const scanForNewResources = async ({
  project,
  extensions,
  createResource,
}: {|
  project: gdProject,
  extensions: Array<string>,
  createResource: () => gdResource,
|}) => {
  if (!path) return;

  const resourcesManager = project.getResourcesManager();
  const projectPath = path.dirname(project.getProjectFile());

  try {
    const allFiles: ?Array<string> = await DesktopService.globFiles({
      baseFolder: projectPath,
      extensions,
    });
    if (!allFiles) return;

    const filesToCheck = new gd.VectorString();
    allFiles.forEach(filePath =>
      filesToCheck.push_back(path.relative(projectPath, filePath))
    );
    const filePathsNotInResources = project
      .getResourcesManager()
      .findFilesNotInResources(filesToCheck);
    filesToCheck.delete();

    mapVector(filePathsNotInResources, (relativeFilePath: string) => {
      const resourceName = newNameGenerator(relativeFilePath, name =>
        resourcesManager.hasResource(name)
      );

      const resource = createResource();
      resource.setFile(relativeFilePath);
      resource.setName(resourceName);
      applyResourceDefaults(project, resource);
      resourcesManager.addResource(resource);
      resource.delete();

      console.info(
        `"${relativeFilePath}" added to project as resource named "${resourceName}".`
      );
    });
  } catch (error) {
    console.error(`Error finding files inside ${projectPath}:`, error);
    return;
  }
};

export const removeAllResourcesWithInvalidPath = ({
  project,
}: {|
  project: gdProject,
|}) => {
  const resourcesManager = project.getResourcesManager();
  const removedResourceNames = resourcesManager
    .getAllResourceNames()
    .toJSArray()
    .filter(resourceName => {
      return getResourceFilePathStatus(project, resourceName) === 'error';
    });

  removedResourceNames.forEach(resourceName => {
    resourcesManager.removeResource(resourceName);
    console.info('Removed due to invalid path: ' + resourceName);
  });
};
