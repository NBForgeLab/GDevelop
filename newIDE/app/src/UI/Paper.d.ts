import * as React from 'react';

export interface PaperProps {
  id?: string;
  children: React.ReactNode;
  elevation?: number;
  variant?: 'outlined';
  background: 'light' | 'medium' | 'dark';
  style?: React.CSSProperties;
  square?: boolean;
}

declare const Paper: React.ForwardRefExoticComponent<
  PaperProps & React.RefAttributes<HTMLDivElement>
>;
export default Paper;
