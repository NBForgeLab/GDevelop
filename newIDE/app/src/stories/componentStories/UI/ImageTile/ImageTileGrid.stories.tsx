import * as React from 'react';

import paperDecorator from '../../../PaperDecorator';

import ImageTileGrid from '../../../../UI/ImageTileGrid';
import { type WindowSizeType } from '../../../../UI/Responsive/ResponsiveWindowMeasurer';
import {
  itemsWithJustImage,
  itemsWithOverlay,
  itemsWithTitleAndDescription,
  itemsWithLocks,
} from './data';

export default {
  title: 'UI Building Blocks/ImageTile/ImageTileGrid',
  component: ImageTileGrid,
  decorators: [paperDecorator],
};

const getColumnsFromWindowSize = (windowSize: WindowSizeType) => {
  switch (windowSize) {
    case 'small':
      return 2;
    case 'medium':
      return 3;
    case 'large':
    default:
      return 5;
  }
};

export const Default = (): React.ReactNode => (
  <ImageTileGrid
    items={itemsWithJustImage}
    getColumnsFromWindowSize={getColumnsFromWindowSize}
  />
);

export const WithTitleAndDescription = (): React.ReactNode => (
  <ImageTileGrid
    items={itemsWithTitleAndDescription}
    getColumnsFromWindowSize={getColumnsFromWindowSize}
  />
);

export const WithLocks = (): React.ReactNode => (
  <ImageTileGrid
    items={itemsWithLocks}
    getColumnsFromWindowSize={getColumnsFromWindowSize}
  />
);

export const WithOverlay = (): React.ReactNode => (
  <ImageTileGrid
    items={itemsWithOverlay}
    getColumnsFromWindowSize={getColumnsFromWindowSize}
  />
);
