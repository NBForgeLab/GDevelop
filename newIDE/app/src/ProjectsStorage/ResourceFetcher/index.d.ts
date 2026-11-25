import * as React from 'react';
import { type StorageProviderOperations, type StorageProvider } from '../index';
import { type FileMetadata } from '..';
import { type AuthenticatedUser } from '../../Profile/AuthenticatedUserContext';

export type EnsureResourcesAreFetchedOptions = {
  project: gdProject | null | undefined;
  fileMetadata: FileMetadata | null | undefined;
  storageProvider: StorageProvider;
  storageProviderOperations: StorageProviderOperations;
  authenticatedUser?: AuthenticatedUser;
};

export type FetchAllProjectResourcesOptions = {
  project: gdProject;
  fileMetadata: FileMetadata;
  storageProvider: StorageProvider;
  storageProviderOperations: StorageProviderOperations;
  authenticatedUser?: AuthenticatedUser;
  onProgress: (done: number, total: number) => void;
};

export type FetchAllProjectResourcesResult = {
  erroredResources: Array<{
    resourceName: string;
    error: Error;
  }>;
};

export type FetchAllProjectResourcesFunction = (
  options: FetchAllProjectResourcesOptions
) => Promise<FetchAllProjectResourcesResult>;

export type ResourceFetcher = {
  fetchAllProjectResources: FetchAllProjectResourcesFunction;
};

type UseResourceFetcherOutput = {
  ensureResourcesAreFetched: (
    getOptions: () => EnsureResourcesAreFetchedOptions
  ) => Promise<void>;
  renderResourceFetcherDialog: () => React.ReactNode;
};

export declare const useResourceFetcher: (options: {
  resourceFetcher: ResourceFetcher;
}) => UseResourceFetcherOutput;

export type OnFetchNewlyAddedResourcesFunction = () => Promise<void>;
