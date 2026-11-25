import { type StorageProvider, type FileMetadata } from '../ProjectsStorage';

export declare const registerOnResourceExternallyChangedCallback: (
  callback: Function
) => string;

export declare const unregisterOnResourceExternallyChangedCallback: (
  callbackId: string | null | undefined
) => void;

export declare const triggerOnResourceExternallyChanged: (resourceInfo: {
  identifier: string;
}) => void;

declare const useResourcesWatcher: (options: {
  getStorageProvider: () => StorageProvider;
  fileMetadata: FileMetadata | null | undefined;
  isProjectSplitInMultipleFiles: boolean;
}) => void;

export default useResourcesWatcher;
