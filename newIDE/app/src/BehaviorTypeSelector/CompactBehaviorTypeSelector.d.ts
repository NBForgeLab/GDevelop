import * as React from 'react';

export declare const styles: {
  icon: {
    fontSize: number;
  };
};

export type Props = {
  project: gdProject;
  objectType: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  eventsFunctionsExtension: gdEventsFunctionsExtension | null;
  onFocus?: () => void;
  onOpenBehaviorTypeDialog: () => void;
};

declare const CompactBehaviorTypeSelector: React.ComponentType<Props>;
export default CompactBehaviorTypeSelector;
