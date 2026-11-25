import * as React from 'react';

export type ObjectEditorTab =
  | 'properties'
  | 'behaviors'
  | 'variables'
  | 'effects';

declare const ObjectEditorWithErrorBoundary: React.ComponentType<any>;

export default ObjectEditorWithErrorBoundary;
