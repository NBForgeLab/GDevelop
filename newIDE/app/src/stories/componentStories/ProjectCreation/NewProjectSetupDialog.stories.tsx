import * as React from 'react';
import { action } from '@storybook/addon-actions';

import paperDecorator from '../../PaperDecorator';
import NewProjectSetupDialog from '../../../ProjectCreation/NewProjectSetupDialog';
import CloudStorageProvider from '../../../ProjectsStorage/CloudStorageProvider';
import UrlStorageProvider from '../../../ProjectsStorage/UrlStorageProvider';
import DownloadFileStorageProvider from '../../../ProjectsStorage/DownloadFileStorageProvider';
import {
  fakeSilverAuthenticatedUser,
  fakeAuthenticatedUserWithNoSubscriptionAndTooManyCloudProjects,
  fakeNotAuthenticatedUser,
  geometryMonsterExampleShortHeader,
  fakePrivateGameTemplateListingData,
} from '../../../fixtures/GDevelopServicesTestData';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import fakeResourceManagementProps from '../../FakeResourceManagement';

export default {
  title: 'Project Creation/NewProjectSetupDialog',
  component: NewProjectSetupDialog,
  decorators: [paperDecorator],
};

export const OpenAndNotAuthenticated = (): React.ReactNode => {
  return (
    <AuthenticatedUserContext.Provider value={fakeNotAuthenticatedUser}>
      <NewProjectSetupDialog
        project={null}
        fileMetadata={null}
        storageProviders={[
          UrlStorageProvider,
          CloudStorageProvider,
          DownloadFileStorageProvider,
        ]}
        storageProvider={UrlStorageProvider}
        resourceManagementProps={fakeResourceManagementProps}
        onClose={() => action('click on close')()}
        onCreateEmptyProject={async () => {
          action('create empty')();
          return { createdProject: null };
        }}
        onCreateFromExample={async () => {
          action('create from example')();
          return { createdProject: null };
        }}
        onCloseAskAi={() => action('close ask AI')()}
        onOpenLayout={() => action('open layout')()}
        onWillInstallExtension={action('extension will be installed')}
        onExtensionInstalled={action('extension installed')}
        onCreateProjectFromPrivateGameTemplate={async () => {
          action('create project from private game template')();
          return { createdProject: null };
        }}
        selectedExampleShortHeader={null}
        selectedPrivateGameTemplateListingData={null}
        onSelectExampleShortHeader={() => action('select example')()}
        onSelectPrivateGameTemplateListingData={() =>
          action('select private game template')()
        }
        privateGameTemplateListingDatasFromSameCreator={[]}
      />
    </AuthenticatedUserContext.Provider>
  );
};

export const OpenAndAuthenticated = (): React.ReactNode => {
  return (
    <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
      <NewProjectSetupDialog
        project={null}
        fileMetadata={null}
        storageProviders={[
          UrlStorageProvider,
          CloudStorageProvider,
          DownloadFileStorageProvider,
        ]}
        onClose={() => action('click on close')()}
        storageProvider={UrlStorageProvider}
        resourceManagementProps={fakeResourceManagementProps}
        onCreateEmptyProject={async () => {
          action('create empty')();
          return { createdProject: null };
        }}
        onCreateFromExample={async () => {
          action('create from example')();
          return { createdProject: null };
        }}
        onCloseAskAi={() => action('close ask AI')()}
        onOpenLayout={() => action('open layout')()}
        onWillInstallExtension={action('extension will be installed')}
        onExtensionInstalled={action('extension installed')}
        onCreateProjectFromPrivateGameTemplate={async () => {
          action('create project from private game template')();
          return { createdProject: null };
        }}
        selectedExampleShortHeader={null}
        selectedPrivateGameTemplateListingData={null}
        onSelectExampleShortHeader={() => action('select example')()}
        onSelectPrivateGameTemplateListingData={() =>
          action('select private game template')()
        }
        privateGameTemplateListingDatasFromSameCreator={[]}
      />
    </AuthenticatedUserContext.Provider>
  );
};

