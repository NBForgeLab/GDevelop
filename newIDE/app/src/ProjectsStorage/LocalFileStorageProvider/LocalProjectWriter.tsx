import { t, Trans } from '@lingui/macro';
import * as React from 'react';
import {
  serializeToJSObject,
  serializeToJSON,
  addFinalNewline,
} from '../../Utils/Serializer';
import { serializeToJSObjectInBackground } from '../../Utils/BackgroundSerializer';
import {
  type FileMetadata,
  type SaveAsLocation,
  type SaveAsOptions,
  type SaveProjectOptions,
} from '../index';
import optionalRequire from '../../Utils/OptionalRequire';
import {
  getLastUsedDialogDirectory,
  rememberLastUsedDialogDirectory,
} from '../../Utils/FileSystem';
import {
  split,
  splitPaths,
  getSlugifiedUniqueNameFromProperty,
} from '../../Utils/ObjectSplitter';
import type { MessageDescriptor } from '../../Utils/i18n/MessageDescriptor';
import LocalFolderPicker from '../../UI/LocalFolderPicker';
import SaveAsOptionsDialog from '../SaveAsOptionsDialog';
import {
  type ShowAlertFunction,
  type ShowConfirmFunction,
} from '../../UI/Alert/AlertContext';

const fs = optionalRequire('fs-extra');
const path = optionalRequire('path');
const remote = optionalRequire('@electron/remote');
const dialog = remote ? remote.dialog : null;

export const splittedProjectFolderNames = [
  'layouts',
  'externalLayouts',
  'externalEvents',
  'eventsFunctionsExtensions',
];

const deleteExistingFilesFromDirs = (
  project: gdProject,
  projectPath: string
) => {
  //If multiFile is not enabled in settings and directories do not exist.
  if (!project.isFolderProject()) return;

  const entries = fs.readdirSync(projectPath);
  entries.forEach((entry: string) => {
    if (!splittedProjectFolderNames.includes(entry)) return;

    const dirPath = path.join(projectPath, entry);
    if (!fs.statSync(dirPath).isDirectory()) return;

    const filenames = fs.readdirSync(dirPath);
    filenames.forEach((file: string) => {
      const fileToRemovePath = path.join(dirPath, file);
      try {
        fs.unlinkSync(fileToRemovePath);
      } catch (e) {
        throw new Error(
          `Unable to remove file ${file}: ${
            e instanceof Error ? e.message : String(e)
          }`
        );
      }
    });
  });
};

const checkFileContent = (filePath: string, expectedContent: string) => {
  const time = performance.now();
  return new Promise<void>((resolve, reject) => {
    fs.readFile(
      filePath,
      { encoding: 'utf8' },
      (err: Error | null, content: string) => {
        if (err) return reject(err);

        if (content === '') {
          reject(new Error(`Written file is empty, did the write fail?`));
        }
        if (content !== expectedContent) {
          reject(
            new Error(
              `Written file is not containing the expected content, did the write fail?`
            )
          );
        }
        const verificationTime = performance.now() - time;
        console.info(
          `Verified ${filePath} content in ${verificationTime.toFixed()}ms.`
        );
        resolve();
      }
    );
  });
};

const writeAndCheckFile = async (
  content: string,
  filePath: string
): Promise<void> => {
  if (!fs) throw new Error('Filesystem is not supported.');
  if (content === '')
    throw new Error('The content to save on disk is empty. Aborting.');

  await fs.ensureDir(path.dirname(filePath));

  await fs.writeFile(filePath, content);
  await checkFileContent(filePath, content);
};

const writeAndCheckFormattedJSONFile = async (
  object: Record<string, any>,
  filePath: string
): Promise<void> => {
  const content = addFinalNewline(JSON.stringify(object, null, 2));
  await writeAndCheckFile(content, filePath);
};

