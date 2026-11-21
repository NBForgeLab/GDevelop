import * as React from 'react';

export interface RaisedButtonProps {
  label: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<any>) => void;
  icon?: React.ReactNode;
  id?: string;
  [key: string]: any;
}

declare const RaisedButton: React.FC<RaisedButtonProps>;
export default RaisedButton;
