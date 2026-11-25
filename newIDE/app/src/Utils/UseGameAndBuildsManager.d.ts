import { type Build } from './GDevelopServices/Build';
import { type Game, type SavedStatus } from './GDevelopServices/Game';

type GameAvailabilityError = 'not-found' | 'not-owned' | 'unexpected';

export declare const getDefaultRegisterGameProperties: (options: {
  projectId: string;
  projectName: string | null | undefined;
  projectAuthor: string | null | undefined;
  savedStatus: SavedStatus;
}) => {
  authorName: string;
  gameId: string;
  gameName: string;
  savedStatus: SavedStatus;
};

export type GameManager = {
  game: Game | null | undefined;
  setGame: (game: Game) => void;
  refreshGame: () => Promise<void>;
  gameAvailabilityError: GameAvailabilityError | null | undefined;
  registerGameIfNeeded: () => Promise<void>;
};

export type GameAndBuildsManager = GameManager & {
  gameBuilds: Array<Build> | null | undefined;
  refreshGameBuilds: () => Promise<void>;
};

type Props = {
  project: gdProject | null | undefined;
  copyLeaderboardsAndMultiplayerLobbiesFromGameId?: string;
  onGameRegistered?: () => Promise<void>;
};

export declare const useGameManager: (props: Props) => GameManager;

export declare const useGameAndBuildsManager: (
  props: Props
) => GameAndBuildsManager;
