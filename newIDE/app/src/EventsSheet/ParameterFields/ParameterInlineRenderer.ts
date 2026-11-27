import * as React from 'react';
import { type EventsScope } from '../../InstructionOrExpression/EventsScope';
import { ProjectScopedContainersAccessor } from '../../InstructionOrExpression/EventsScope';

export type InvalidParameterValueProps = {
  children: React.ReactNode;
  isEmpty?: boolean;
};

export type DeprecatedParameterValueProps = {
  children: React.ReactNode;
};

/**
 * The props expected by a function that renders a parameter in the events sheet
 */
export type ParameterInlineRendererProps = {
  scope: EventsScope;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  parameterMetadata: gdParameterMetadata;
  value: string;
  expression: gdExpression;
  expressionIsValid: boolean;
  hasDeprecationWarning: boolean;
  renderObjectThumbnail: (arg0: string) => React.ReactNode;
  InvalidParameterValue: (
    invalidParameterValueProps: InvalidParameterValueProps
  ) => React.ReactNode;
  DeprecatedParameterValue: (
    deprecatedParameterValueProps: DeprecatedParameterValueProps
  ) => React.ReactNode;
  MissingParameterValue: () => React.ReactNode;
  useAssignmentOperators: boolean;
  highlightedSearchText?: string | null;
  highlightedSearchMatchCase?: boolean;
};

/**
 * The type of a function that renders a parameter in the events sheet
 */
export type ParameterInlineRenderer = (
  parameterInlineRendererProps: ParameterInlineRendererProps
) => React.ReactNode;