export const Opening = (): React.ReactNode => {
  return (
    <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
      <NewProjectSetupDialog
        project={null}
        fileMetadata={null}
        isProjectOpening
        storageProviders={[
          UrlStorageProvider,
          CloudStorageProvider,
          DownloadFileStorageProvider,
        ]}
        onClose={() => action('click on close')()}
        storageProvider={UrlStorageProvider}
        resourceManagementProps={fakeResourceManagementProps}
        onCreateEmptyProject={async () => {
          action('create empty')();
          return { createdProject: null };
        }}
        onCreateFromExample={async () => {
          action('create from example')();
          return { createdProject: null };
        }}
        onCloseAskAi={() => action('close ask AI')()}
        onOpenLayout={() => action('open layout')()}
        onWillInstallExtension={action('extension will be installed')}
        onExtensionInstalled={action('extension installed')}
        onCreateProjectFromPrivateGameTemplate={async () => {
          action('create project from private game template')();
          return { createdProject: null };
        }}
        selectedExampleShortHeader={null}
        selectedPrivateGameTemplateListingData={null}
        onSelectExampleShortHeader={() => action('select example')()}
        onSelectPrivateGameTemplateListingData={() =>
          action('select private game template')()
        }
        privateGameTemplateListingDatasFromSameCreator={[]}
      />
    </AuthenticatedUserContext.Provider>
  );
};

export const LimitsReached = (): React.ReactNode => {
  return (
    <AuthenticatedUserContext.Provider
      value={fakeAuthenticatedUserWithNoSubscriptionAndTooManyCloudProjects}
    >
      <NewProjectSetupDialog
        project={null}
        fileMetadata={null}
        storageProviders={[
          CloudStorageProvider,
          UrlStorageProvider,
          DownloadFileStorageProvider,
        ]}
        onClose={() => action('click on close')()}
        storageProvider={UrlStorageProvider}
        resourceManagementProps={fakeResourceManagementProps}
        onCreateEmptyProject={async () => {
          action('create empty')();
          return { createdProject: null };
        }}
        onCreateFromExample={async () => {
          action('create from example')();
          return { createdProject: null };
        }}
        onCloseAskAi={() => action('close ask AI')()}
        onOpenLayout={() => action('open layout')()}
        onWillInstallExtension={action('extension will be installed')}
        onExtensionInstalled={action('extension installed')}
        onCreateProjectFromPrivateGameTemplate={async () => {
          action('create project from private game template')();
          return { createdProject: null };
        }}
        selectedExampleShortHeader={null}
        selectedPrivateGameTemplateListingData={null}
        onSelectExampleShortHeader={() => action('select example')()}
        onSelectPrivateGameTemplateListingData={() =>
          action('select private game template')()
        }
        privateGameTemplateListingDatasFromSameCreator={[]}
      />
    </AuthenticatedUserContext.Provider>
  );
};

export const FromExample = (): React.ReactNode => {
  return (
    <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
      <NewProjectSetupDialog
        project={null}
        fileMetadata={null}
        storageProviders={[
          UrlStorageProvider,
          CloudStorageProvider,
          DownloadFileStorageProvider,
        ]}
        onClose={() => action('click on close')()}
        storageProvider={UrlStorageProvider}
        resourceManagementProps={fakeResourceManagementProps}
        onCreateEmptyProject={async () => {
          action('create empty')();
          return { createdProject: null };
        }}
        onCreateFromExample={async () => {
          action('create from example')();
          return { createdProject: null };
        }}
        onCloseAskAi={() => action('close ask AI')()}
        onOpenLayout={() => action('open layout')()}
        onWillInstallExtension={action('extension will be installed')}
        onExtensionInstalled={action('extension installed')}
        selectedExampleShortHeader={geometryMonsterExampleShortHeader}
        onCreateProjectFromPrivateGameTemplate={async () => {
          action('create project from private game template')();
          return { createdProject: null };
        }}
        selectedPrivateGameTemplateListingData={null}
        onSelectExampleShortHeader={() => action('select example')()}
        onSelectPrivateGameTemplateListingData={() =>
          action('select private game template')()
        }
        privateGameTemplateListingDatasFromSameCreator={[]}
      />
    </AuthenticatedUserContext.Provider>
  );
};

