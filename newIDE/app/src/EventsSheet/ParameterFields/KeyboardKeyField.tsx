import React from 'react';
import { Trans } from '@lingui/macro';
import {
  type ParameterFieldProps,
  type ParameterFieldInterface,
  type FieldFocusFunction,
} from './ParameterFieldCommons';

import GenericExpressionField from './GenericExpressionField';
import { TextFieldWithButtonLayout } from '../../UI/Layout';
import RaisedButton from '../../UI/RaisedButton';
import Functions from '@material-ui/icons/Functions';
import FlatButton from '../../UI/FlatButton';
import TypeCursorSelect from '../../UI/CustomSvgIcons/TypeCursorSelect';
import SemiControlledAutoComplete, {
  type SemiControlledAutoCompleteInterface,
} from '../../UI/SemiControlledAutoComplete';
import { type ParameterInlineRendererProps } from './ParameterInlineRenderer';
import { keyNames } from '../../Utils/KeyboardKeyNames';

const keyNamesSet = new Set(keyNames);

const stringRegex = /^"(\w*)"$/;
const valueRegex = /^\w*$/;

const isValidLiteralKeyboardKey = (expression: string): boolean => {
  const matches = expression.match(stringRegex);
  return matches && matches[1] !== undefined
    ? keyNamesSet.has(matches[1])
    : // the expression is not a literal value
      false;
};

// This is not the negation of the function above as both return false for
// non-literal expressions.
const isInvalidLiteralKeyboardKey = (expression: string): boolean => {
  const matches = expression.match(stringRegex);
  // Return true by default as it could be an expression.
  return matches && matches[1] !== undefined
    ? !keyNamesSet.has(matches[1])
    : // the expression is not a literal value
      false;
};

const getStringContent = (expression: string): string => {
  const matches = expression.match(stringRegex);
  return matches && matches[1] !== undefined ? matches[1] : expression;
};

export default React.forwardRef<ParameterFieldInterface, ParameterFieldProps>(
  function KeyboardKeyField(props, ref) {
    const autoCompleteFieldRef =
      React.useRef<SemiControlledAutoCompleteInterface | null>(null);
    const expressionFieldRef = React.useRef<GenericExpressionField | null>(
      null
    );

    const focus: FieldFocusFunction = (options) => {
      if (autoCompleteFieldRef.current)
        autoCompleteFieldRef.current.focus(options);
      if (expressionFieldRef.current) expressionFieldRef.current.focus(options);
    };
    React.useImperativeHandle(ref, () => ({
      focus,
    }));

    // If the current value is not in the list, display an expression field.
    const [isExpressionField, setIsExpressionField] = React.useState(
      !!props.value && !isValidLiteralKeyboardKey(props.value)
    );

    const switchFieldType = () => {
      setIsExpressionField(!isExpressionField);
    };

    const onChangeSelectValue = (value: string) => {
      props.onChange(valueRegex.test(value) ? `"${value}"` : value);
    };

    const onChangeTextValue = (value: string) => {
      props.onChange(value);
    };

    const fieldLabel = props.parameterMetadata
      ? props.parameterMetadata.getDescription()
      : undefined;

    return (
      <TextFieldWithButtonLayout
        renderTextField={() =>
          !isExpressionField ? (
            <SemiControlledAutoComplete
              ref={autoCompleteFieldRef}
              id={
                props.parameterIndex !== undefined
                  ? `parameter-${props.parameterIndex}-key-field`
                  : undefined
              }
              value={getStringContent(props.value)}
              onChange={onChangeSelectValue}
              margin={props.isInline ? 'none' : 'dense'}
              fullWidth
              floatingLabelText={fieldLabel}
              helperMarkdownText={
                props.parameterMetadata
                  ? props.parameterMetadata.getLongDescription()
                  : undefined
              }
              dataSource={keyNames.map((keyName) => ({
                text: keyName,
                value: keyName,
              }))}
              openOnFocus={!props.isInline}
              onRequestClose={props.onRequestClose}
              onApply={props.onApply}
              errorText={
                !props.value ? (
                  <Trans>You must select a key.</Trans>
                ) : !isValidLiteralKeyboardKey(props.value) ? (
                  <Trans>
                    You must select a valid key. "{props.value}" is not valid.
                  </Trans>
                ) : undefined
              }
            />
          ) : (
            <GenericExpressionField
              ref={expressionFieldRef}
              id={
                props.parameterIndex !== undefined
                  ? `parameter-${props.parameterIndex}-key-field`
                  : undefined
              }
              expressionType="string"
              {...props}
              onChange={onChangeTextValue}
            />
          )
        }
        renderButton={(style) =>
          isExpressionField ? (
            <FlatButton
              id="switch-expression-select"
              leftIcon={<TypeCursorSelect />}
              style={style}
              primary
              label={<Trans>Select</Trans>}
              onClick={switchFieldType}
            />
          ) : (
            <RaisedButton
              id="switch-expression-select"
              icon={<Functions />}
              style={style}
              primary
              label={<Trans>Use an expression</Trans>}
              onClick={switchFieldType}
            />
          )
        }
      />
    );
  }
);

export const renderInlineKeyboardKey = ({
  value,
  expressionIsValid,
  InvalidParameterValue,
}: ParameterInlineRendererProps): string | React.ReactElement<any> => {
  if (!value) {
    return (
      <InvalidParameterValue isEmpty>
        <Trans>Choose a key</Trans>
      </InvalidParameterValue>
    );
  }

  return expressionIsValid && !isInvalidLiteralKeyboardKey(value) ? (
    value
  ) : (
    <InvalidParameterValue>{value}</InvalidParameterValue>
  );
};
