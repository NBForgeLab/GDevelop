type UseMultiplayerLobbyConfiguratorOutput = {
  configureMultiplayerLobbiesIfNeeded: (
    project: gdProject,
    sourceGameId: string
  ) => Promise<void>;
};

export declare const useMultiplayerLobbyConfigurator: () => UseMultiplayerLobbyConfiguratorOutput;
