import { type Promotion } from '../Utils/GDevelopServices/Announcement';
import {
  type Route,
  type RouteKey,
  type RouteArguments,
} from '../MainFrame/RouterContext';
import Window from '../Utils/Window';

const getRouteNavigationParamsFromLink = (
  link: string
): {
  route: Route;
  params: RouteArguments;
} | null => {
  if (link.startsWith('https://editor.gdevelop.io')) {
    const url = new URL(link);
    // Assume that the arguments are always valid.
    const route = url.searchParams.get('initial-dialog') as Route | null;
    const otherParams: RouteArguments = {};
    url.searchParams.forEach((value, key) => {
      if (key !== 'initial-dialog') {
        otherParams[key as RouteKey] = value;
      }
    });
    if (route) {
      return { route, params: otherParams };
    }

    return null;
  }

  return null;
};

export const getOnClick = ({
  promotion,
  navigateToRoute,
}: {
  promotion: Promotion;
  navigateToRoute: (route: Route, additionalArgument?: RouteArguments) => void;
}): (() => void) | null | undefined => {
  const productId = promotion.productId;
  if (productId) {
    if (promotion.type === 'game-template') {
      return () =>
        navigateToRoute('store', { 'game-template': `product-${productId}` });
    }
    if (promotion.type === 'asset-pack') {
      return () =>
        navigateToRoute('store', { 'asset-pack': `product-${productId}` });
    }
  }

  const linkUrl = promotion.linkUrl;
  if (linkUrl) {
    const routeNavigationParams = getRouteNavigationParamsFromLink(linkUrl);

    return routeNavigationParams
      ? () =>
          navigateToRoute(
            routeNavigationParams.route,
            routeNavigationParams.params
          )
      : () => Window.openExternalURL(linkUrl);
  }

  return undefined;
};
