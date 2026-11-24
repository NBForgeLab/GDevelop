import * as React from 'react';
import { Column, Line, Spacer } from './Grid';
import Text from './Text';
import { LineStackLayout } from './Layout';
import FlatButton from './FlatButton';
import { Trans } from '@lingui/macro';
import ImageTileGrid, { type ImageTileComponent } from './ImageTileGrid';
import { type WindowSizeType } from './Responsive/ResponsiveWindowMeasurer';

type ImageTileRowProps = {
  title: React.ReactNode;
  isLoading?: boolean;
  description?: React.ReactNode;
  items: Array<ImageTileComponent>;
  onShowAll?: () => void;
  showAllIcon?: React.ReactNode;
  getLimitFromWindowSize: (
    windowSize: WindowSizeType,
    isLandscape: boolean
  ) => number;
  getColumnsFromWindowSize: (
    windowSize: WindowSizeType,
    isLandscape: boolean
  ) => number;
  seeAllLabel?: React.ReactNode;
  margin?: 'dense';
};

const ImageTileRow = ({
  title,
  description,
  isLoading,
  items,
  onShowAll,
  showAllIcon,
  getLimitFromWindowSize,
  getColumnsFromWindowSize,
  seeAllLabel,
  margin,
}: ImageTileRowProps): React.ReactNode => {
  return (
    <>
      <LineStackLayout
        justifyContent="space-between"
        alignItems="center"
        noMargin
        expand
      >
        <Column noMargin>
          <Text size="section-title">{title}</Text>
        </Column>
        {showAllIcon && onShowAll && (
          <Column noMargin>
            <FlatButton
              onClick={onShowAll}
              label={seeAllLabel || <Trans>See all</Trans>}
              rightIcon={showAllIcon}
            />
          </Column>
        )}
      </LineStackLayout>
      {description && (
        <Line noMargin>
          <Text noMargin>{description}</Text>
        </Line>
      )}
      {margin === 'dense' ? null : <Spacer />}
      <ImageTileGrid
        items={items}
        isLoading={isLoading}
        getLimitFromWindowSize={getLimitFromWindowSize}
        getColumnsFromWindowSize={getColumnsFromWindowSize}
      />
    </>
  );
};

export default ImageTileRow;
