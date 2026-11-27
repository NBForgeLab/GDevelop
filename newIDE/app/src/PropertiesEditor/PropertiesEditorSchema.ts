import { type I18n as I18nType } from '@lingui/core';
import * as React from 'react';
import { type MenuItemTemplate } from '../UI/Menu/Menu';
import { type ResourceKind } from '../ResourcesList/ResourceSource';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor';

// An "instance" here is the objects for which properties are shown
export type Instance = Record<string, any>; // This could be improved using generics.
export type Instances = Array<Instance>;

export type FieldVisibility = 'basic' | 'advanced' | 'deprecated';
export type FieldDisablingMethod = 'never' | 'always' | 'onValuesDifferent';

// "Value" fields are fields displayed in the properties.
export type ValueFieldCommonProperties = {
  name: string;
  getLabel?: (instance: Instance) => string;
  getDescription?: (instance: Instance) => string;
  hideLabel?: boolean;
  isHighlighted?: (instance: Instance) => boolean;
  getExtraDescription?: (instance: Instance) => string;
  hasImpactOnAllOtherFields?: boolean;
  canBeUnlimitedUsingMinus1?: boolean;
  disabled?: (instances: Array<Instance>) => FieldDisablingMethod;
  onEditButtonBuildMenuTemplate?: (i18n: I18nType) => Array<MenuItemTemplate>;
  onEditButtonClick?: () => void;
  getValueFromDisplayedValue?: (arg0: string) => string;
  getDisplayedValueFromValue?: (arg0: string) => string;
  visibility?: FieldVisibility | null;
  defaultValue?: string | number | boolean | null;
};

export type FieldChoices = {
  value: string;
  label: MessageDescriptor;
  labelIsUserDefined?: boolean;
};

// "Primitive" value fields are "simple" fields.
export type PrimitiveValueField =
  | (ValueFieldCommonProperties & {
      valueType: 'number';
      getValue: (instance: Instance) => number | null;
      setValue: (instance: Instance, newValue: number) => void;
      getChoices?: (() => Array<FieldChoices>) | null;
      /** Only supported on non compact property editors. */
      getEndAdornment?: (instance: Instance) => {
        label: string;
        tooltipContent: React.ReactNode;
      };
      getEndAdornmentIcon?: (
        instance: Instance
      ) => ((className: string) => React.ReactNode) | null | undefined;
      onClickEndAdornment?: (instance: Instance) => void;
      renderLeftIcon?: (className?: string) => React.ReactNode;
    })
  | (ValueFieldCommonProperties & {
      valueType: 'string';
      getValue: (instance: Instance) => string | null;
      setValue: (instance: Instance, newValue: string) => void;
      getChoices?: (() => Array<FieldChoices>) | null;
      isHiddenWhenOnlyOneChoice?: boolean;
      isAutocompleted?: boolean;
      isAllowingAnyValue?: boolean;
      getEndAdornmentIcon?: (
        instance: Instance
      ) => ((className: string) => React.ReactNode) | null | undefined;
      onClickEndAdornment?: (instance: Instance) => void;
      renderLeftIcon?: (className?: string) => React.ReactNode;
    })
  | (ValueFieldCommonProperties & {
      valueType: 'boolean';
      getValue: (instance: Instance) => boolean | null;
      setValue: (instance: Instance, newValue: boolean) => void;
    })
  | (ValueFieldCommonProperties & {
      /** Only supported on compact property editors. */
      valueType: 'enumIcon';
      renderIcon: (value: any) => React.ReactNode;
      getValue: (instance: Instance) => any;
      isHighlighted: (value: any) => boolean;
      setValue: (instance: Instance, newValue: any) => void;
      getNextValue: (currentValue: any) => any;
    })
  | (ValueFieldCommonProperties & {
      valueType: 'color';
      getValue: (instance: Instance) => string;
      setValue: (instance: Instance, newValue: string) => void;
    })
  | (ValueFieldCommonProperties & {
      /** A number of which each bit is displayed as a toggle. */
      valueType: 'bitmask';
      getValue: (instance: Instance) => number;
      setValue: (instance: Instance, newValue: number) => void;
      firstBit: number;
      bitCount: number;
    })
  | (ValueFieldCommonProperties & {
      valueType: 'multilinestring';
      getValue: (instance: Instance) => string;
      setValue: (instance: Instance, newValue: string) => void;
    });

// "Resource" fields are showing a resource selector.
export type ResourceField = ValueFieldCommonProperties & {
  valueType: 'resource';
  resourceKind: ResourceKind;
  getValue: (instance: Instance) => string;
  setValue: (instance: Instance, newValue: string) => void;
  renderLeftIcon?: (className?: string) => React.ReactNode;
};

export type LeaderboardIdField = ValueFieldCommonProperties & {
  valueType: 'leaderboardId';
  getValue: (instance: Instance) => string;
  setValue: (instance: Instance, newValue: string) => void;
};

export type Title = {
  name: string;
  title: string;
  renderLeftIcon: (className?: string) => React.ReactNode;
  getValue?: (instance: Instance) => string;
  nonFieldType: 'title';
  defaultValue?: string;
};

export type SectionTitle = {
  name: string;
  title: string;
  nonFieldType: 'sectionTitle';
  getValue: undefined;
};

export type VerticalCenterWithBar = {
  name: string;
  nonFieldType: 'verticalCenterWithBar';
  child: PrimitiveValueField;
};

export type ActionButton = {
  label: string;
  disabled: 'onValuesDifferent';
  getValue: (instance: Instance) => string;
  nonFieldType: 'button';
  getIcon?: (arg0: { fontSize: string }) => React.ReactNode;
  showRightIcon?: boolean;
  onClick: (instance: Instance) => void;
};

export type ToggleButtons = ValueFieldCommonProperties & {
  nonFieldType: 'toggleButtons';
  buttons: Array<{
    name: string;
    renderIcon: (className?: string) => React.ReactNode;
    tooltip: React.ReactNode;
    getValue: (instance: Instance) => boolean;
    setValue: (instance: Instance, newValue: boolean) => void;
  }>;
};

// A value field is a primitive or a resource.
export type ValueField =
  | PrimitiveValueField
  | ResourceField
  | LeaderboardIdField;

// A field can be a primitive, a resource or a list of fields
export type Field =
  | PrimitiveValueField
  | ResourceField
  | LeaderboardIdField
  | SectionTitle
  | Title
  | ActionButton
  | ToggleButtons
  | VerticalCenterWithBar
  | {
      name: string;
      type: 'row' | 'column';
      preventWrap?: boolean;
      removeSpacers?: boolean;
      title?: string | null;
      /** A section inside a group, with a smaller title. */
      isSubgroup?: boolean;
      children: Array<Field>;
      isHidden?: (arg0: Array<Instance>) => boolean;
    };

// The schema is the tree of all fields.
export type Schema = Array<Field>;
