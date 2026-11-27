import { Trans } from '@lingui/macro';
import { t } from '@lingui/macro';
import * as React from 'react';
import { type ParameterInlineRendererProps } from './ParameterInlineRenderer';
import {
  type ParameterFieldProps,
  type ParameterFieldInterface,
  type FieldFocusFunction,
} from './ParameterFieldCommons';
import SelectField, { type SelectFieldInterface } from '../../UI/SelectField';
import SelectOption from '../../UI/SelectOption';
import { type MessageDescriptor } from '../../Utils/i18n/MessageDescriptor';

const operatorLabels: { [key: string]: MessageDescriptor } = {
  '=': t`= (equal to)`,
  '<': t`< (less than)`,
  '>': t`> (greater than)`,
  '<=': t`≤ (less or equal to)`,
  '>=': t`≥ (greater or equal to)`,
  '!=': t`≠ (not equal to)`,
  startsWith: t`starts with`,
  endsWith: t`ends with`,
  contains: t`contains`,
};

export const mapTypeToRelationalOperators: {
  [key: string]: Array<string>;
} = {
  unknown: Object.keys(operatorLabels),
  number: ['=', '<', '>', '<=', '>=', '!='],
  time: ['<', '>', '<=', '>='],
  string: ['=', '!=', 'startsWith', 'endsWith', 'contains'],
  color: ['=', '!='],
};

export default React.forwardRef<ParameterFieldInterface, ParameterFieldProps>(
  function RelationalOperatorField(props: ParameterFieldProps, ref) {
    const field = React.useRef<SelectFieldInterface | null>(null);
    const focus: FieldFocusFunction = (options) => {
      if (field.current) field.current.focus(options);
    };
    React.useImperativeHandle(ref, () => ({
      focus,
    }));

    const { parameterMetadata, value, onChange } = props;
    const description = parameterMetadata
      ? parameterMetadata.getDescription()
      : undefined;

    const comparedValueType = parameterMetadata
      ? parameterMetadata.getExtraInfo()
      : 'unknown';
    const operators =
      mapTypeToRelationalOperators[comparedValueType] ||
      mapTypeToRelationalOperators.unknown;

    React.useEffect(() => {
      if (!value) {
        onChange(operators[0]);
      }
    }, [value, onChange, operators]);

    return (
      <SelectField
        margin={props.isInline ? 'none' : 'dense'}
        fullWidth
        floatingLabelText={description}
        helperMarkdownText={
          parameterMetadata ? parameterMetadata.getLongDescription() : undefined
        }
        value={value}
        onChange={(e, i, value: string) => onChange(value)}
        ref={field}
        translatableHintText={t`Choose an operator`}
      >
        {operators.map((operator) => (
          <SelectOption
            key={operator}
            value={operator}
            label={operatorLabels[operator]}
          />
        ))}
      </SelectField>
    );
  }
);

export const renderInlineRelationalOperator = ({
  value,
  InvalidParameterValue,
  parameterMetadata,
}: ParameterInlineRendererProps):
  | '<'
  | '='
  | '>'
  | string
  | React.ReactElement<any>
  | React.ReactNode => {
  const comparedValueType = parameterMetadata
    ? parameterMetadata.getExtraInfo()
    : 'unknown';
  const operators =
    mapTypeToRelationalOperators[comparedValueType] ||
    mapTypeToRelationalOperators.unknown;

  if (!operators.includes(value)) {
    return (
      <InvalidParameterValue isEmpty>
        <Trans>Choose an operator</Trans>
      </InvalidParameterValue>
    );
  }

  if (
    value !== '=' &&
    value !== '<' &&
    value !== '>' &&
    value !== '<=' &&
    value !== '>=' &&
    value !== '!=' &&
    value !== 'startsWith' &&
    value !== 'endsWith' &&
    value !== 'contains'
  ) {
    return <InvalidParameterValue>{value}</InvalidParameterValue>;
  }

  if (value === '<=') return '\u2264';
  if (value === '>=') return '\u2265';
  if (value === '!=') return '\u2260';
  if (value === 'startsWith') return <Trans>starts with</Trans>;
  if (value === 'endsWith') return <Trans>ends with</Trans>;
  if (value === 'contains') return <Trans>contains</Trans>;

  return value;
};
