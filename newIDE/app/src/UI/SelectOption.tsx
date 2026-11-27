import * as React from 'react';
import { I18n } from '@lingui/react';
import { type I18n as I18nType } from '@lingui/core';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';

// We support a subset of the props supported by Material-UI v0.x MenuItem
// They should be self descriptive - refer to Material UI docs otherwise.
type Props = {
  value: string | number | boolean;
  label: MessageDescriptor | React.ReactNode;
  disabled?: boolean;
  shouldNotTranslate?: boolean;
};

const isMessageDescriptorObject = (
  label: MessageDescriptor | React.ReactNode
): label is Exclude<MessageDescriptor, string> =>
  typeof label === 'object' &&
  label !== null &&
  'id' in label &&
  typeof label.id === 'string' &&
  !React.isValidElement(label);

const formatSelectOptionLabel = (
  label: MessageDescriptor | React.ReactNode,
  i18n: I18nType,
  shouldNotTranslate?: boolean
): React.ReactNode => {
  if (isMessageDescriptorObject(label)) {
    return shouldNotTranslate ? label.defaults || label.id : i18n._(label);
  }
  if (typeof label === 'string') {
    return shouldNotTranslate ? label : i18n._(label);
  }
  return label;
};

/**
 * A native select option to be used with `SelectField`.
 */
const SelectOption = (props: Props): React.ReactNode => {
  const gdevelopTheme = React.useContext(GDevelopThemeContext);

  return (
    <I18n>
      {({ i18n }) => (
        <option
          value={
            typeof props.value === 'boolean' ? String(props.value) : props.value
          }
          disabled={props.disabled}
          style={{
            color: gdevelopTheme.text.color.primary,
            backgroundColor: gdevelopTheme.palette.canvasColor,
          }}
        >
          {formatSelectOptionLabel(props.label, i18n, props.shouldNotTranslate)}
        </option>
      )}
    </I18n>
  );
};

export default SelectOption;
