import * as React from 'react';
import { CompactBehaviorPropertiesEditor } from './CompactBehaviorPropertiesEditor';
import { type CompactBehaviorPropertiesEditorProps } from './CompactBehaviorPropertiesEditorProps.flow';
import CompactAnchorBehaviorEditor from './CompactAnchorBehaviorEditor';

const components: Record<
  string,
  {
    component: React.ComponentType<CompactBehaviorPropertiesEditorProps>;
  }
> = {
  'AnchorBehavior::AnchorBehavior': {
    component: CompactAnchorBehaviorEditor,
  },
};

/**
 * A service returning editor components for each behavior type.
 */
const CompactBehaviorsEditorService = {
  getEditor(
    behaviorType: string
  ): React.ComponentType<CompactBehaviorPropertiesEditorProps> {
    if (!components[behaviorType]) {
      return CompactBehaviorPropertiesEditor; // Default properties editor
    }
    return components[behaviorType].component; // Custom  behavior editor
  },
  components,
};

export default CompactBehaviorsEditorService;
