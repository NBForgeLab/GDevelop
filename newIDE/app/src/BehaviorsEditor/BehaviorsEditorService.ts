import * as React from 'react';
import BehaviorPropertiesEditor from './Editors/BehaviorPropertiesEditor';
import { type BehaviorEditorProps } from './Editors/BehaviorEditorProps';
import Physics2Editor from './Editors/Physics2Editor';
import Physics3DEditor from './Editors/Physics3DEditor';
import AnchorBehaviorEditor from './Editors/AnchorBehaviorEditor';

const components: Record<
  string,
  {
    component: React.ComponentType<BehaviorEditorProps>;
  }
> = {
  'Physics2::Physics2Behavior': {
    component: Physics2Editor,
  },
  'Physics3D::Physics3DBehavior': {
    component: Physics3DEditor,
  },
  'AnchorBehavior::AnchorBehavior': {
    component: AnchorBehaviorEditor,
  },
};

/**
 * A service returning editor components for each behavior type.
 */
const BehaviorsEditorService = {
  getEditor(behaviorType: string): React.ComponentType<BehaviorEditorProps> {
    if (!components[behaviorType]) {
      return BehaviorPropertiesEditor; // Default properties editor
    }
    return components[behaviorType].component; // Custom  behavior editor
  },
  components,
};

export default BehaviorsEditorService;
