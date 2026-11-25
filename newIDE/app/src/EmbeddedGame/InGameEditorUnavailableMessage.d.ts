import * as React from 'react';
import type { InGameEditorUnavailabilityReason } from './InGameEditorAvailability';

export type Props = {
  reason: InGameEditorUnavailabilityReason;
  onSwitchToInstancesEditor: () => void;
  marginBottom?: number;
};

export declare const InGameEditorUnavailableMessage: React.ComponentType<Props>;
