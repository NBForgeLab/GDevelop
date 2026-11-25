import type { EventPath } from './EventPath';

export type ValidationErrorType =
  | 'missing-instruction'
  | 'invalid-parameter'
  | 'missing-parameter';

export type ValidationError = {
  type: ValidationErrorType;
  isCondition: boolean;
  instructionType: string;
  instructionSentence: string;
  parameterIndex?: number;
  parameterValue?: string;
  locationName: string;
  locationType: 'scene' | 'external-events' | 'extension';
  eventPath: EventPath;
  extensionName?: string;
  functionName?: string;
  behaviorName?: string | null;
  objectName?: string | null;
};

export type GroupedValidationErrors = {
  missingInstructions: Map<string, Array<ValidationError>>;
  invalidParameters: Map<string, Array<ValidationError>>;
};

export declare const scanProjectForValidationErrors: (
  project: gdProject
) => Array<ValidationError>;

export declare const findEventByPath: (
  eventsList: gdEventsList,
  path: EventPath
) => gdBaseEvent | null | undefined;

export declare const groupValidationErrors: (
  errors: Array<ValidationError>
) => GroupedValidationErrors;
