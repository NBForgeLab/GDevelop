import * as React from 'react';

export interface RaisedButtonWithSplitMenuProps {
  label: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  onClick?: (event: React.MouseEvent<any>) => void;
  icon?: React.ReactNode;
  id?: string;
  buildMenuTemplate?: (i18n: any) => any[];
  [key: string]: any;
}

declare const RaisedButtonWithSplitMenu: React.FC<RaisedButtonWithSplitMenuProps>;
export default RaisedButtonWithSplitMenu;
