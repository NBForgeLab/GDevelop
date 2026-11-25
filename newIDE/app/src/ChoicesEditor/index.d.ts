import * as React from 'react';

export type Choice = {
  value: string;
  label: string;
};

export type ChoicesEditorProps = {
  choices: Array<Choice>;
  setChoices: (choices: Array<Choice>) => void;
  disabled?: boolean;
  hideLabels?: boolean;
  isNumber: boolean;
};

declare const ChoicesEditor: React.ComponentType<ChoicesEditorProps>;
export default ChoicesEditor;
