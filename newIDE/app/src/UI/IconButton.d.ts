import * as React from 'react';

export interface IconButtonProps {
  children?: React.ReactNode;
  className?: string;
  onClick?: (ev: any) => void | Promise<void>;
  target?: string;
  onContextMenu?: () => void;
  disabled?: boolean;
  selected?: boolean;
  edge?: 'start' | 'end' | false;
  id?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'medium';
  color?: 'default' | 'inherit' | 'primary' | 'secondary';
  tooltip?: any;
  [key: string]: any;
}

declare const IconButton: React.ForwardRefExoticComponent<
  IconButtonProps & React.RefAttributes<HTMLButtonElement>
>;
export default IconButton;
