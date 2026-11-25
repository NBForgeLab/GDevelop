import { type EventsScope } from './EventsScope';

export type InstructionOrExpressionScope = {
  extension: {
    name: string;
  };
  objectMetadata?: {
    name: string;
    isPrivate: boolean;
  } | null;
  behaviorMetadata?: {
    name: string;
    isPrivate: boolean;
  } | null;
};

export type EnumeratedInstructionMetadata = {
  type: string;
  displayedName: string;
  description: string;
  fullGroupName: string;
  iconFilename: string;
  scope: InstructionOrExpressionScope;
  isPrivate: boolean;
  isRelevantForLayoutEvents: boolean;
  isRelevantForFunctionEvents: boolean;
  isRelevantForAsynchronousFunctionEvents: boolean;
  isRelevantForCustomObjectEvents: boolean;
  metadata: gdInstructionMetadata;
};

export type EnumeratedExpressionMetadata = {
  type: string;
  displayedName: string;
  description: string;
  fullGroupName: string;
  iconFilename: string;
  metadata: gdExpressionMetadata;
  scope: InstructionOrExpressionScope;
  isPrivate: boolean;
  isRelevantForLayoutEvents: boolean;
  isRelevantForFunctionEvents: boolean;
  isRelevantForAsynchronousFunctionEvents: boolean;
  isRelevantForCustomObjectEvents: boolean;
  name: string;
  parameters: Array<gdParameterMetadata>;
};

export type EnumeratedInstructionOrExpressionMetadata =
  | EnumeratedInstructionMetadata
  | EnumeratedExpressionMetadata;

export declare const filterEnumeratedInstructionOrExpressionMetadataByScope: <
  T extends EnumeratedInstructionOrExpressionMetadata,
>(
  list: Array<T>,
  scope: EventsScope
) => Array<T>;

export type FunctionAuthoringScope = {
  extensionName: string;
  customBehaviorName?: string | null;
  customObjectName?: string | null;
};

export type FunctionDeclarationScope = {
  extensionName: string;
  isPrivate: boolean;
  behaviorMetadata: { name: string; isPrivate: boolean } | null | undefined;
  objectMetadata: { name: string; isPrivate: boolean } | null | undefined;
};

export declare const isFunctionCallableInAuthoringScope: (
  declarationScope: FunctionDeclarationScope,
  authoringScope: FunctionAuthoringScope | null | undefined
) => boolean;

export declare const getFunctionAuthoringScope: (
  scope: EventsScope
) => FunctionAuthoringScope | null;
