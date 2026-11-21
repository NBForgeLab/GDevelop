import * as React from 'react';
import MuiChip from '@material-ui/core/Chip';
import { makeStyles, useTheme } from '@material-ui/core/styles';

const useStyles = makeStyles({
  root: {
    cursor: 'default',
  },
  deleteIcon: {
    cursor: 'default', // Hover is enough, no need for a different cursor.
  },
});

export interface ChipProps {
  label?: React.ReactNode;
  color?: 'default' | 'primary' | 'secondary';
  textColor?: 'primary' | 'secondary';
  icon?: React.ReactNode;
  size?: 'small' | 'medium';
  variant?: 'default' | 'outlined';
  avatar?: React.ReactNode;
  style?: React.CSSProperties;
  onClick?: (() => void) | null;
  onBlur?: (() => void) | null;
  onFocus?: (() => void) | null;
  onDelete?: ((event: any) => void) | null;
  disableAutoTranslate?: boolean;
}

export interface ChipInterface {
  focus: () => void;
}

const Chip = React.forwardRef<ChipInterface, ChipProps>((props, ref) => {
  const chipRef = React.useRef<HTMLDivElement | null>(null);
  const muiTheme = useTheme();
  const focus = () => {
    if (chipRef.current && typeof chipRef.current.focus === 'function') {
      chipRef.current.focus();
    }
  };
  React.useImperativeHandle(ref, () => ({
    focus,
  }));

  const textColorStyle = props.textColor
    ? { color: muiTheme.palette.text[props.textColor] }
    : undefined;

  return (
    <MuiChip
      label={props.label}
      icon={props.icon as any}
      size={props.size}
      variant={props.variant}
      avatar={props.avatar as any}
      style={{
        ...props.style,
        ...textColorStyle,
      }}
      onClick={props.onClick ?? undefined}
      onBlur={props.onBlur ?? undefined}
      onFocus={props.onFocus ?? undefined}
      onDelete={props.onDelete ?? undefined}
      classes={useStyles()}
      className={props.disableAutoTranslate ? 'notranslate' : undefined}
      ref={chipRef as any}
      color={props.color}
    />
  );
});

Chip.displayName = 'Chip';

export default Chip;
