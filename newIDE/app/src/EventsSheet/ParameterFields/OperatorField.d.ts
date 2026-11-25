import * as React from 'react';
import type { ParameterInlineRendererProps } from './ParameterInlineRenderer.flow';
import type {
  ParameterFieldProps,
  ParameterFieldInterface,
} from './ParameterFieldCommons';

export declare const mapTypeToOperators: { [type: string]: Array<string> };

declare const OperatorField: React.ForwardRefExoticComponent<
  ParameterFieldProps & React.RefAttributes<ParameterFieldInterface>
>;

export default OperatorField;

export declare const renderInlineOperator: (
  props: ParameterInlineRendererProps
) => React.ReactNode;
