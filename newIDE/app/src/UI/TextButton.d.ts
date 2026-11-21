import * as React from 'react';

export interface TextButtonProps {
  label?: React.ReactNode;
  onClick?: (ev: any) => void | Promise<void>;
  icon?: React.ReactNode;
  target?: string;
  disabled?: boolean;
  primary?: boolean;
  secondary?: boolean;
  [key: string]: any;
}

declare const TextButton: React.FC<TextButtonProps>;
export default TextButton;
