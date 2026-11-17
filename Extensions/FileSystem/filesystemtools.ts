namespace gdjs {
  const logger = new gdjs.Logger('Filesystem');

  /** @category Other extensions > File System */
  export namespace fileSystem {
    const getPreviewBridge = (): any =>
      typeof window !== 'undefined' &&
      (window as any).gdevelopPreview &&
      (window as any).gdevelopPreview.isPreview
        ? (window as any).gdevelopPreview
        : null;

    // The Node.js path module, or null if it can't be loaded.
    const nodePath: typeof import('path') | null =
      typeof require !== 'undefined' ? require('path') : null;
    // The Node.js fs module, or null if it can't be loaded.
    const nodeFs: typeof import('fs') | null =
      typeof require !== 'undefined' ? require('fs') : null;
    const nodeAsyncFs: typeof import('fs/promises') | null =
      typeof require !== 'undefined' ? require('fs/promises') : null;

    const getPathApi = (): any => nodePath || getPreviewBridge()?.path || null;
    const getFsApi = (): any => nodeFs || getPreviewBridge()?.fs || null;
    const getAsyncFsApi = (): any =>
      nodeAsyncFs || getPreviewBridge()?.fs?.promises || null;

    const getElectronAppPath = (
      instanceContainer: gdjs.RuntimeInstanceContainer,
      name: string
    ): string => {
      const renderer = instanceContainer.getGame().getRenderer();
      const previewBridge =
        typeof renderer.getElectronPreviewBridge === 'function'
          ? renderer.getElectronPreviewBridge()
          : null;
      if (
        previewBridge &&
        previewBridge.app &&
        typeof previewBridge.app.getPath === 'function'
      ) {
        try {
          return previewBridge.app.getPath(name) || '';
        } catch (err) {
          logger.error(`Unable to get preview app path "${name}":`, err);
          return '';
        }
      }
      const remote = renderer.getElectronRemote();
      const app = remote ? remote.app : null;
      if (app) {
        return app.getPath(name) || '';
      }
      return '';
    };

    if (!getFsApi())
      logger.warn(
        'Filesystem is not supported on this platform! Only PC builds support filesystem access.'
      );

    export const getDirectoryName = function (fileOrFolderPath: string) {
      const path = getPathApi();
      if (!path) {
        return '';
      }
      return path.dirname(fileOrFolderPath);
    };

    export const getFileName = function (filePath: string) {
      const path = getPathApi();
      if (!path) {
        return '';
      }
      return path.basename(filePath);
    };

    export const getExtensionName = function (filePath: string) {
      const path = getPathApi();
      if (!path) {
        return '';
      }
      return path.extname(filePath);
    };

    /**
     * Get the path to 'Desktop' folder.
     * @param instanceContainer The current container
     * @return The path to the desktop folder
     */
    export const getDesktopPath = function (
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): string {
      return getElectronAppPath(instanceContainer, 'desktop');
    };

    /**
     * Get the path to 'Documents' folder.
     * @param instanceContainer The current container
     * @return The path to the documents folder
     */
    export const getDocumentsPath = function (
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): string {
      return getElectronAppPath(instanceContainer, 'documents');
    };

    /**
     * Get the path to 'Pictures' folder.
     * @param instanceContainer The current container
     * @return The path to the pictures folder
     */
    export const getPicturesPath = function (
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): string {
      return getElectronAppPath(instanceContainer, 'pictures');
    };

    /**
     * Get the path to this application 'Executable' file.
     * @param instanceContainer The current container
     * @return The path to this applications executable file
     */
    export const getExecutablePath = function (
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): string {
      return getElectronAppPath(instanceContainer, 'exe');
    };

    /**
     * Get the path to this application 'Executable' folder.
     * @param instanceContainer The current container
     * @return The path to this applications executable folder
     */
    export const getExecutableFolderPath = function (
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): string {
      const executablePath = getExecutablePath(instanceContainer);
      const path = getPathApi();
      if (!path) {
        return '';
      }
      return path.dirname(executablePath);
    };

    /**
     * Get the path to 'UserData' folder.
     * @param instanceContainer The current container
     * @return The path to userdata folder
     */
    export const getUserdataPath = function (
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): string {
      return getElectronAppPath(instanceContainer, 'userData');
    };

    /**
     * Get the path to the user's home folder (on Windows `C:\Users\<USERNAME>\` for example).
     * @return The path to user's "home" folder
     */
    export const getUserHomePath = function (
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): string {
      return getElectronAppPath(instanceContainer, 'home');
    };

    /**
     * Get the path to 'Temp' folder.
     * @param instanceContainer The current container
     * @return The path to temp folder
     */
    export const getTempPath = function (
      instanceContainer: gdjs.RuntimeInstanceContainer
    ): string {
      return getElectronAppPath(instanceContainer, 'temp');
    };

    /**
     * Get the path delimiter specific to the operating system.
     * @return The path delimiter
     */
    export const getPathDelimiter = function (): string {
      const path = getPathApi();
      if (path) {
        return path.sep || '/';
      } else {
        return '/';
      }
    };

    /**
     * Create a new directory at the given path.
     * @param directory The path to create a new directory
     * @param resultVar The variable where to store the result of the operation
     */
    export const makeDirectory = function (
      directory: string,
      resultVar: gdjs.Variable
    ) {
      let result = 'error';
      const fs = getFsApi();
      if (fs) {
        try {
          fs.mkdirSync(directory);
          result = 'ok';
        } catch (err) {
          logger.error(
            "Unable to create directory at: '" + directory + "': ",
            err
          );
        }
      }
      resultVar.setString(result);
    };

    export const makeDirectoryAsync = (
      directory: string,
      resultVar: gdjs.Variable
    ) => {
      const asyncFs = getAsyncFsApi();
      return asyncFs
        ? new gdjs.PromiseTask(
            asyncFs
              .mkdir(directory, { recursive: true })
              .then(() => {
                resultVar.setString('ok');
              })
              .catch((err) => {
                resultVar.setString('error');
                logger.error(
                  "Unable to create directory at: '" + directory + "': ",
                  err
                );
              })
          )
        : (resultVar.setString('error'), new gdjs.ResolveTask());
    };

    /**
     * Save a string into a file, asynchronously.
     * @param text The string to be saved
     * @param savePath Path to the file
     * @param resultVar The variable where to store the result of the operation
     */
    export const saveStringToFileAsync = function (
      text: string,
      savePath: string,
      resultVar: gdjs.Variable
    ) {
      const fs = getFsApi();
      if (fs) {
        fs.writeFile(savePath, text, 'utf8', (err) => {
          resultVar.setString('ok');
          if (err) {
            logger.error(
              "Unable to save the text to path: '" + savePath + "': ",
              err
            );
            resultVar.setString('error');
          }
        });
      }
    };

    export const saveStringToFileAsyncTask = (
      text: string,
      savePath: string,
      resultVar: gdjs.Variable
    ) => {
      const asyncFs = getAsyncFsApi();
      return asyncFs
        ? new gdjs.PromiseTask(
            asyncFs
              .writeFile(savePath, text, { encoding: 'utf8' })
              .then(() => {
                resultVar.setString('ok');
              })
              .catch((err) => {
                resultVar.setString('error');
                logger.error(
                  "Unable to save the text to path: '" + savePath + "': ",
                  err
                );
              })
          )
        : (resultVar.setString('error'), new gdjs.ResolveTask());
    };

    /**
     * Save a string into a file.
     * @param text The string to be saved
     * @param savePath Path to the file
     * @param resultVar The variable where to store the result of the operation
     */
    export const saveStringToFile = function (
      text: string,
      savePath: string,
      resultVar: gdjs.Variable
    ) {
      let result = 'error';
      const fs = getFsApi();
      if (fs) {
        try {
          fs.writeFileSync(savePath, text, 'utf8');
          result = 'ok';
        } catch (err) {
          logger.error(
            "Unable to save the text to path: '" + savePath + "': ",
            err
          );
        }
      }
      resultVar.setString(result);
    };

    /**
     * Save a variable into a file in JSON format.
     * @param variable The variable to be saved
     * @param savePath Path to the file
     * @param resultVar The variable where to store the result of the operation
     */
    export const saveVariableToJSONFile = function (
      variable: gdjs.Variable,
      savePath: string,
      resultVar: gdjs.Variable
    ) {
      let result = 'error';
      const fs = getFsApi();
      if (fs) {
        try {
          fs.writeFileSync(
            savePath,
            JSON.stringify(variable.toJSObject()),
            'utf8'
          );
          result = 'ok';
        } catch (err) {
          logger.error(
            "Unable to save the variable to path: '" + savePath + "': ",
            err
          );
        }
      }
      resultVar.setString(result);
    };

    /**
     * Save a variable into a file in JSON format, asynchronously.
     * @param variable The variable to be saved
     * @param savePath Path to the file
     * @param resultVar The variable where to store the result of the operation
     */
    export const saveVariableToJSONFileAsync = function (
      variable: gdjs.Variable,
      savePath: string,
      resultVar: gdjs.Variable
    ) {
      const fs = getFsApi();
      if (fs) {
        fs.writeFile(
          savePath,
          JSON.stringify(variable.toJSObject()),
          'utf8',
          (err) => {
            resultVar.setString('ok');
            if (err) {
              logger.error(
                "Unable to save the variable to path: '" + savePath + "': ",
                err
              );
              resultVar.setString('error');
            }
          }
        );
      }
    };

    export const saveVariableToJSONFileAsyncTask = (
      variable: gdjs.Variable,
      savePath: string,
      resultVar: gdjs.Variable
    ) => {
      const asyncFs = getAsyncFsApi();
      return asyncFs
        ? new gdjs.PromiseTask(
            asyncFs
              .writeFile(savePath, JSON.stringify(variable.toJSObject()), {
                encoding: 'utf8',
              })
              .then(() => {
                resultVar.setString('ok');
              })
              .catch((err) => {
                resultVar.setString('error');
                logger.error(
                  "Unable to save the text to path: '" + savePath + "': ",
                  err
                );
              })
          )
        : (resultVar.setString('error'), new gdjs.ResolveTask());
    };

    /**
     * Load a string from a file into a scene variable.
     * @param stringVar Variable where to store the content
     * @param loadPath Path to the file
     * @param resultVar The variable where to store the result of the operation
     * @param removeCRCharacters If true, will remove \r characters usually added by Windows when editing files
     */
    export const loadStringFromFile = function (
      stringVar: gdjs.Variable,
      loadPath: string,
      resultVar: gdjs.Variable,
      removeCRCharacters: boolean
    ) {
      let result = 'error';
      const fs = getFsApi();
      if (fs) {
        try {
          const data = fs.readFileSync(loadPath, 'utf8');
          if (data) {
            stringVar.setString(
              removeCRCharacters ? data.replace(/\r/g, '') : data
            );
            result = 'ok';
          }
        } catch (err) {
          logger.error(
            "Unable to load the file at path: '" + loadPath + "': ",
            err
          );
        }
      }
      resultVar.setString(result);
    };

    /**
     * Load a JSON file and convert it into a variable.
     * @param variable Variable to store the variable
     * @param loadPath Path to the file
     * @param resultVar The variable where to store the result of the operation
     * @param removeCRCharacters If true, will remove \r characters usually added by Windows when editing files
     */
    export const loadVariableFromJSONFile = function (
      variable: gdjs.Variable,
      loadPath: string,
      resultVar: gdjs.Variable,
      removeCRCharacters: boolean
    ) {
      let result = 'error';
      const fs = getFsApi();
      if (fs) {
        try {
          const data = fs.readFileSync(loadPath, 'utf8');
          if (data) {
            variable.fromJSON(
              removeCRCharacters ? data.replace(/\r/g, '') : data
            );
            result = 'ok';
          }
        } catch (err) {
          logger.error(
            "Unable to load variable from the file at path: '" +
              loadPath +
              "': ",
            err
          );
        }
      }
      resultVar.setString(result);
    };

    /**
     * Load a JSON file and convert it into a variable, asynchronously.
     * @param variable Variable to store the variable
     * @param loadPath Path to the file
     * @param resultVar The variable where to store the result of the operation
     * @param removeCRCharacters If true, will remove \r characters usually added by Windows when editing files
     */
    export const loadVariableFromJSONFileAsync = function (
      variable: gdjs.Variable,
      loadPath: string,
      resultVar: gdjs.Variable,
      removeCRCharacters: boolean
    ) {
      const fs = getFsApi();
      if (fs) {
        fs.readFile(loadPath, 'utf8', (err, data) => {
          if (data) {
            variable.fromJSON(
              removeCRCharacters ? data.replace(/\r/g, '') : data
            );
            resultVar.setString('ok');
          }
          if (err) {
            logger.error(
              "Unable to load variable from the file at path: '" +
                loadPath +
                "': ",
              err
            );
            resultVar.setString('error');
          }
        });
      }
    };

    export const loadVariableFromJSONFileAsyncTask = (
      variable: gdjs.Variable,
      loadPath: string,
      resultVar: gdjs.Variable,
      removeCRCharacters: boolean
    ) => {
      const asyncFs = getAsyncFsApi();
      return asyncFs
        ? new gdjs.PromiseTask(
            asyncFs
              .readFile(loadPath, { encoding: 'utf8' })
              .then((data) => {
                if (data)
                  variable.fromJSON(
                    removeCRCharacters ? data.replace(/\r/g, '') : data
                  );
                resultVar.setString('ok');
              })
              .catch((err) => {
                resultVar.setString('error');
                logger.error(
                  "Unable to load the JSON file from path: '" +
                    loadPath +
                    "': ",
                  err
                );
              })
          )
        : (resultVar.setString('error'), new gdjs.ResolveTask());
    };

    /**
     * Load a string from a file into a scene variable, asynchronously.
     * @param stringVar Variable where to store the content
     * @param loadPath Path to the file
     * @param resultVar The variable where to store the result of the operation
     * @param removeCRCharacters If true, will remove \r characters usually added by Windows when editing files
     */
    export const loadStringFromFileAsync = function (
      stringVar: gdjs.Variable,
      loadPath: string,
      resultVar: gdjs.Variable,
      removeCRCharacters: boolean
    ) {
      const fs = getFsApi();
      if (fs) {
        fs.readFile(loadPath, 'utf8', (err, data) => {
          if (data) {
            stringVar.setString(
              removeCRCharacters ? data.replace(/\r/g, '') : data
            );
            resultVar.setString('ok');
          }
          if (err) {
            logger.error(
              "Unable to load the file at path: '" + loadPath + "': ",
              err
            );
            resultVar.setString('error');
          }
        });
      }
    };

    export const loadStringFromFileAsyncTask = (
      variable: gdjs.Variable,
      loadPath: string,
      resultVar: gdjs.Variable,
      removeCRCharacters: boolean
    ) => {
      const asyncFs = getAsyncFsApi();
      return asyncFs
        ? new gdjs.PromiseTask(
            asyncFs
              .readFile(loadPath, { encoding: 'utf8' })
              .then((data) => {
                if (data)
                  variable.setString(
                    removeCRCharacters ? data.replace(/\r/g, '') : data
                  );
                resultVar.setString('ok');
              })
              .catch((err) => {
                resultVar.setString('error');
                logger.error(
                  "Unable to load the text file from path: '" +
                    loadPath +
                    "': ",
                  err
                );
              })
          )
        : (resultVar.setString('error'), new gdjs.ResolveTask());
    };

    /**
     * Delete a file from the filesystem.
     * @param filePath Path to the file
     * @param resultVar The variable where to store the result of the operation
     */
    export const deleteFile = function (
      filePath: string,
      resultVar: gdjs.Variable
    ) {
      let result = 'error';
      const fs = getFsApi();
      if (fs) {
        try {
          fs.unlinkSync(filePath);
          result = 'ok';
        } catch (err) {
          logger.error("Unable to delete the file: '" + filePath + "': ", err);
          result = 'error';
        }
      }
      resultVar.setString(result);
    };

    /**
     * Delete a file from the filesystem, asynchronously.
     * @param filePath Path to the file
     * @param resultVar The variable where to store the result of the operation
     */
    export const deleteFileAsync = function (
      filePath: string,
      resultVar: gdjs.Variable
    ) {
      const fs = getFsApi();
      if (fs) {
        fs.unlink(filePath, (err) => {
          resultVar.setString('ok');
          if (err) {
            logger.error(
              "Unable to delete the file: '" + filePath + "': ",
              err
            );
            resultVar.setString('error');
          }
        });
      }
    };

    export const deleteFileAsyncTask = (
      filePath: string,
      resultVar: gdjs.Variable
    ) => {
      const asyncFs = getAsyncFsApi();
      return asyncFs
        ? new gdjs.PromiseTask(
            asyncFs
              .rm(filePath, { recursive: true })
              .then(() => {
                resultVar.setString('ok');
              })
              .catch((err) => {
                resultVar.setString('error');
                logger.error(
                  "Unable to delete the file: '" + filePath + "': ",
                  err
                );
              })
          )
        : (resultVar.setString('error'), new gdjs.ResolveTask());
    };

    /**
     * Reads the contents of a directory.
     * @param directoryPath Path to the directory.
     * @param resultVar The variable where to store the result of the operation.
     */
    export const readdir = function (
      directoryPath: string,
      resultVar: gdjs.Variable
    ) {
      let result: string[] | string = 'error';
      const fs = getFsApi();
      if (fs) {
        try {
          result = fs.readdirSync(directoryPath);
        } catch (err) {
          logger.error(
            "Unable to read the directory: '" + directoryPath + "': ",
            err
          );
          result = 'error';
        }
      }
      resultVar.fromJSObject(result);
    };

    /**
     * Read a directory's contents asynchronously.
     * @param directoryPath Path to the directory
     * @param resultVar The variable where to store the result of the operation
     */
    export const readdirAsync = (
      directoryPath: string,
      resultVar: gdjs.Variable
    ) => {
      const asyncFs = getAsyncFsApi();
      return asyncFs
        ? new gdjs.PromiseTask(
            asyncFs
              .readdir(directoryPath)
              .then((results) => {
                resultVar.fromJSObject(results);
              })
              .catch((err) => {
                resultVar.setString('error');
                logger.error(
                  "Unable to read the directory: '" + directoryPath + "': ",
                  err
                );
              })
          )
        : (resultVar.setString('error'), new gdjs.ResolveTask());
    };

    /**
     * Check if the file or directory exists.
     * @param filePath The path to the file or directory
     * @return true if fhe file or directory exists
     */
    export const pathExists = function (filePath: string): boolean {
      const fs = getFsApi();
      if (fs) {
        try {
          return !!fs.existsSync(filePath);
        } catch (e) {
          return false;
        }
      } else {
        return false;
      }
    };
  }
}
