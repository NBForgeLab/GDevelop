import * as React from 'react';

export type Props = {
  project: gdProject;
  eventsFunctionsExtension: gdEventsFunctionsExtension | null;
  label?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  allowedObjectTypes?: Array<string> | null | undefined;
};

declare const CompactObjectTypeSelector: React.ComponentType<Props>;
export default CompactObjectTypeSelector;
