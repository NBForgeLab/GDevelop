import type {
  GroupWithContext,
  ObjectWithContext,
} from '../../../ObjectsList/EnumerateObjects';
import type { EnumeratedInstructionOrExpressionMetadata } from '../../../InstructionOrExpression/EnumeratedInstructionOrExpressionMetadata';

export declare const getObjectGroupListItemKey: (
  groupWithContext: GroupWithContext
) => string;

export declare const getObjectListItemKey: (
  objectWithContext: ObjectWithContext
) => string;

export declare const getObjectOrObjectGroupListItemValue: (
  objectOrObjectGroupName: string
) => string;

export declare const getInstructionListItemKey: (
  instruction: EnumeratedInstructionOrExpressionMetadata
) => string;

export declare const getInstructionListItemValue: (
  instructionType: string
) => string;

export declare const getInstructionType: (instructionType: string) => string;

export declare const getSubheaderListItemKey: (subheader: string) => string;

export declare const getInstructionOrExpressionIdentifier: (
  instructionOrExpressionMetadata: EnumeratedInstructionOrExpressionMetadata
) => string;
