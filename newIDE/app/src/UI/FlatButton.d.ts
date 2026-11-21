import * as React from 'react';

export interface FlatButtonProps {
  label: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<any>) => void;
  leftIcon?: React.ReactNode;
  id?: string;
  [key: string]: any;
}

declare const FlatButton: React.FC<FlatButtonProps>;
export default FlatButton;
