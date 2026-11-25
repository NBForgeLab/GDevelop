import * as React from 'react';
import { type ResourceKindSupportedByResourceStore } from './ResourceStoreContext';

type Props = {
  selectedResourceIndex?: number | null;
  onSelectResource: (index: number | null | undefined) => void;
  resourceKind: ResourceKindSupportedByResourceStore;
};

export declare const ResourceStore: React.ComponentType<Props>;
