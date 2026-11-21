import * as React from 'react';
import MuiCircularProgress from '@material-ui/core/CircularProgress';

export interface CircularProgressProps {
  variant?: 'indeterminate' | 'determinate';
  value?: number | null;
  size?: number;
  disableShrink?: boolean;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
  [key: string]: any;
}

const CircularProgress = React.forwardRef<
  HTMLDivElement,
  CircularProgressProps
>(
  (
    {
      variant,
      value,
      size,
      disableShrink,
      style,
      ...otherProps
    }: CircularProgressProps,
    ref
  ) => {
    return (
      <MuiCircularProgress
        color="secondary"
        style={style}
        size={size}
        disableShrink={disableShrink}
        variant={variant === 'determinate' ? 'static' : variant}
        value={value ?? undefined}
        ref={ref}
        {...otherProps}
      />
    );
  }
);

export default CircularProgress;
