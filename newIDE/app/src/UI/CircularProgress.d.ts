import * as React from 'react';

export interface CircularProgressProps {
  size?: number | string;
  [key: string]: any;
}

declare const CircularProgress: React.FC<CircularProgressProps>;
export default CircularProgress;
