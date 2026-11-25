import * as React from 'react';
import { type ResourceManagementProps } from '../../ResourcesList/ResourceSource';

type CompactBehaviorPropertiesEditorProps = {
  project: gdProject;
  behaviorMetadata: gdBehaviorMetadata;
  behaviors: Array<gdBehavior>;
  object: gdObject | null;
  layersContainer: gdLayersContainer;
  onOpenFullEditor?: () => void;
  onBehaviorUpdated: () => void;
  resourceManagementProps: ResourceManagementProps;
  isAdvancedSectionInitiallyUncollapsed?: boolean;
};

declare const CompactBehaviorsEditorService: {
  getEditor: (
    behaviorType: string
  ) => React.ComponentType<CompactBehaviorPropertiesEditorProps>;
  components: Record<
    string,
    { component: React.ComponentType<CompactBehaviorPropertiesEditorProps> }
  >;
};

export default CompactBehaviorsEditorService;
