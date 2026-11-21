import * as React from 'react';
import Button from '@material-ui/core/Button';
import { ButtonSpacer } from './Grid';
import classes from './RaisedButton.module.css';
import classNames from 'classnames';

export interface RaisedButtonPropsWithoutOnClick {
  label?: React.ReactNode;
  primary?: boolean;
  color?: 'primary' | 'success' | 'danger' | 'premium' | 'ai';
  size?: 'small' | 'medium' | 'large';
  disabled?: boolean;
  keyboardFocused?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: React.CSSProperties;
  id?: string | null;
  className?: string;
  target?: '_blank' | string;
  href?: string;
  rel?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

export interface RaisedButtonProps extends RaisedButtonPropsWithoutOnClick {
  onClick?: (event: React.MouseEvent<any> | any) => void | Promise<void>;
}

/**
 * A raised button based on Material-UI button.
 */
const RaisedButton = React.forwardRef<HTMLButtonElement, RaisedButtonProps>(
  (
    {
      label,
      primary,
      color,
      size,
      icon,
      rightIcon,
      disabled,
      keyboardFocused,
      id,
      style,
      className,
      ...otherProps
    }: RaisedButtonProps,
    ref
  ) => {
    // In theory, focus ripple is only shown after a keyboard interaction
    // (see https://github.com/mui-org/material-ui/issues/12067). However, as
    // it's important to get focus right in the whole app, make the ripple
    // always visible to be sure we're getting focusing right.
    const focusRipple = true;

    return (
      <Button
        variant="contained"
        size={size || 'small'}
        disableElevation
        color={primary || color === 'primary' ? 'primary' : 'default'}
        autoFocus={keyboardFocused}
        focusRipple={focusRipple}
        disabled={disabled}
        id={id || undefined}
        className={classNames(className, {
          [classes.buttonSuccess]: color === 'success',
          [classes.buttonDanger]: color === 'danger',
          [classes.buttonPremium]: color === 'premium' && !disabled,
          [classes.buttonAi]: color === 'ai' && !disabled,
        })}
        style={
          style || !label
            ? {
                // If no label is specified, reduce the min width so that the button
                // is just around the icon.
                minWidth: !label ? 0 : undefined,
                ...style,
              }
            : undefined
        }
        {...otherProps}
        ref={ref}
      >
        {icon}
        {!!icon && !!label && <ButtonSpacer />}
        {/* span element is required to prevent browser auto translators to crash the app - See https://github.com/4ian/GDevelop/issues/3453 */}
        {label ? <span>{label}</span> : null}
        {!!rightIcon && !!label && <ButtonSpacer />}
        {rightIcon}
      </Button>
    );
  }
);

export default RaisedButton;
