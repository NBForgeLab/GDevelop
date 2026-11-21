import * as React from 'react';

export interface HelpButtonProps {
  label?: React.ReactNode;
  helpPagePath?: string;
  anchor?: string;
  [key: string]: any;
}

declare const HelpButton: React.FC<HelpButtonProps>;
export default HelpButton;
