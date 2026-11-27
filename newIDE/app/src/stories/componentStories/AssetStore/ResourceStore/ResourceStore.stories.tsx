import * as React from 'react';

import { getPaperDecorator } from '../../../PaperDecorator';
import FixedHeightFlexContainer from '../../../FixedHeightFlexContainer';
import { ResourceStoreStateProvider } from '../../../../AssetStore/ResourceStore/ResourceStoreContext';
import { ResourceStore } from '../../../../AssetStore/ResourceStore';
import MockAdapter from 'axios-mock-adapter';
import { client as assetApiClient } from '../../../../Utils/GDevelopServices/Asset';

export default {
  title: 'AssetStore/ResourceStore',
  component: ResourceStore,
  decorators: [getPaperDecorator('medium')],
};

const ResourceStoreStory = ({ kind }: { kind: 'audio' | 'font' | 'svg' }) => {
  const [selectedResourceIndex, setSelectedResourceIndex] = React.useState<
    number | null | undefined
  >(null);
  return (
    <FixedHeightFlexContainer height={600}>
      <ResourceStoreStateProvider>
        <ResourceStore
          resourceKind={kind}
          selectedResourceIndex={selectedResourceIndex}
          onSelectResource={setSelectedResourceIndex}
        />
      </ResourceStoreStateProvider>
    </FixedHeightFlexContainer>
  );
};

export const AudioResource = (): React.ReactNode => (
  <ResourceStoreStory kind="audio" />
);

export const FontResource = (): React.ReactNode => (
  <ResourceStoreStory kind="font" />
);

export const SvgResource = (): React.ReactNode => (
  <ResourceStoreStory kind="svg" />
);

export const FontResourceWithLoadingError = (): React.ReactNode => {
  const axiosMock = new MockAdapter(assetApiClient, { delayResponse: 500 });
  axiosMock.onAny().reply(500);

  return <ResourceStoreStory kind="font" />;
};
