import * as React from 'react';
import {
  listAllExamples,
  type ExampleShortHeader,
} from '../Utils/GDevelopServices/Example';
import type { PrivateGameTemplateListingData } from '../Utils/GDevelopServices/Shop';
import { PrivateGameTemplateStoreContext } from '../AssetStore/PrivateGameTemplates/PrivateGameTemplateStoreContext';
import AuthenticatedUserContext from '../Profile/AuthenticatedUserContext';
import LoaderModal from '../UI/LoaderModal';
import NewProjectSetupDialog, {
  type NewProjectSetup,
  type ExampleProjectSetup,
} from '../ProjectCreation/NewProjectSetupDialog';
import { type FileMetadata, type StorageProvider } from '../ProjectsStorage';
import { type ResourceManagementProps } from '../ResourcesList/ResourceSource';
import RouterContext from './RouterContext';
import { type CreateProjectResult } from '../Utils/UseCreateProject';
import { type OpenAskAiOptions } from '../AiGeneration/Utils';

type Props = {
  project: gdProject | null | undefined;
  fileMetadata: FileMetadata | null | undefined;
  resourceManagementProps: ResourceManagementProps;
  isProjectOpening: boolean;
  newProjectSetupDialogOpen: boolean;
  setNewProjectSetupDialogOpen: (arg0: boolean) => void;
  createEmptyProject: (
    newProjectSetup: NewProjectSetup
  ) => Promise<CreateProjectResult>;
  createProjectFromExample: (
    exampleProjectSetup: ExampleProjectSetup
  ) => Promise<CreateProjectResult>;
  createProjectFromPrivateGameTemplate: (
    privateGameTemplateListingData: PrivateGameTemplateListingData,
    newProjectSetup: NewProjectSetup
  ) => Promise<CreateProjectResult>;
  closeAskAi: () => void;
  openAskAi: (arg0: OpenAskAiOptions | null | undefined) => void;
  closeProject: () => Promise<void>;
  storageProviders: Array<StorageProvider>;
  storageProvider: StorageProvider | null | undefined;
  onOpenLayout: (
    sceneName: string,
    options: {
      openEventsEditor: boolean;
      openSceneEditor: boolean;
      focusWhenOpened:
        | 'scene-or-events-otherwise'
        | 'scene'
        | 'events'
        | 'none';
    }
  ) => void;
  onWillInstallExtension: (extensionNames: Array<string>) => void;
  onExtensionInstalled: (extensionNames: Array<string>) => void;
};

type _UseNewProjectDialogReturnType = {
  closeNewProjectDialog: () => void;
  fetchAndOpenNewProjectSetupDialogForExample: (
    exampleSlug: string
  ) => Promise<void>;
  onSelectExampleShortHeader: (arg0: {
    exampleShortHeader: ExampleShortHeader | null | undefined;
    preventBackHome?: boolean;
  }) => void;
  onSelectPrivateGameTemplateListingData: (arg0: {
    preventBackHome?: boolean;
    privateGameTemplateListingData:
      | PrivateGameTemplateListingData
      | null
      | undefined;
  }) => void;
  openNewProjectDialog: () => void;
  renderNewProjectDialog: () => React.ReactNode;
  selectedExampleShortHeader: ExampleShortHeader | null | undefined;
  selectedPrivateGameTemplateListingData:
    | PrivateGameTemplateListingData
    | null
    | undefined;
};

