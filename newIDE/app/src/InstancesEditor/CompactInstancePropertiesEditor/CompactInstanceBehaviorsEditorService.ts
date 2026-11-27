import * as React from 'react';
import { CompactInstanceBehaviorPropertiesEditor } from './CompactInstanceBehaviorPropertiesEditor';
import { type CompactInstanceBehaviorPropertiesEditorProps } from './CompactInstanceBehaviorPropertiesEditorProps';
import CompactInstanceAnchorBehaviorEditor from './CompactAnchorInstanceBehaviorEditor';

const components: Record<
  string,
  {
    component: React.ComponentType<CompactInstanceBehaviorPropertiesEditorProps>;
  }
> = {
  'AnchorBehavior::AnchorBehavior': {
    component: CompactInstanceAnchorBehaviorEditor,
  },
};

/**
 * A service returning editor components for each behavior type.
 */
const CompactBehaviorsEditorService = {
  getEditor(
    behaviorType: string
  ): React.ComponentType<CompactInstanceBehaviorPropertiesEditorProps> {
    if (!components[behaviorType]) {
      return CompactInstanceBehaviorPropertiesEditor; // Default properties editor
    }
    return components[behaviorType].component; // Custom  behavior editor
  },
  components,
};

export default CompactBehaviorsEditorService;
