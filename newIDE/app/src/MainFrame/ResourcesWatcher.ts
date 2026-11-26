import * as React from 'react';
import ResourcesLoader from '../ResourcesLoader';
import PreferencesContext from './Preferences/PreferencesContext';
import { type StorageProvider, type FileMetadata } from '../ProjectsStorage';

const callbacks: {
  [key: string]: (...args: Array<any>) => any;
} = {};

let callbackId = 1;
const getNewId = () => {
  return callbackId++;
};

export const registerOnResourceExternallyChangedCallback = (
  callback: (...args: Array<any>) => any
): string => {
  const id = getNewId().toString();
  callbacks[id] = callback;
  return id;
};

export const unregisterOnResourceExternallyChangedCallback = (
  callbackId: string | null | undefined
) => {
  if (!callbackId || !callbacks[callbackId]) return;
  delete callbacks[callbackId];
};

export const triggerOnResourceExternallyChanged = (resourceInfo: {
  identifier: string;
}) => {
  ResourcesLoader.burstAllUrlsCache();
  Object.keys(callbacks).forEach((callbackId) =>
    callbacks[callbackId](resourceInfo)
  );
};

const useResourcesWatcher = ({
  getStorageProvider,
  fileMetadata,
  isProjectSplitInMultipleFiles,
}: {
  getStorageProvider: () => StorageProvider;
  fileMetadata: FileMetadata | null | undefined;
  isProjectSplitInMultipleFiles: boolean;
}) => {
  const {
    values: { watchProjectFolderFilesForLocalProjects },
  } = React.useContext(PreferencesContext);
  // Whole fileMetadata object is not used because lastModifiedDate changes on save
  // thus triggering the effect.
  const fileIdentifier = fileMetadata ? fileMetadata.fileIdentifier : null;

  const informEditorsResourceExternallyChanged = React.useCallback(
    (resourceInfo: { identifier: string }) => {
      triggerOnResourceExternallyChanged(resourceInfo);
    },
    []
  );

  React.useEffect(() => {
    const storageProvider = getStorageProvider();
    if (
      storageProvider.internalName === 'LocalFile' &&
      !watchProjectFolderFilesForLocalProjects
    ) {
      return undefined;
    }
    if (fileIdentifier && storageProvider.setupResourcesWatcher) {
      const unsubscribe = storageProvider.setupResourcesWatcher({
        fileIdentifier,
        callback: informEditorsResourceExternallyChanged,
        options: {
          isProjectSplitInMultipleFiles,
        },
      });
      return unsubscribe;
    }
    return undefined;
  }, [
    fileIdentifier,
    informEditorsResourceExternallyChanged,
    getStorageProvider,
    watchProjectFolderFilesForLocalProjects,
    isProjectSplitInMultipleFiles,
  ]);
};
export default useResourcesWatcher;
