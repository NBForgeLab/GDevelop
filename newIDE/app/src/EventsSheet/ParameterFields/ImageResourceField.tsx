import { Trans } from '@lingui/macro';

import * as React from 'react';
import ResourceSelector, {
  type ResourceSelectorInterface,
} from '../../ResourcesList/ResourceSelector';
import ResourcesLoader from '../../ResourcesLoader';
import {
  type ParameterFieldProps,
  type ParameterFieldInterface,
  type FieldFocusFunction,
} from './ParameterFieldCommons';
import { type ParameterInlineRendererProps } from './ParameterInlineRenderer';
import { highlightSearchText } from '../../Utils/HighlightSearchText';

const ImageResourceField = React.forwardRef<
  ParameterFieldInterface,
  ParameterFieldProps
>((props, ref) => {
  const field = React.useRef<ResourceSelectorInterface | null>(null);
  const focus: FieldFocusFunction = (options) => {
    if (field.current) field.current.focus(options);
  };
  React.useImperativeHandle(ref, () => ({
    focus,
  }));

  if (!props.resourceManagementProps || !props.project) {
    console.error(
      'Missing project or resourceManagementProps for ImageResourceField'
    );
    return null;
  }

  return (
    <ResourceSelector
      margin={props.isInline ? 'none' : 'dense'}
      project={props.project}
      projectScopedContainersAccessor={props.projectScopedContainersAccessor}
      resourceManagementProps={props.resourceManagementProps}
      resourcesLoader={ResourcesLoader}
      resourceKind="image"
      fullWidth
      initialResourceName={props.value}
      onChange={props.onChange}
      floatingLabelText={<Trans>Choose the image file to use</Trans>}
      onRequestClose={props.onRequestClose}
      onApply={props.onApply}
      ref={field}
    />
  );
});

export default ImageResourceField;

export const renderInlineResourceField = ({
  value,
  expressionIsValid,
  hasDeprecationWarning,
  parameterMetadata,
  InvalidParameterValue,
  DeprecatedParameterValue,
  MissingParameterValue,
  highlightedSearchText,
  highlightedSearchMatchCase,
}: ParameterInlineRendererProps): string | React.ReactNode => {
  if (!value && !parameterMetadata.isOptional()) {
    return <MissingParameterValue />;
  }
  if (!expressionIsValid) {
    return (
      <InvalidParameterValue>
        {highlightSearchText(value, highlightedSearchText, {
          matchCase: highlightedSearchMatchCase,
        })}
      </InvalidParameterValue>
    );
  }
  if (hasDeprecationWarning) {
    return (
      <DeprecatedParameterValue>
        {highlightSearchText(value, highlightedSearchText, {
          matchCase: highlightedSearchMatchCase,
        })}
      </DeprecatedParameterValue>
    );
  }
  return highlightSearchText(value, highlightedSearchText, {
    matchCase: highlightedSearchMatchCase,
  });
};
