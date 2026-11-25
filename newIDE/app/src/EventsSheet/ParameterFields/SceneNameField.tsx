import React from 'react';
import GenericExpressionField from './GenericExpressionField';
import { enumerateLayouts } from '../../ProjectManager/EnumerateProjectItems';
import {
  type ParameterFieldProps,
  type ParameterFieldInterface,
  type FieldFocusFunction,
} from './ParameterFieldCommons';
import FlatButton from '../../UI/FlatButton';
import TypeCursorSelect from '../../UI/CustomSvgIcons/TypeCursorSelect';
import { t, Trans } from '@lingui/macro';
import Functions from '@material-ui/icons/Functions';
import RaisedButton from '../../UI/RaisedButton';
import SelectOption from '../../UI/SelectOption';
import { TextFieldWithButtonLayout } from '../../UI/Layout';
import SelectField, { type SelectFieldInterface } from '../../UI/SelectField';

export default React.forwardRef<ParameterFieldInterface, ParameterFieldProps>(
  function SceneNameField(props: ParameterFieldProps, ref) {
    const selectFieldRef = React.useRef<SelectFieldInterface | null>(null);
    const expressionFieldRef = React.useRef<GenericExpressionField | null>(
      null
    );
    const focus: FieldFocusFunction = (options) => {
      if (selectFieldRef.current) selectFieldRef.current.focus(options);
      if (expressionFieldRef.current) expressionFieldRef.current.focus(options);
    };
    React.useImperativeHandle(ref, () => ({
      focus,
    }));

    // The list is not kept with a memo because scenes could be added by
    // another component without this one to know.
    const layoutNames = props.project
      ? enumerateLayouts(props.project).map((layout) => layout.getName())
      : [];

    const isCurrentValueInLayoutsList = !!layoutNames.find(
      (layoutName) => `"${layoutName}"` === props.value
    );

    // If the current value is not in the list of scenes, display an expression field.
    const [isExpressionField, setIsExpressionField] = React.useState<boolean>(
      (!!props.value && !isCurrentValueInLayoutsList) ||
        !!props.scope.eventsFunctionsExtension
    );

    const switchFieldType = () => {
      setIsExpressionField(!isExpressionField);
    };

    const onChangeSelectValue = (event: { target: { value: string } }) => {
      props.onChange(event.target.value);
    };

    const onChangeTextValue = (value: string) => {
      props.onChange(value);
    };

    const fieldLabel = props.parameterMetadata
      ? props.parameterMetadata.getDescription()
      : undefined;

    const selectOptions = layoutNames.map((layoutName) => (
      <SelectOption
        key={layoutName}
        value={`"${layoutName}"`}
        label={layoutName}
        shouldNotTranslate
      />
    ));

    return (
      <TextFieldWithButtonLayout
        renderTextField={() =>
          !isExpressionField ? (
            <SelectField
              ref={selectFieldRef}
              id={
                props.parameterIndex !== undefined
                  ? `parameter-${props.parameterIndex}-scene-field`
                  : undefined
              }
              value={props.value}
              onChange={onChangeSelectValue}
              margin={props.isInline ? 'none' : 'dense'}
              fullWidth
              floatingLabelText={fieldLabel}
              translatableHintText={t`Choose a scene`}
              helperMarkdownText={
                (props.parameterMetadata &&
                  props.parameterMetadata.getLongDescription()) ||
                null
              }
            >
              {selectOptions}
            </SelectField>
          ) : (
            <GenericExpressionField
              ref={expressionFieldRef}
              id={
                props.parameterIndex !== undefined
                  ? `parameter-${props.parameterIndex}-scene-field`
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
