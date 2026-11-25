import { type EnumeratedInstructionOrExpressionMetadata } from '../../../InstructionOrExpression/EnumeratedInstructionOrExpressionMetadata';

export declare const getVisibleParameterTypes: (
  expressionMetadata: EnumeratedInstructionOrExpressionMetadata
) => Array<string>;

export declare const formatExpressionCall: (
  expressionInfo: EnumeratedInstructionOrExpressionMetadata,
  parameterValues: Array<string>,
  options: { shouldConvertToString: boolean }
) => string;
