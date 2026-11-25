import { type ExpressionAutocompletion } from '../../ExpressionAutocompletion';

export declare const getLastObjectParameter: (
  parameters: gdParameterMetadataContainer,
  parameterIndex: number
) => gdParameterMetadata | null;

export declare const getLastObjectParameterObjectType: (
  parameters: gdParameterMetadataContainer,
  parameterIndex: number
) => string;

export declare const tryExtractStringLiteralContent: (
  parameterValue: string | null | undefined
) => string | null | undefined;

export declare const getParameterChoiceAutocompletions: (
  parameterMetadata: gdParameterMetadata | null | undefined
) => Array<ExpressionAutocompletion>;

export declare const getParameterChoiceValues: (
  parameterMetadata: gdParameterMetadata | null | undefined
) => Array<string>;

export declare const getSpecializedParameterFieldType: (
  fieldType: string,
  parameterMetadata: gdParameterMetadata | null | undefined
) => string;

export declare const getEasingChoices: (
  parameterMetadata: gdParameterMetadata | null | undefined
) => Array<string>;
