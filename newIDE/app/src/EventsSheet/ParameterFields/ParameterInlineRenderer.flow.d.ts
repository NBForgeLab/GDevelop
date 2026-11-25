import * as React from 'react';
import type { EventsScope } from '../../InstructionOrExpression/EventsScope';
import { ProjectScopedContainersAccessor } from '../../InstructionOrExpression/EventsScope';

export type InvalidParameterValueProps = {
  children: React.ReactNode;
  isEmpty?: boolean;
};

export type DeprecatedParameterValueProps = {
  children: React.ReactNode;
};

export type ParameterInlineRendererProps = {
  scope: EventsScope;
  projectScopedContainersAccessor: ProjectScopedContainersAccessor;
  parameterMetadata: gdParameterMetadata;
  value: string;
  expression: gdExpression;
  expressionIsValid: boolean;
  hasDeprecationWarning: boolean;
  renderObjectThumbnail: (objectName: string) => React.ReactNode;
  InvalidParameterValue: (props: InvalidParameterValueProps) => React.ReactNode;
  DeprecatedParameterValue: (
    props: DeprecatedParameterValueProps
  ) => React.ReactNode;
  MissingParameterValue: () => React.ReactNode;
  useAssignmentOperators: boolean;
  highlightedSearchText?: string | null;
  highlightedSearchMatchCase?: boolean;
};

export type ParameterInlineRenderer = (
  props: ParameterInlineRendererProps
) => React.ReactNode;
