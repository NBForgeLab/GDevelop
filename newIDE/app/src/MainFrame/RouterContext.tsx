import * as React from 'react';
import Window from '../Utils/Window';

export type Route =
  // For compatibility when there was only one tutorial.

  | 'onboarding' // New way of opening a tutorial.
  | 'guided-lesson'
  | 'signup'
  | 'profile'
  | 'subscription'
  | 'games-dashboard' // For compatibility when there was only asset packs.
  | 'asset-store' // New way of opening the store.
  | 'store' // Old way of opening the build section
  | 'build' // New way of opening the build section
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
  removeRouteArguments: (arg0: RouteKey[]) => void;
  addRouteArguments: (routeArguments: RouteArguments) => void;
  navigateToRoute: (route: Route, additionalArgument?: RouteArguments) => void;
};

export const initialRouterState: Router = {
  routeArguments: {},
  removeRouteArguments: () => {},
  addRouteArguments: () => {},
  navigateToRoute: () => {},
};

const RouterContext: React.Context<Router> =
  React.createContext<Router>(initialRouterState);

export default RouterContext;

type Props = {
  children?: React.ReactNode;
};

export const RouterContextProvider = ({
  children,
}: Props): React.ReactElement<any> => {
  // Put value in the state, so we can control when the DOM re-renders.
  const [routeArguments, setRouteArguments] = React.useState<RouteArguments>(
    () => Window.getArguments() as RouteArguments
  );

  const removeRouteArguments = React.useCallback(
    (argumentsToRemove: RouteKey[]) => {
      // Remove them from the window. (only for web)
      // Assume that the arguments are always valid.
      Window.removeArguments(argumentsToRemove);
      // Update the state accordingly, based on the previous state.
      setRouteArguments((oldArguments) => {
        const newArguments = { ...oldArguments };
        argumentsToRemove.forEach((argument) => {
          delete newArguments[argument];
        });
        return newArguments;
      });
    },
    []
  );

  const addRouteArguments = React.useCallback(
    (argumentsToAdd: RouteArguments) => {
      // Add them to the window. (only for web)
      // Assume that the arguments are always valid.
      Window.addArguments(argumentsToAdd);
      // Update the state accordingly, based on the previous state.
      setRouteArguments((oldArguments) => ({
        ...oldArguments,
        ...argumentsToAdd,
      }));
    },
    []
  );

  const navigateToRoute = React.useCallback(
    (route: Route, additionalArguments?: RouteArguments) => {
      // add the new route, assumed to be a dialog, and possible additional arguments to the router.
      addRouteArguments({ ...additionalArguments, 'initial-dialog': route });
    },
    [addRouteArguments]
  );

  const value = React.useMemo(
    () => ({
      routeArguments,
      addRouteArguments,
      removeRouteArguments,
      navigateToRoute,
    }),
    [routeArguments, addRouteArguments, removeRouteArguments, navigateToRoute]
  );

  return (
    <RouterContext.Provider value={value}>{children}</RouterContext.Provider>
  );
};
