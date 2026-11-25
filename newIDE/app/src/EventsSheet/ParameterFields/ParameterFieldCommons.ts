import { type ResourceManagementProps } from '../../ResourcesList/ResourceSource';
import { type EventsScope } from '../../InstructionOrExpression/EventsScope';
import { type MessageDescriptor } from '../../Utils/i18n/MessageDescriptor.flow';
import { type ProjectScopedContainersAccessor } from '../../InstructionOrExpression/EventsScope';
import { type ParameterInlineRendererProps } from './ParameterInlineRenderer.flow';
import { type VariableDialogOpeningProps } from '../../VariablesList/VariablesEditorDialog';

import type * as React from 'react';

export type ParameterRenderingServiceType = {
  components: any;
  getParameterComponent: (type: string) => any;
  getUserFriendlyTypeName: (
    rawType: string
  ) => MessageDescriptor | null | undefined;
  renderInlineParameter: (
    props: ParameterInlineRendererProps
  ) => React.ReactNode;
};

type CommonProps = {
  // The parameter
  parameterMetadata?: gdParameterMetadata;
  onChange: (arg0: string) => void;
  value: string;
  // Context
  project: gdProject;
  scope: EventsScope;
  globalObjectsContainer: gdObjectsContainer;
  objectsContainer: gdObjectsContainer;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  isInline?: boolean;
  shouldHideExpressionListButton?: boolean;
  onRequestClose?: () => void;
  onApply?: () => void;
  resourceManagementProps?: ResourceManagementProps;
  // Pass the ParameterRenderingService to allow to render nested parameters
  parameterRenderingService?: ParameterRenderingServiceType;
  // Other
  id?: string;
};

export type ExpressionParameters = {
  getParametersCount: () => number;
  getParameter: (index: number) => string;
};

export type ParameterFieldProps = CommonProps & {
  // Instruction in which the parameter is.
  instruction?: gdInstruction;
  // Metadata of the instruction in which the parameter is.
  instructionMetadata?: gdInstructionMetadata;
  // Expression in which the parameter is.
  expression?: ExpressionParameters;
  // Metadata of the instruction in which the parameter is.
  expressionMetadata?: gdExpressionMetadata;
  // The index of the parameter in the instruction or expression.
  parameterIndex?: number;
  onInstructionTypeChanged?: () => void;
  editEventsFunctionParameter?:
    | ((variableDialogOpeningProps: VariableDialogOpeningProps) => void)
    | null;
  openEventsBasedEntityPropertyEditorDialog?:
    | ((variableDialogOpeningProps: VariableDialogOpeningProps) => void)
    | null;
  expressionTypeExtraInfo?: string;
};

export type FieldFocusFunction = (
  options?: {
    selectAll?: boolean;
    caretPosition?: 'end' | number | null;
  } | null
) => void;

export type ParameterFieldInterface = {
  focus: FieldFocusFunction;
};

/** The parameter long description, followed by the extra helper text, if any. */
export const getParameterHelperMarkdownText = (
  parameterMetadata: gdParameterMetadata | null | undefined,
  extraHelperMarkdownText: string | null | undefined
): string | null | undefined => {
  const parts = [
    parameterMetadata ? parameterMetadata.getLongDescription() : null,
    extraHelperMarkdownText,
  ].filter(Boolean);
  return parts.length > 0 ? parts.join('  \n') : null;
};

export const getParameterValueOrDefault = (
  value: string,
  parameterMetadata: gdParameterMetadata | null | undefined
): string => {
  if (value) return value;

  const defaultValue =
    parameterMetadata && parameterMetadata.isOptional()
      ? parameterMetadata.getDefaultValue()
      : '';
  return defaultValue;
};
