import * as React from 'react';
import MuiLinearProgress from '@material-ui/core/LinearProgress';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';
import type { GDevelopTheme } from './Theme';
import { makeStyles } from '@material-ui/core/styles';

const useStyles = (
  color?: 'success',
  barColor?: string,
  trackColor?: string,
  gdevelopTheme?: GDevelopTheme
) =>
  makeStyles({
    // Display the current value immediately: the default transition animates
    // from the previous value, which looks like the bar goes backward.
    bar1Determinate: {
      transition: 'none',
    },
    colorSecondary: {
      backgroundColor:
        trackColor || gdevelopTheme?.paper?.backgroundColor?.light,
    },
    barColorSecondary: {
      backgroundColor:
        barColor ||
        (color === 'success'
          ? gdevelopTheme?.statusIndicator?.success
          : gdevelopTheme?.palette?.secondary),
    },
  })();

export interface LinearProgressProps {
  variant?: 'indeterminate' | 'determinate';
  color?: 'success';
  barColor?: string;
  trackColor?: string;
  value?: number | null;
  style?: React.CSSProperties;
  className?: string;
  id?: string;
  [key: string]: any;
}

const LinearProgress = React.forwardRef<HTMLDivElement, LinearProgressProps>(
  (
    {
      variant,
      color,
      barColor,
      trackColor,
      value,
      style,
      ...otherProps
    }: LinearProgressProps,
    ref
  ) => {
    const gdevelopTheme = React.useContext(GDevelopThemeContext);
    const classes = useStyles(color, barColor, trackColor, gdevelopTheme);

    return (
      <MuiLinearProgress
        classes={classes}
        color="secondary"
        style={{ flex: 1, ...style }}
        variant={variant}
        value={value ?? undefined}
        ref={ref}
        {...otherProps}
      />
    );
  }
);

export default LinearProgress;
