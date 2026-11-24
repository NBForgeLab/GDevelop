import * as React from 'react';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';
import TextField, {
  type TextFieldInterface,
  type TextFieldStyleProps,
} from './TextField';
import { type FieldFocusFunction } from '../EventsSheet/ParameterFields/ParameterFieldCommons';

type Props = {
  onChange: (arg0: string) => void;
  value: string;
  commitOnBlur?: boolean;
  onFocus?: (arg0: {
    currentTarget: {
      value: string;
    };
    preventDefault: () => void;
  }) => void;
  onBlur?: (arg0: {
    currentTarget: {
      value: string;
    };
  }) => void;
  type?: 'text' | 'number';
  // Some TextField props that can be reused:
  onClick?: (event: React.PointerEvent<HTMLInputElement>) => void;
  onKeyPress?: (event: React.KeyboardEvent) => void;
  onKeyUp?: (event: React.KeyboardEvent) => void;
  onKeyDown?: (event: React.KeyboardEvent) => void;
  margin?: 'none' | 'dense';
  disabled?: boolean;
  errorText?: React.ReactNode;
  floatingLabelFixed?: boolean;
  floatingLabelText?: React.ReactNode;
  fullWidth?: boolean;
  translatableHintText?: MessageDescriptor;
  hintText?: string;
  helperMarkdownText?: string | null;
  id?: string;
  inputStyle?: Record<string, any>;
  maxLength?: number;
  precision?: number;
  max?: number;
  min?: number;
  multiline?: boolean;
  name?: string;
  step?: number;
  style?: TextFieldStyleProps;
  rows?: number;
  rowsMax?: number;
  autoFocus?: 'desktop' | 'desktopAndMobileDevices';
  endAdornment?: React.ReactNode;
};

export type SemiControlledTextFieldInterface = {
  focus: FieldFocusFunction;
  isFocused: () => boolean;
  forceSetValue: (text: string) => void;
  forceSetSelection: (start: number, end: number) => void;
  getInputNode: () => HTMLInputElement | null | undefined;
  getFieldWidth: () => number | null | undefined;
  getCaretPosition: () => number | null | undefined;
};

/**
 * This component works like a material-ui TextField, except that
 * the value passed as props is not forced into the text field when the user
 * is typing. This is useful if the parent component can do modifications on the value:
 * the user won't be interrupted or have the value changed until he blurs the field.
 */
const SemiControlledTextField = React.forwardRef<
  SemiControlledTextFieldInterface,
  Props
>((props, ref) => {
  const [focused, setFocused] = React.useState<boolean>(false);
  const [text, setText] = React.useState<string | null | undefined>(null);
  const textFieldRef = React.useRef<TextFieldInterface | null>(null);

  const forceSetValue = (text: string) => {
    setText(text);
  };

  const forceSetSelection = (selectionStart: number, selectionEnd: number) => {
    const input = getInputNode();
    if (input) {
      input.selectionStart = selectionStart;
      input.selectionEnd = selectionEnd;
    }
  };

  const focus: FieldFocusFunction = (options) => {
    if (textFieldRef.current) textFieldRef.current.focus(options);
  };

  const isFocused = (): boolean => {
    return focused;
  };

  const getInputNode = (): HTMLInputElement | null | undefined => {
    if (textFieldRef.current) return textFieldRef.current.getInputNode();
    return undefined;
  };

  const getFieldWidth = () => {
    if (textFieldRef.current) return textFieldRef.current.getFieldWidth();
    return undefined;
  };

  const getCaretPosition = () => {
    if (textFieldRef.current) return textFieldRef.current.getCaretPosition();
    return undefined;
  };

  React.useImperativeHandle(ref, () => ({
    focus,
    isFocused,
    getInputNode,
    forceSetSelection,
    forceSetValue,
    getFieldWidth,
    getCaretPosition,
  }));

  const {
    value,
    onChange,
    commitOnBlur,
    onFocus,
    onBlur,
    type,
    ...otherProps
  } = props;

  const commonProps = {
    ...otherProps,
    ref: textFieldRef,
    value: focused ? (text ?? '') : value,
    onFocus: (event: {
      currentTarget: {
        value: string;
      };
      preventDefault: () => void;
    }) => {
      setFocused(true);
      setText(value);

      if (onFocus) onFocus(event);
    },
    onChange: (
      event: {
        target: {
          value: string;
        };
      },
      newValue: string
    ) => {
      setText(newValue);
      if (!commitOnBlur) onChange(newValue);
    },
    onBlur: (event: {
      currentTarget: {
        value: string;
      };
    }) => {
      onChange(event.currentTarget.value);
      setFocused(false);
      setText(null);

      if (onBlur) onBlur(event);
    },
  };

  return type === 'number' ? (
    <TextField {...commonProps} type="number" />
  ) : (
    <TextField {...commonProps} type="text" />
  );
});

export default SemiControlledTextField;
