import * as React from 'react';

export type Route =
  | 'onboarding'
  | 'guided-lesson'
  | 'signup'
  | 'profile'
  | 'subscription'
  | 'games-dashboard'
  | 'asset-store'
  | 'store'
  | 'build'
  | 'create'
  | 'education'
  | 'learn'
  | 'play'
  | 'standalone'
  | 'ask-ai'
  | 'credits-purchase';

export type RouteKey =
  | 'initial-dialog'
  | 'game-id'
  | 'games-dashboard-tab'
  | 'asset-pack'
  | 'game-template'
  | 'bundle'
  | 'bundle-category'
  | 'tutorial-id'
  | 'course-id'
  | 'create-from-example'
  | 'recommended-plan-id'
  | 'playable-game-id'
  | 'purchase-id'
  | 'claimable-token'
  | 'product-id'
  | 'coupon-code'
  | 'new-project';

export type RouteArguments = Partial<Record<RouteKey, string>>;

export type Router = {
  routeArguments: RouteArguments;
  removeRouteArguments: (keys: Array<RouteKey>) => void;
  addRouteArguments: (args: RouteArguments) => void;
  navigateToRoute: (route: Route, additionalArgument?: RouteArguments) => void;
};

declare const RouterContext: React.Context<Router>;
export default RouterContext;