const writeProjectFiles = async ({
  project,
  filePath,
  projectPath,
  useBackgroundSerializer,
  canonicalEventSerialization,
}: {
  project: gdProject;
  filePath: string;
  projectPath: string;
  useBackgroundSerializer: boolean;
  canonicalEventSerialization: boolean;
}): Promise<void> => {
  const startTime = Date.now();

  let serializedProjectObject;
  if (useBackgroundSerializer) {
    // Canonical mode is currently not propagated to the background
    // serializer worker (which uses its own libGD instance). Background
    // serialization is hardcoded off in MainFrame so this is not
    // exercised in production yet.
    serializedProjectObject = await serializeToJSObjectInBackground(project);
  } else {
    serializedProjectObject = serializeToJSObject(project, 'serializeTo', {
      canonicalEventSerialization,
    });
  }
  const serializeEndTime = Date.now();

  if (project.isFolderProject()) {
    const partialObjects = split(serializedProjectObject, {
      pathSeparator: '/',
      getArrayItemReferenceName: getSlugifiedUniqueNameFromProperty('name'),
      shouldSplit: splitPaths(
        new Set(
          splittedProjectFolderNames.map((folderName) => `/${folderName}/*`)
        )
      ),
      isReferenceMagicPropertyName: '__REFERENCE_TO_SPLIT_OBJECT',
    });

    return Promise.all(
      partialObjects.map((partialObject) => {
        return writeAndCheckFormattedJSONFile(
          partialObject.object,
          path.join(projectPath, partialObject.reference) + '.json'
        ).catch((err) => {
          console.error('Unable to write a partial file:', err);
          throw err;
        });
      })
    ).then(() => {
      return writeAndCheckFormattedJSONFile(
        serializedProjectObject,
        filePath
      ).catch((err) => {
        console.error('Unable to write the split project:', err);
        throw err;
      });
    });
  } else {
    await writeAndCheckFormattedJSONFile(serializedProjectObject, filePath);
  }

  console.log(
    `[LocalProjectWriter] Project file(s) written in ${
      Date.now() - startTime
    }ms (including ${serializeEndTime - startTime}ms for ${
      useBackgroundSerializer ? 'background' : 'main'
    } thread serialization)`
  );
};

export const onSaveProject = async (
  project: gdProject,
  fileMetadata: FileMetadata,
  saveOptions: SaveProjectOptions | undefined,
  actions: {
    showAlert: ShowAlertFunction;
    showConfirmation: ShowConfirmFunction;
  }
): Promise<{
  wasSaved: boolean;
  fileMetadata: FileMetadata;
}> => {
  const canBeSafelySaved = await canFileMetadataBeSafelySaved(
    fileMetadata,
    saveOptions,
    actions
  );
  if (!canBeSafelySaved) {
    return { wasSaved: false, fileMetadata: fileMetadata };
  }

  const filePath = fileMetadata.fileIdentifier;
  const now = Date.now();
  if (!filePath) {
    throw new Error('Unable to find file path before saving.');
  }
  // Ensure we always pick the latest name and gameId.
  const newFileMetadata = {
    ...fileMetadata,
    name: project.getName(),
    gameId: project.getProjectUuid(),
    lastModifiedDate: now,
  };

  const projectPath = path.dirname(filePath);

  try {
    deleteExistingFilesFromDirs(project, projectPath);
  } catch (e) {
    console.warn('Unable to clean project folder before saving project: ', e);
  }

  await writeProjectFiles({
    project,
    filePath,
    projectPath,
    useBackgroundSerializer:
      !!saveOptions && !!saveOptions.useBackgroundSerializer,
    canonicalEventSerialization:
      !!saveOptions && !!saveOptions.canonicalEventSerialization,
  });
  return {
    wasSaved: true,
    fileMetadata: newFileMetadata,
  };
};

