import * as React from 'react';
import type { ParameterInlineRendererProps } from './ParameterInlineRenderer.flow';
import type {
  ParameterFieldProps,
  ParameterFieldInterface,
} from './ParameterFieldCommons';

export declare const mapTypeToRelationalOperators: {
  [type: string]: Array<string>;
};

declare const RelationalOperatorField: React.ForwardRefExoticComponent<
  ParameterFieldProps & React.RefAttributes<ParameterFieldInterface>
>;

export default RelationalOperatorField;

export declare const renderInlineRelationalOperator: (
  props: ParameterInlineRendererProps
) => React.ReactNode;
