import * as React from 'react';

import paperDecorator from '../../PaperDecorator';

import { action } from '@storybook/addon-actions';
import {
  fakeFileMetadataAndStorageProviderNameForCloudProject,
  fakeFileMetadataAndStorageProviderNameForLocalProject,
  fakeSilverAuthenticatedUser,
  game1,
  game2,
} from '../../../fixtures/GDevelopServicesTestData';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import GamesList from '../../../GameDashboard/GamesList';
import { type GamesListFilter } from '../../../GameDashboard/GamesListFilterSelector';
import CloudStorageProvider from '../../../ProjectsStorage/CloudStorageProvider';
import PreferencesContext, {
  initialPreferences,
  type Preferences,
} from '../../../MainFrame/Preferences/PreferencesContext';
import LocalFileStorageProvider from '../../../ProjectsStorage/LocalFileStorageProvider';

export default {
  title: 'GameDashboard/GamesList',
  component: GamesList,
  decorators: [paperDecorator],
};

export const NoGamesOrProjects = (): React.ReactNode => {
  const projectFiles: Array<any> = [];

  const preferences: Preferences = {
    ...initialPreferences,
    values: {
      ...initialPreferences.values,
      recentProjectFiles: projectFiles,
    },
    getRecentProjectFiles: () => projectFiles,
  };

  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchText, setSearchText] = React.useState('');
  const [filter, setFilter] = React.useState<GamesListFilter>('active');

  return (
    <PreferencesContext.Provider value={preferences}>
      <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
        <GamesList
          storageProviders={[CloudStorageProvider, LocalFileStorageProvider]}
          project={null}
          games={[]}
          onRefreshGames={async () => {
            action('onRefreshGames')();
          }}
          onOpenGameManager={action('onOpenGameManager')}
          onOpenProject={async (...args: any[]) => {
            action('onOpenProject')(...args);
          }}
          canOpen={true}
          askToCloseProject={async () => {
            action('askToCloseProject')();
            return true;
          }}
          closeProject={async () => {
            action('closeProject')();
          }}
          canSaveProject
          currentFileMetadata={null}
          disabled={false}
          onChooseProject={action('onChooseProject')}
          onOpenNewProjectSetupDialog={action('onOpenNewProjectSetupDialog')}
          onSaveProject={async () => {
            action('onSaveProject')();
            return null;
          }}
          onUnregisterGame={async (...args: any[]) => {
            action('onUnregisterGame')(...args);
          }}
          onDeleteCloudProject={async (...args: any[]) => {
            action('onDeleteCloudProject')(...args);
          }}
          onRestoreCloudProject={async (...args: any[]) => {
            action('onRestoreCloudProject')(...args);
          }}
          onRegisterProject={async (...args: any[]) => {
            action('onRegisterProject')(...args);
            return null;
          }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          searchText={searchText}
          setSearchText={setSearchText}
          filter={filter}
          setFilter={setFilter}
        />
      </AuthenticatedUserContext.Provider>
    </PreferencesContext.Provider>
  );
};

export const WithOnlyGames = (): React.ReactNode => {
  const projectFiles = [
    {
      ...fakeFileMetadataAndStorageProviderNameForLocalProject,
      fileMetadata: {
        ...fakeFileMetadataAndStorageProviderNameForLocalProject.fileMetadata,
        gameId: game1.id,
      },
    },
  ];

  const preferences: Preferences = {
    ...initialPreferences,
    values: {
      ...initialPreferences.values,
      recentProjectFiles: projectFiles,
    },
    getRecentProjectFiles: () => projectFiles,
  };

  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchText, setSearchText] = React.useState('');
  const [filter, setFilter] = React.useState<GamesListFilter>('active');

  return (
    <PreferencesContext.Provider value={preferences}>
      <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
        <GamesList
          storageProviders={[CloudStorageProvider, LocalFileStorageProvider]}
          project={null}
          games={[game1, game2]}
          onRefreshGames={async () => {
            action('onRefreshGames')();
          }}
          onOpenGameManager={action('onOpenGameManager')}
          onOpenProject={async (...args: any[]) => {
            action('onOpenProject')(...args);
          }}
          canOpen={true}
          askToCloseProject={async () => {
            action('askToCloseProject')();
            return true;
          }}
          closeProject={async () => {
            action('closeProject')();
          }}
          canSaveProject
          currentFileMetadata={null}
          disabled={false}
          onChooseProject={action('onChooseProject')}
          onOpenNewProjectSetupDialog={action('onOpenNewProjectSetupDialog')}
          onSaveProject={async () => {
            action('onSaveProject')();
            return null;
          }}
          onUnregisterGame={async (...args: any[]) => {
            action('onUnregisterGame')(...args);
          }}
          onDeleteCloudProject={async (...args: any[]) => {
            action('onDeleteCloudProject')(...args);
          }}
          onRestoreCloudProject={async (...args: any[]) => {
            action('onRestoreCloudProject')(...args);
          }}
          onRegisterProject={async (...args: any[]) => {
            action('onRegisterProject')(...args);
            return null;
          }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          searchText={searchText}
          setSearchText={setSearchText}
          filter={filter}
          setFilter={setFilter}
        />
      </AuthenticatedUserContext.Provider>
    </PreferencesContext.Provider>
  );
};

