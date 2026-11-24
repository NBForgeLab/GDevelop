import * as React from 'react';
import MuiBadge from '@material-ui/core/Badge';
import { createStyles, makeStyles } from '@material-ui/core';

type BadgeColor = 'secondary' | 'primary' | 'error' | 'success' | 'neutral';

const useStyles = (color: BadgeColor) =>
  makeStyles((theme) => {
    const baseStyles = {
      root: { flexDirection: 'column' as const },
      anchorOriginTopRightCircle: {
        top: '8%',
        right: '8%',
      },
    };
    return color === 'success' || color === 'neutral'
      ? createStyles({
          ...baseStyles,
          dot: {
            backgroundColor:
              color === 'success'
                ? theme.palette.success.main
                : theme.palette.text.primary,
          },
        })
      : createStyles(baseStyles);
  })();

type Props = {
  children: React.ReactNode;
  invisible?: boolean;
  overlap?: 'circle';
  /**
   * MuiBadge only allows 'secondary' | 'primary' | 'error' | 'default' as color.
   * In order to use 'success' as color, we use undefined for the color, and
   * override the dot style to use the success color.
   * If you need to use another color, you can do the same.
   */
  color?: BadgeColor;
};

const DotBadge = ({
  children,
  invisible,
  overlap,
  color = 'secondary',
}: Props): React.ReactNode => {
  const classes = useStyles(color);
  const colorForBadge =
    color === 'success' || color === 'neutral' ? undefined : color;
  return (
    <MuiBadge
      color={colorForBadge}
      variant="dot"
      classes={classes}
      invisible={invisible}
      overlap={overlap}
      children={children}
    />
  );
};

export default DotBadge;
