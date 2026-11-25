import * as React from 'react';
import { type AuthenticatedUser } from '../../Profile/AuthenticatedUserContext';
import { type Game } from '../../Utils/GDevelopServices/Game';

type Props = {
  onBuildsUpdated?: () => void;
  authenticatedUser: AuthenticatedUser;
  game: Game;
  onGameUpdated?: (game: Game) => void;
};

declare class Builds extends React.Component<Props> {}

export default Builds;
