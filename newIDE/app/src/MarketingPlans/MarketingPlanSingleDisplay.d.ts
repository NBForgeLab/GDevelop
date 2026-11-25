import * as React from 'react';
import {
  type MarketingPlan,
  type GameFeaturing,
  type Game,
} from '../Utils/GDevelopServices/Game';

type Props = {
  game: Game;
  marketingPlan: MarketingPlan;
  gameFeaturings: Array<GameFeaturing> | null | undefined;
  fetchGameFeaturings: () => Promise<void>;
};

declare const MarketingPlanSingleDisplay: React.ComponentType<Props>;

export default MarketingPlanSingleDisplay;
