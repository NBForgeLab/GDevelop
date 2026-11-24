import * as React from 'react';

export declare const LARGE_WIDGET_SIZE: number;
export declare const SMALL_WIDGET_SIZE: number;
export declare const CardWidget: React.ComponentType<{
  children: React.ReactNode;
  onClick?: () => void;
  size: 'small' | 'large' | 'banner';
  disabled?: boolean;
  useDefaultDisabledStyle?: boolean;
  noBorder?: boolean;
}>;
