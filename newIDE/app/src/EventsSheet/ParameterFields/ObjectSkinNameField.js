// @flow
import * as React from 'react';
import { Trans, t } from '@lingui/macro';
import GenericExpressionField from './GenericExpressionField';
import {
  type ParameterFieldProps,
  type ParameterFieldInterface,
  type FieldFocusFunction,
} from './ParameterFieldCommons';
import SelectField, { type SelectFieldInterface } from '../../UI/SelectField';
import SelectOption from '../../UI/SelectOption';
import { TextFieldWithButtonLayout } from '../../UI/Layout';
import FlatButton from '../../UI/FlatButton';
import RaisedButton from '../../UI/RaisedButton';
import Functions from '@material-ui/icons/Functions';
import TypeCursorSelect from '../../UI/CustomSvgIcons/TypeCursorSelect';

export default (React.forwardRef<ParameterFieldProps, ParameterFieldInterface>(
  function ObjectSkinNameField(props: ParameterFieldProps, ref) {
    const field = React.useRef<?(
      | GenericExpressionField
      | SelectFieldInterface
    )>(null);
    const focus: FieldFocusFunction = options => {
      if (field.current) field.current.focus(options);
    };
    React.useImperativeHandle(ref, () => ({
      focus,
    }));

    const { parameterIndex } = props;

    const [skinNames, setSkinNames] = React.useState<Array<string>>([]);
    const [isExpressionField, setIsExpressionField] = React.useState<boolean>(
      false
    );

    React.useEffect(() => {
      setSkinNames([]);
    }, []);

    const switchFieldType = () => {
      setIsExpressionField(prev => !prev);
    };
    // $FlowFixMe[missing-local-annot]
    const onChangeSelectValue = (event, value) => {
      props.onChange(event.target.value);
    };

    const onChangeTextValue = (value: string) => {
      props.onChange(value);
    };

    const fieldLabel = props.parameterMetadata
      ? props.parameterMetadata.getDescription()
      : undefined;

    const marginValue = props.isInline ? 'none' : 'dense';

    const selectOptions = skinNames.map(skinName => {
      return (
        <SelectOption
          key={skinName}
          value={`"${skinName}"`}
          label={skinName}
          shouldNotTranslate
        />
      );
    });

    return (
      <TextFieldWithButtonLayout
        margin={marginValue}
        noFloatingLabelText={!fieldLabel}
        renderTextField={() =>
          !isExpressionField ? (
            <SelectField
              ref={field}
              id={
                props.parameterIndex !== undefined
                  ? `parameter-${props.parameterIndex}-skin-name-field`
                  : undefined
              }
              value={props.value}
              onChange={onChangeSelectValue}
              margin={marginValue}
              fullWidth
              floatingLabelText={fieldLabel}
              translatableHintText={t`Choose a skin`}
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
              ref={field}
              id={
                props.parameterIndex !== undefined
                  ? `parameter-${props.parameterIndex}-skin-name-field`
                  : undefined
              }
              expressionType="string"
              {...props}
              onChange={onChangeTextValue}
            />
          )
        }
        renderButton={style =>
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
): React.ComponentType<{
  ...ParameterFieldProps,
  +ref?: React.RefSetter<ParameterFieldInterface>,
}>);
