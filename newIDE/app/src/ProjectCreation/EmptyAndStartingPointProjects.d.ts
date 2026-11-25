import * as React from 'react';
import type { ExampleShortHeader } from '../Utils/GDevelopServices/Example';

export declare const isStartingPointExampleShortHeader: (
  exampleShortHeader: ExampleShortHeader
) => boolean;

export declare const isLinkedToStartingPointExampleShortHeader: (
  allExampleShortHeaders: Array<ExampleShortHeader>,
  exampleShortHeader: ExampleShortHeader
) => boolean;

export type Props = {
  onSelectEmptyProject: () => void;
  onSelectExampleShortHeader: (exampleShortHeader: ExampleShortHeader) => void;
  disabled?: boolean;
  onSeeAll?: () => void;
  title: React.ReactNode;
};

declare const EmptyAndStartingPointProjects: React.ComponentType<Props>;
export default EmptyAndStartingPointProjects;