const useNewProjectDialog = ({
  project,
  fileMetadata,
  resourceManagementProps,
  isProjectOpening,
  newProjectSetupDialogOpen,
  setNewProjectSetupDialogOpen,
  createEmptyProject,
  createProjectFromExample,
  createProjectFromPrivateGameTemplate,
  closeAskAi,
  openAskAi,
  closeProject,
  storageProviders,
  storageProvider,
  onOpenLayout,
  onWillInstallExtension,
  onExtensionInstalled,
}: Props): _UseNewProjectDialogReturnType => {
  const [isFetchingExample, setIsFetchingExample] = React.useState(false);
  const [
    selectedPrivateGameTemplateListingData,
    setSelectedPrivateGameTemplateListingData,
  ] = React.useState<PrivateGameTemplateListingData | null | undefined>(null);
  const [selectedExampleShortHeader, setSelectedExampleShortHeader] =
    React.useState<ExampleShortHeader | null | undefined>(null);
  const [preventBackHome, setPreventBackHome] = React.useState(true);
  const { removeRouteArguments } = React.useContext(RouterContext);

  const { receivedGameTemplates } = React.useContext(AuthenticatedUserContext);
  const { privateGameTemplateListingDatas } = React.useContext(
    PrivateGameTemplateStoreContext
  );

  const closeNewProjectDialog = React.useCallback(() => {
    setPreventBackHome(false);
    setSelectedExampleShortHeader(null);
    setSelectedPrivateGameTemplateListingData(null);
    setNewProjectSetupDialogOpen(false);
  }, [setNewProjectSetupDialogOpen]);
  const openNewProjectDialog = React.useCallback(() => {
    setPreventBackHome(false);
    setSelectedExampleShortHeader(null);
    setSelectedPrivateGameTemplateListingData(null);
    setNewProjectSetupDialogOpen(true);
  }, [setNewProjectSetupDialogOpen]);

  const privateGameTemplateListingDatasFromSameCreator:
    | Array<PrivateGameTemplateListingData>
    | null
    | undefined = React.useMemo(() => {
    if (
      !selectedPrivateGameTemplateListingData ||
      !privateGameTemplateListingDatas ||
      !receivedGameTemplates
    )
      return null;

    const receivedGameTemplateIds = receivedGameTemplates.map(
      (template) => template.id
    );

    return privateGameTemplateListingDatas
      .filter(
        (template) =>
          template.sellerId ===
            selectedPrivateGameTemplateListingData.sellerId &&
          !receivedGameTemplateIds.includes(template.sellerId)
      )
      .sort((template1, template2) =>
        template1.name.localeCompare(template2.name)
      );
  }, [
    selectedPrivateGameTemplateListingData,
    privateGameTemplateListingDatas,
    receivedGameTemplates,
  ]);

  const onSelectPrivateGameTemplateListingData = React.useCallback(
    ({
      privateGameTemplateListingData,
      preventBackHome,
    }: {
      privateGameTemplateListingData:
        | PrivateGameTemplateListingData
        | null
        | undefined;
      preventBackHome?: boolean;
    }) => {
      setSelectedPrivateGameTemplateListingData(privateGameTemplateListingData);
      setPreventBackHome(!!preventBackHome);
      if (privateGameTemplateListingData) {
        setNewProjectSetupDialogOpen(true);
      }
    },
    [setSelectedPrivateGameTemplateListingData, setNewProjectSetupDialogOpen]
  );

  const onSelectExampleShortHeader = React.useCallback(
    ({
      exampleShortHeader,
      preventBackHome,
    }: {
      exampleShortHeader: ExampleShortHeader | null | undefined;
      preventBackHome?: boolean;
    }) => {
      setSelectedExampleShortHeader(exampleShortHeader);
      setPreventBackHome(!!preventBackHome);
      if (exampleShortHeader) {
        setNewProjectSetupDialogOpen(true);
      }
    },
    [setSelectedExampleShortHeader, setNewProjectSetupDialogOpen]
  );

  const fetchAndOpenNewProjectSetupDialogForExample = React.useCallback(
    async (exampleSlug: string) => {
      try {
        setIsFetchingExample(true);
        const fetchedAllExamples = await listAllExamples();
        const exampleShortHeader = fetchedAllExamples.exampleShortHeaders.find(
          (exampleShortHeader) => exampleShortHeader.slug === exampleSlug
        );
        if (!exampleShortHeader) {
          throw new Error(
            `Unable to find the example with slug "${exampleSlug}"`
          );
        }

        onSelectExampleShortHeader({
          exampleShortHeader,
          preventBackHome: true, // We open the dialog for this example only.
        });
      } catch (error) {
        console.error('Error caught while opening example:', error);
        return;
      } finally {
        setIsFetchingExample(false);
        // Remove any route arguments in case it was opened from the url,
        // and so that the example is not opened again.
        removeRouteArguments(['create-from-example']);
      }
    },
    [onSelectExampleShortHeader, removeRouteArguments]
  );

  const renderNewProjectDialog = () => {
    return (
      <>
        {isFetchingExample && <LoaderModal showImmediately />}
        {newProjectSetupDialogOpen && (
          <NewProjectSetupDialog
            project={project}
            fileMetadata={fileMetadata}
            resourceManagementProps={resourceManagementProps}
            isProjectOpening={isProjectOpening}
            onClose={closeNewProjectDialog}
            onCreateEmptyProject={createEmptyProject}
            onCreateFromExample={createProjectFromExample}
            onCreateProjectFromPrivateGameTemplate={
              createProjectFromPrivateGameTemplate
            }
            onCloseAskAi={closeAskAi}
            onOpenAskAi={openAskAi}
            closeProject={closeProject}
            storageProviders={storageProviders}
            storageProvider={storageProvider}
            selectedExampleShortHeader={selectedExampleShortHeader}
            onSelectExampleShortHeader={(exampleShortHeader) =>
              onSelectExampleShortHeader({
                exampleShortHeader,
                preventBackHome: false,
              })
            }
            selectedPrivateGameTemplateListingData={
              selectedPrivateGameTemplateListingData
            }
            onSelectPrivateGameTemplateListingData={(
              privateGameTemplateListingData
            ) =>
              onSelectPrivateGameTemplateListingData({
                privateGameTemplateListingData,
                preventBackHome: false,
              })
            }
            privateGameTemplateListingDatasFromSameCreator={
              privateGameTemplateListingDatasFromSameCreator
            }
            preventBackHome={preventBackHome}
            onOpenLayout={onOpenLayout}
            onWillInstallExtension={onWillInstallExtension}
            onExtensionInstalled={onExtensionInstalled}
          />
        )}
      </>
    );
  };
  return {
    selectedExampleShortHeader: selectedExampleShortHeader,
    selectedPrivateGameTemplateListingData:
      selectedPrivateGameTemplateListingData,
    closeNewProjectDialog,
    openNewProjectDialog,
    onSelectExampleShortHeader,
    onSelectPrivateGameTemplateListingData,
    renderNewProjectDialog,
    fetchAndOpenNewProjectSetupDialogForExample,
  };
};

export default useNewProjectDialog;
