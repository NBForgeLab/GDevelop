import * as React from 'react';
import { type Game } from '../Utils/GDevelopServices/Game';

type Props = {
  game: Game;
  onClose: () => void;
};

declare const MarketingPlansDialog: React.ComponentType<Props>;

export default MarketingPlansDialog;
