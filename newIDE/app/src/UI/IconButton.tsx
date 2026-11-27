import * as React from 'react';
import MUIIconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { I18n } from '@lingui/react';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor';
import { adaptAcceleratorString } from './AcceleratorString';
import { tooltipEnterDelay } from './Tooltip';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';
import { type GDevelopTheme } from './Theme';
import { makeStyles } from '@material-ui/core/styles';

type IconProps =
  | {
      children?: React.ReactNode;
      className?: string;
    }
  | {
      children?: React.ReactNode;
      className:
        | 'icon-youtube'
        | 'icon-twitter'
        | 'icon-facebook'
        | 'icon-discord'
        | 'icon-reddit'
        | string;
    };

export type IconButtonProps = IconProps & {
  onClick?: (ev: React.MouseEvent<any> | any) => void | Promise<void>;
  target?: string;
  onContextMenu?: (ev: React.MouseEvent<any> | any) => void;
  disabled?: boolean;
  selected?: boolean;
  edge?: 'start' | 'end' | false;
  id?: string;
  className?: string;
  style?: React.CSSProperties;
  size?: 'small' | 'medium';
  tooltip?: MessageDescriptor;
  acceleratorString?: string;
  'aria-label'?: string;
  disableRipple?: boolean;
  disableFocusRipple?: boolean;
  disableHover?: boolean;
  color?: 'default' | 'inherit' | 'primary' | 'secondary';
  [key: string]: any;
};

const useStylesForIconButton = ({
  theme,
  selected,
  disableHover,
}: {
  theme?: GDevelopTheme;
  selected?: boolean;
  disableHover?: boolean;
}) =>
  makeStyles({
    root: {
      color: selected ? theme?.iconButton?.selectedColor : undefined,
      '&:hover': disableHover ? { backgroundColor: 'transparent' } : {},
    },
    label: {
      backgroundColor: selected
        ? theme?.iconButton?.selectedBackgroundColor
        : undefined,
      borderRadius: selected ? 4 : undefined,
    },
  })();

const getTooltipTitle = (
  i18n: any,
  tooltip?: MessageDescriptor,
  acceleratorString?: string
): string => {
  if (!tooltip) return '';
  let text = '';
  if (i18n && typeof i18n._ === 'function') {
    text = i18n._(tooltip);
  } else if (typeof tooltip === 'string') {
    text = tooltip;
  } else if (typeof tooltip === 'object' && tooltip !== null) {
    text = (tooltip as any).default || (tooltip as any).id || '';
  }
  if (acceleratorString) {
    text += ' (' + adaptAcceleratorString(acceleratorString) + ')';
  }
  return text;
};

/**
 * A button showing just an icon, based on Material-UI icon button.
 * Supports displaying a tooltip.
 */
const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  (props: IconButtonProps, ref) => {
    const {
      selected,
      tooltip,
      acceleratorString,
      color,
      style,
      disableHover,
      ...otherProps
    } = props;

    const gdevelopTheme = React.useContext(GDevelopThemeContext);
    const classes = useStylesForIconButton({
      theme: gdevelopTheme,
      selected,
      disableHover,
    });

    const iconButton = (
      <MUIIconButton
        {...otherProps}
        classes={classes}
        style={style}
        color={selected ? 'inherit' : color || 'secondary'}
        ref={ref}
      />
    );

    return tooltip && !props.disabled ? (
      <I18n>
        {({ i18n }) => (
          <Tooltip
            title={getTooltipTitle(i18n, tooltip, acceleratorString)}
            placement="bottom"
            enterDelay={tooltipEnterDelay}
          >
            {iconButton}
          </Tooltip>
        )}
      </I18n>
    ) : (
      iconButton
    );
  }
);

export default IconButton;
