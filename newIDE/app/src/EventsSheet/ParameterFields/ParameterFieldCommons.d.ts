export type FieldFocusFunction = (
  options?: {
    selectAll?: boolean;
    caretPosition?: 'end' | number | null;
  } | null
) => void;
