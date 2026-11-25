import * as React from 'react';

export type UnsavedChanges = {
  hasUnsavedChanges: boolean;
  sealUnsavedChanges: () => void;
  triggerUnsavedChanges: () => void;
  getChangesCount: () => number;
  getTimeOfFirstChangeSinceLastSave: () => number | null;
};

declare const UnsavedChangesContext: React.Context<UnsavedChanges>;

export default UnsavedChangesContext;

export declare const UnsavedChangesContextProvider: React.ComponentType<{
  children?: React.ReactNode;
}>;