export const FromExampleWithoutGoingBack = (): React.ReactNode => {
  return (
    <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
      <NewProjectSetupDialog
        project={null}
        fileMetadata={null}
        storageProviders={[
          UrlStorageProvider,
          CloudStorageProvider,
          DownloadFileStorageProvider,
        ]}
        onClose={() => action('click on close')()}
        storageProvider={UrlStorageProvider}
        resourceManagementProps={fakeResourceManagementProps}
        onCreateEmptyProject={async () => {
          action('create empty')();
          return { createdProject: null };
        }}
        onCreateFromExample={async () => {
          action('create from example')();
          return { createdProject: null };
        }}
        onCloseAskAi={() => action('close ask AI')()}
        onOpenLayout={() => action('open layout')()}
        onWillInstallExtension={action('extension will be installed')}
        onExtensionInstalled={action('extension installed')}
        selectedExampleShortHeader={geometryMonsterExampleShortHeader}
        onCreateProjectFromPrivateGameTemplate={async () => {
          action('create project from private game template')();
          return { createdProject: null };
        }}
        selectedPrivateGameTemplateListingData={null}
        onSelectExampleShortHeader={() => action('select example')()}
        onSelectPrivateGameTemplateListingData={() =>
          action('select private game template')()
        }
        privateGameTemplateListingDatasFromSameCreator={[]}
        preventBackHome
      />
    </AuthenticatedUserContext.Provider>
  );
};

export const FromPrivateGameTemplate = (): React.ReactNode => {
  return (
    <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
      <NewProjectSetupDialog
        project={null}
        fileMetadata={null}
        storageProviders={[
          UrlStorageProvider,
          CloudStorageProvider,
          DownloadFileStorageProvider,
        ]}
        onClose={() => action('click on close')()}
        storageProvider={UrlStorageProvider}
        resourceManagementProps={fakeResourceManagementProps}
        onCreateEmptyProject={async () => {
          action('create empty')();
          return { createdProject: null };
        }}
        onCreateFromExample={async () => {
          action('create from example')();
          return { createdProject: null };
        }}
        onCloseAskAi={() => action('close ask AI')()}
        onOpenLayout={() => action('open layout')()}
        onWillInstallExtension={action('extension will be installed')}
        onExtensionInstalled={action('extension installed')}
        selectedExampleShortHeader={null}
        onCreateProjectFromPrivateGameTemplate={async () => {
          action('create project from private game template')();
          return { createdProject: null };
        }}
        selectedPrivateGameTemplateListingData={
          fakePrivateGameTemplateListingData
        }
        onSelectExampleShortHeader={() => action('select example')()}
        onSelectPrivateGameTemplateListingData={() =>
          action('select private game template')()
        }
        privateGameTemplateListingDatasFromSameCreator={[]}
      />
    </AuthenticatedUserContext.Provider>
  );
};

export const FromPrivateGameTemplateWithoutGoingBack = (): React.ReactNode => {
  return (
    <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
      <NewProjectSetupDialog
        project={null}
        fileMetadata={null}
        storageProviders={[
          UrlStorageProvider,
          CloudStorageProvider,
          DownloadFileStorageProvider,
        ]}
        onClose={() => action('click on close')()}
        storageProvider={UrlStorageProvider}
        resourceManagementProps={fakeResourceManagementProps}
        onCreateEmptyProject={async () => {
          action('create empty')();
          return { createdProject: null };
        }}
        onCreateFromExample={async () => {
          action('create from example')();
          return { createdProject: null };
        }}
        onCloseAskAi={() => action('close ask AI')()}
        onOpenLayout={() => action('open layout')()}
        onWillInstallExtension={action('extension will be installed')}
        onExtensionInstalled={action('extension installed')}
        selectedExampleShortHeader={null}
        onCreateProjectFromPrivateGameTemplate={async () => {
          action('create project from private game template')();
          return { createdProject: null };
        }}
        selectedPrivateGameTemplateListingData={
          fakePrivateGameTemplateListingData
        }
        onSelectExampleShortHeader={() => action('select example')()}
        onSelectPrivateGameTemplateListingData={() =>
          action('select private game template')()
        }
        privateGameTemplateListingDatasFromSameCreator={[]}
        preventBackHome
      />
    </AuthenticatedUserContext.Provider>
  );
};