export const generateOnChooseSaveProjectAsLocation =
  ({
    setDialog,
    closeDialog,
  }: {
    setDialog: (arg0: () => React.ReactNode) => void;
    closeDialog: () => void;
  }): ((arg0: {
    displayOptionToGenerateNewProjectUuid: boolean;
    fileMetadata: FileMetadata | null | undefined;
    project: gdProject;
  }) => Promise<{
    saveAsLocation: SaveAsLocation | null | undefined;
    saveAsOptions: SaveAsOptions | null | undefined;
  }>) =>
  async ({
    project,
    fileMetadata,
    displayOptionToGenerateNewProjectUuid,
  }: {
    project: gdProject;
    // This is the current location.
    fileMetadata: FileMetadata | null | undefined;
    displayOptionToGenerateNewProjectUuid: boolean;
  }): Promise<{
    // This is the newly chosen location (or null if cancelled).
    saveAsLocation: SaveAsLocation | null | undefined;
    saveAsOptions: SaveAsOptions | null | undefined;
  }> => {
    const options = await new Promise<{
      name: string;
      generateNewProjectUuid: boolean;
    } | null>((resolve) => {
      setDialog(() => (
        <SaveAsOptionsDialog
          onCancel={() => {
            closeDialog();
            resolve(null);
          }}
          nameSuggestion={
            fileMetadata ? `${project.getName()} - Copy` : project.getName()
          }
          mainActionLabel={<Trans>Continue</Trans>}
          displayOptionToGenerateNewProjectUuid={
            displayOptionToGenerateNewProjectUuid
          }
          onSave={(options) => {
            closeDialog();
            resolve(options);
          }}
        />
      ));
    });

    if (!options) return { saveAsLocation: null, saveAsOptions: null }; // Save was cancelled.

    let defaultPath = fileMetadata ? fileMetadata.fileIdentifier : '';
    const { name } = options;
    if (path && defaultPath && name) {
      const safeFilename = name.replace(/[<>:"/\\|?*]/g, '_');
      defaultPath = path.join(
        path.dirname(defaultPath),
        `${safeFilename}.json`
      );
    }

    const browserWindow = remote.getCurrentWindow();
    const saveDialogOptions = {
      defaultPath: defaultPath || getLastUsedDialogDirectory(),
      filters: [{ name: 'GDevelop 5 project', extensions: ['json'] }],
    };

    if (!dialog) {
      throw new Error('Unsupported');
    }
    const filePath = dialog.showSaveDialogSync(
      browserWindow,
      saveDialogOptions
    );
    if (!filePath) {
      return { saveAsLocation: null, saveAsOptions: null };
    }
    rememberLastUsedDialogDirectory(filePath);

    return {
      saveAsLocation: {
        name: options.name,
        fileIdentifier: filePath,
      },
      saveAsOptions: {
        generateNewProjectUuid: options.generateNewProjectUuid,
      },
    };
  };

export const onSaveProjectAs = async (
  project: gdProject,
  saveAsLocation: SaveAsLocation | null | undefined,
  options: {
    onStartSaving: () => void;
    onMoveResources: (arg0: { newFileMetadata: FileMetadata }) => Promise<void>;
  }
): Promise<{
  wasSaved: boolean;
  fileMetadata: FileMetadata | null | undefined;
}> => {
  if (!saveAsLocation)
    throw new Error('A location was not chosen before saving as.');
  const filePath = saveAsLocation.fileIdentifier;
  if (!filePath)
    throw new Error('A file path was not chosen before saving as.');

  options.onStartSaving();

  // Ensure we always pick the latest name and gameId.
  const newFileMetadata = {
    fileIdentifier: filePath,
    name: project.getName(),
    gameId: project.getProjectUuid(),
    lastModifiedDate: Date.now(),
  };

  // Move (copy or download, etc...) the resources first.
  await options.onMoveResources({ newFileMetadata });

  // Save the project when resources have been copied.
  const projectPath = path.dirname(filePath);
  project.setProjectFile(filePath);

  await writeProjectFiles({
    project,
    filePath,
    projectPath,
    useBackgroundSerializer: false,
    // SaveAs is a one-off operation: the user will typically save again
    // through the normal onSaveProject path, which honors the preference.
    canonicalEventSerialization: false,
  });
  return {
    wasSaved: true,
    fileMetadata: newFileMetadata,
  };
};

export const onAutoSaveProject = (
  project: gdProject,
  fileMetadata: FileMetadata
): Promise<void> => {
  const autoSavePath = fileMetadata.fileIdentifier + '.autosave';
  return writeAndCheckFile(serializeToJSON(project), autoSavePath).catch(
    (err) => {
      console.error(`Unable to write ${autoSavePath}:`, err);
      throw err;
    }
  );
};

export const getWriteErrorMessage = (error: Error): MessageDescriptor =>
  t`An error occurred when saving the project. Please try again by choosing another location.`;

// See https://learn.microsoft.com/en-us/windows/win32/fileio/naming-a-file
const forbiddenCharacterRegex = /\\ | \/ | : | \* | \? | " | < | > | \|/g;
const consecutiveSpacesRegex = /\s+/g;
const cleanUpProjectFileName = (projectFileName: string) =>
  (projectFileName.length > 200
    ? projectFileName.substring(0, 200)
    : projectFileName
  )
    .replace(forbiddenCharacterRegex, ' ')
    .replace(consecutiveSpacesRegex, ' ')
    .trim();

export const getProjectLocation = ({
  projectName,
  saveAsLocation,
  newProjectsDefaultFolder,
}: {
  projectName: string;
  saveAsLocation: SaveAsLocation | null | undefined;
  newProjectsDefaultFolder?: string;
}): SaveAsLocation => {
  const outputPath = saveAsLocation
    ? path.dirname(saveAsLocation.fileIdentifier)
    : newProjectsDefaultFolder
      ? newProjectsDefaultFolder
      : '';
  const projectFileName = projectName
    ? cleanUpProjectFileName(projectName) + '.json'
    : 'game.json';
  return {
    fileIdentifier: path.join(outputPath, projectFileName),
  };
};

export const renderNewProjectSaveAsLocationChooser = ({
  projectName,
  saveAsLocation,
  setSaveAsLocation,
  newProjectsDefaultFolder,
}: {
  projectName: string;
  saveAsLocation: SaveAsLocation | null | undefined;
  setSaveAsLocation: (arg0: SaveAsLocation | null | undefined) => void;
  newProjectsDefaultFolder?: string;
}): React.ReactNode => {
  const projectLocation = getProjectLocation({
    projectName,
    saveAsLocation,
    newProjectsDefaultFolder,
  });
  return (
    <LocalFolderPicker
      fullWidth
      value={path.dirname(projectLocation.fileIdentifier)}
      onChange={(newOutputPath) => {
        const newOutputFileIdentifier = path.join(
          newOutputPath,
          path.basename(projectLocation.fileIdentifier)
        );
        setSaveAsLocation(
          getProjectLocation({
            projectName,
            saveAsLocation: {
              fileIdentifier: newOutputFileIdentifier,
            },
            newProjectsDefaultFolder,
          })
        );
      }}
      type="create-game"
    />
  );
};

const isTryingToSaveInForbiddenPath = (filePath: string): boolean => {
  if (!remote) return false; // This should not happen, but let's be safe.
  // If the user is saving locally and chose the same location as where the
  // executable is running, prevent this, as it will be deleted when the app is updated.
  const exePath = remote.app.getPath('exe');
  if (!exePath) return false; // This should not happen, but let's be safe.
  const gdevelopDirectory = path.dirname(exePath);
  return filePath.startsWith(gdevelopDirectory);
};

export const canFileMetadataBeSafelySaved = async (
  fileMetadata: FileMetadata,
  saveOptions: SaveProjectOptions | null | undefined,
  actions: {
    showAlert: ShowAlertFunction;
    showConfirmation: ShowConfirmFunction;
  }
): Promise<boolean> => {
  const path = fileMetadata.fileIdentifier;
  if (isTryingToSaveInForbiddenPath(path)) {
    await actions.showAlert({
      title: t`Choose another location`,
      message: t`Your project is saved in the same folder as the application. This folder will be deleted when the application is updated. Please choose another location if you don't want to lose your project.`,
    });
  }

  // We don't block the save, in case the user wants to save anyway.
  return true;
};

export const canFileMetadataBeSafelySavedAs = async (
  fileMetadata: FileMetadata,
  actions: {
    showAlert: ShowAlertFunction;
    showConfirmation: ShowConfirmFunction;
  }
): Promise<boolean> => {
  const path = fileMetadata.fileIdentifier;
  if (isTryingToSaveInForbiddenPath(path)) {
    await actions.showAlert({
      title: t`Choose another location`,
      message: t`Your project is saved in the same folder as the application. This folder will be deleted when the application is updated. Please choose another location if you don't want to lose your project.`,
    });

    // We block the save as we don't want new projects to be saved there.
    return false;
  }

  return true;
};
