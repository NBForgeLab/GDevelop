import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { NewResourceDialog } from './NewResourceDialog';
import {
  type ChooseResourceFunction,
  type ChooseResourceOptions,
  type ResourceSource,
} from './ResourceSource';
import { type StorageProvider, type FileMetadata } from '../ProjectsStorage';

type RenderNewResourceDialogProps = {
  project: gdProject | null | undefined;
  fileMetadata: FileMetadata | null | undefined;
  getStorageProvider: () => StorageProvider;
  i18n: I18nType;
  resourceSources: Array<ResourceSource>;
};

type UseNewResourceDialogOutput = {
  onChooseResource: ChooseResourceFunction;
  renderNewResourceDialog: (
    props: RenderNewResourceDialogProps
  ) => React.ReactNode;
};

/**
 * Hook encapsulating the state and rendering logic for the NewResourceDialog.
 * Used in both MainFrame (main window) and PoppedOutEditorContainerWindow
 * (external window) so that the dialog renders in the correct window.
 */
const useNewResourceDialog = (): UseNewResourceDialogOutput => {
  const [chooseResourceOptions, setChooseResourceOptions] = React.useState<
    ChooseResourceOptions | null | undefined
  >(null);
  const [onResourceChosen, setOnResourceChosen] = React.useState<
    | ((arg0: {
        selectedResources: Array<gdResource>;
        selectedSourceName: string;
      }) => void)
    | null
    | undefined
  >(null);

  const onChooseResource: ChooseResourceFunction = React.useCallback(
    (options: ChooseResourceOptions) => {
      return new Promise((resolve) => {
        setChooseResourceOptions(options);
        const onResourceChosenSetter: () => (arg0: {
          selectedResources: Array<gdResource>;
          selectedSourceName: string;
        }) => void = () => resolve;

        setOnResourceChosen(onResourceChosenSetter);
      });
    },
    [setOnResourceChosen, setChooseResourceOptions]
  );

  const renderNewResourceDialog = React.useCallback(
    ({
      project,
      fileMetadata,
      getStorageProvider,
      i18n,
      resourceSources,
    }: RenderNewResourceDialogProps): React.ReactNode => {
      if (!chooseResourceOptions || !onResourceChosen || !project) return null;
      return (
        <NewResourceDialog
          project={project}
          fileMetadata={fileMetadata}
          getStorageProvider={getStorageProvider}
          i18n={i18n}
          resourceSources={resourceSources}
          onChooseResources={(resourcesOptions) => {
            setOnResourceChosen(null);
            setChooseResourceOptions(null);
            onResourceChosen(resourcesOptions);
          }}
          onClose={() => {
            setOnResourceChosen(null);
            setChooseResourceOptions(null);
            onResourceChosen({
              selectedResources: [],
              selectedSourceName: '',
            });
          }}
          options={chooseResourceOptions}
        />
      );
    },
    [chooseResourceOptions, onResourceChosen]
  );

  return { onChooseResource, renderNewResourceDialog };
};

export default useNewResourceDialog;
