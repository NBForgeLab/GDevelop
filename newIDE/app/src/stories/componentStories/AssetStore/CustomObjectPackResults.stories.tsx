import * as React from 'react';
import { action } from '@storybook/addon-actions';

import paperDecorator from '../../PaperDecorator';
import { AssetStoreStateProvider } from '../../../AssetStore/AssetStoreContext';
import { CustomObjectPackResults } from '../../../AssetStore/NewObjectFromScratch';
import FixedHeightFlexContainer from '../../FixedHeightFlexContainer';
import { AssetStoreNavigatorStateProvider } from '../../../AssetStore/AssetStoreNavigator';

export default {
  title: 'AssetStore/CustomObjectPackResults',
  component: CustomObjectPackResults,
  decorators: [paperDecorator],
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return (
    <FixedHeightFlexContainer height={500}>
      <AssetStoreNavigatorStateProvider>
        <AssetStoreStateProvider>{children}</AssetStoreStateProvider>
      </AssetStoreNavigatorStateProvider>
    </FixedHeightFlexContainer>
  );
};

export const Default = (): React.ReactNode => (
  <Wrapper>
    <CustomObjectPackResults
      packTag="multitouch joysticks"
      onAssetSelect={async (...args: any[]) => {
        action('onAssetSelect')(...args);
      }}
      onBack={action('onBack')}
      isAssetBeingInstalled={false}
    />
  </Wrapper>
);

export const Installing = (): React.ReactNode => (
  <Wrapper>
    <CustomObjectPackResults
      packTag="multitouch joysticks"
      onAssetSelect={async (...args: any[]) => {
        action('onAssetSelect')(...args);
      }}
      onBack={action('onBack')}
      isAssetBeingInstalled
    />
  </Wrapper>
);
