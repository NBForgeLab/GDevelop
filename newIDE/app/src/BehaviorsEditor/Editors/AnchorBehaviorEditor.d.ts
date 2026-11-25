import * as React from 'react';

export type BasicAnchor =
  | 'None'
  | 'ProportionalFill'
  | 'FixedFill'
  | 'MinEdge'
  | 'MaxEdge'
  | 'Center'
  | 'Advanced';

export declare const getBasicHorizontalAnchor: (
  getPropertyValue: (propertyName: string) => string | null
) => BasicAnchor;

export declare const getBasicVerticalAnchor: (
  getPropertyValue: (propertyName: string) => string | null
) => BasicAnchor;

export declare const HorizontalAnchorButtonGroup: React.ComponentType<{
  basicAnchor: BasicAnchor;
  onUpdateProperty: (propertyName: string, value: string) => void;
  expand?: boolean;
}>;

export declare const VerticalAnchorButtonGroup: React.ComponentType<{
  basicAnchor: BasicAnchor;
  onUpdateProperty: (propertyName: string, value: string) => void;
  expand?: boolean;
}>;

declare const AnchorBehaviorEditor: React.ComponentType<any>;

export default AnchorBehaviorEditor;
