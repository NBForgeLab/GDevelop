export type ToolScopeType =
  | 'project'
  | 'scene'
  | 'external_layout'
  | 'external_events'
  | 'extension'
  | 'custom_behavior'
  | 'custom_object'
  | 'custom_object_variant';

export type ToolScope = {
  type: ToolScopeType;
  scene_name?: string;
  external_layout_name?: string;
  external_events_name?: string;
  extension_name?: string;
  custom_behavior_name?: string;
  custom_object_name?: string;
  variant_name?: string;
};
