import * as React from 'react';
import MuiBadge from '@material-ui/core/Badge';
import { makeStyles } from '@material-ui/core/styles';

export interface BadgeProps {
  children: React.ReactNode;
  badgeContent?: React.ReactNode;
  color?: 'error' | 'primary' | 'secondary' | 'default';
  variant?: 'dot' | 'standard';
  forcedColor?: string;
  invisible?: boolean;
  overlap?: 'circle' | 'rectangle';
}

const emptyStyles = () => ({});

const Badge: React.FC<BadgeProps> = ({
  forcedColor,
  ...otherProps
}: BadgeProps) => {
  const stylesForBadge = React.useMemo(
    () =>
      forcedColor
        ? makeStyles({
            badge: { backgroundColor: forcedColor },
          })
        : emptyStyles,
    [forcedColor]
  );
  const classes = stylesForBadge();
  return <MuiBadge {...otherProps} classes={classes} />;
};

export default Badge;