export const WithOnlyProjects = (): React.ReactNode => {
  const projectFiles = [
    fakeFileMetadataAndStorageProviderNameForCloudProject,
    fakeFileMetadataAndStorageProviderNameForLocalProject,
  ];

  const preferences: Preferences = {
    ...initialPreferences,
    values: {
      ...initialPreferences.values,
      recentProjectFiles: projectFiles,
    },
    getRecentProjectFiles: () => projectFiles,
  };

  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchText, setSearchText] = React.useState('');
  const [filter, setFilter] = React.useState<GamesListFilter>('active');

  return (
    <PreferencesContext.Provider value={preferences}>
      <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
        <GamesList
          storageProviders={[CloudStorageProvider, LocalFileStorageProvider]}
          project={null}
          games={[]}
          onRefreshGames={async () => {
            action('onRefreshGames')();
          }}
          onOpenGameManager={action('onOpenGameManager')}
          onOpenProject={async (...args: any[]) => {
            action('onOpenProject')(...args);
          }}
          canOpen={true}
          askToCloseProject={async () => {
            action('askToCloseProject')();
            return true;
          }}
          closeProject={async () => {
            action('closeProject')();
          }}
          canSaveProject
          currentFileMetadata={null}
          disabled={false}
          onChooseProject={action('onChooseProject')}
          onOpenNewProjectSetupDialog={action('onOpenNewProjectSetupDialog')}
          onSaveProject={async () => {
            action('onSaveProject')();
            return null;
          }}
          onUnregisterGame={async (...args: any[]) => {
            action('onUnregisterGame')(...args);
          }}
          onDeleteCloudProject={async (...args: any[]) => {
            action('onDeleteCloudProject')(...args);
          }}
          onRestoreCloudProject={async (...args: any[]) => {
            action('onRestoreCloudProject')(...args);
          }}
          onRegisterProject={async (...args: any[]) => {
            action('onRegisterProject')(...args);
            return null;
          }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          searchText={searchText}
          setSearchText={setSearchText}
          filter={filter}
          setFilter={setFilter}
        />
      </AuthenticatedUserContext.Provider>
    </PreferencesContext.Provider>
  );
};

export const WithGamesAndProjects = (): React.ReactNode => {
  const projectFiles = [
    fakeFileMetadataAndStorageProviderNameForCloudProject,
    fakeFileMetadataAndStorageProviderNameForLocalProject,
    {
      ...fakeFileMetadataAndStorageProviderNameForLocalProject,
      fileMetadata: {
        ...fakeFileMetadataAndStorageProviderNameForLocalProject.fileMetadata,
        gameId: game1.id,
      },
    },
  ];

  const preferences: Preferences = {
    ...initialPreferences,
    values: {
      ...initialPreferences.values,
      recentProjectFiles: projectFiles,
    },
    getRecentProjectFiles: () => projectFiles,
  };

  const [currentPage, setCurrentPage] = React.useState(1);
  const [searchText, setSearchText] = React.useState('');
  const [filter, setFilter] = React.useState<GamesListFilter>('active');

  return (
    <PreferencesContext.Provider value={preferences}>
      <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
        <GamesList
          storageProviders={[CloudStorageProvider, LocalFileStorageProvider]}
          project={null}
          games={[game1, game2]}
          onRefreshGames={async () => {
            action('onRefreshGames')();
          }}
          onOpenGameManager={action('onOpenGameManager')}
          onOpenProject={async (...args: any[]) => {
            action('onOpenProject')(...args);
          }}
          canOpen={true}
          askToCloseProject={async () => {
            action('askToCloseProject')();
            return true;
          }}
          closeProject={async () => {
            action('closeProject')();
          }}
          canSaveProject
          currentFileMetadata={null}
          disabled={false}
          onChooseProject={action('onChooseProject')}
          onOpenNewProjectSetupDialog={action('onOpenNewProjectSetupDialog')}
          onSaveProject={async () => {
            action('onSaveProject')();
            return null;
          }}
          onUnregisterGame={async (...args: any[]) => {
            action('onUnregisterGame')(...args);
          }}
          onDeleteCloudProject={async (...args: any[]) => {
            action('onDeleteCloudProject')(...args);
          }}
          onRestoreCloudProject={async (...args: any[]) => {
            action('onRestoreCloudProject')(...args);
          }}
          onRegisterProject={async (...args: any[]) => {
            action('onRegisterProject')(...args);
            return null;
          }}
          currentPage={currentPage}
          setCurrentPage={setCurrentPage}
          searchText={searchText}
          setSearchText={setSearchText}
          filter={filter}
          setFilter={setFilter}
        />
      </AuthenticatedUserContext.Provider>
    </PreferencesContext.Provider>
  );
};
