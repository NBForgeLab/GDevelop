import * as React from 'react';
import Button from '@material-ui/core/Button';
import { ButtonSpacer } from './Grid';
import classes from './FlatButton.module.css';
import classNames from 'classnames';

export interface FlatButtonProps {
  label?: React.ReactNode;
  onClick?: (ev: React.MouseEvent<any> | any) => void | Promise<void>;
  primary?: boolean;
  color?: 'primary' | 'success' | 'danger' | 'premium' | 'ai';
  disabled?: boolean;
  keyboardFocused?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: React.CSSProperties;
  noBackground?: boolean;
  size?: 'small' | 'medium' | 'large';
  target?: '_blank' | string;
  href?: string;
  rel?: string;
  id?: string | null;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

/**
 * An "outlined" button based on Material-UI button.
 */
const FlatButton = React.forwardRef<HTMLButtonElement, FlatButtonProps>(
  (
    {
      label,
      primary,
      color,
      leftIcon,
      rightIcon,
      keyboardFocused,
      disabled,
      size,
      id,
      style,
      noBackground,
      fullWidth,
      ...otherProps
    }: FlatButtonProps,
    ref
  ) => {
    // In theory, focus ripple is only shown after a keyboard interaction
    // (see https://github.com/mui-org/material-ui/issues/12067). However, as
    // it's important to get focus right in the whole app, make the ripple
    // always visible to be sure we're getting focusing right.
    const focusRipple = true;

    return (
      <div
        className={classNames({
          [classes.buttonContainer]: true,
          [classes.backgroundButtonContainer]: !noBackground,
          [classes.fullWidthButtonContainer]: !!fullWidth,
          [classes.coloredButtonContainer]: !!color,
          [classes.buttonContainerSuccess]: color === 'success',
          [classes.buttonContainerDanger]: color === 'danger',
          [classes.buttonContainerPremium]: color === 'premium',
          [classes.buttonContainerAi]: color === 'ai',
        })}
        style={style}
      >
        <Button
          variant="outlined"
          size={size || 'small'}
          color={primary || color === 'primary' ? 'secondary' : 'default'}
          autoFocus={keyboardFocused}
          focusRipple={focusRipple}
          disabled={disabled}
          id={id || undefined}
          fullWidth={fullWidth}
          {...otherProps}
          ref={ref}
        >
          {leftIcon}
          {leftIcon && label && <ButtonSpacer />}
          {/* span element is required to prevent browser auto translators to crash the app - See https://github.com/4ian/GDevelop/issues/3453 */}
          {label ? <span>{label}</span> : null}
          {rightIcon && label && <ButtonSpacer />}
          {rightIcon}
        </Button>
      </div>
    );
  }
);

export default FlatButton;
