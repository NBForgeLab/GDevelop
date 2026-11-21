import * as React from 'react';
import Button from '@material-ui/core/Button';
import { ButtonSpacer } from './Grid';

export interface TextButtonProps {
  label?: React.ReactNode;
  onClick?: (event: React.MouseEvent<any> | any) => void | Promise<void>;
  primary?: boolean;
  secondary?: boolean;
  allowBrowserAutoTranslate?: boolean;
  disabled?: boolean;
  keyboardFocused?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: React.CSSProperties;
  target?: '_blank' | string;
  href?: string;
  rel?: string;
  id?: string | null;
  className?: string;
  children?: React.ReactNode;
  [key: string]: any;
}

/**
 * A "text" button based on Material-UI button.
 */
const TextButton = React.forwardRef<HTMLButtonElement, TextButtonProps>(
  (
    {
      label,
      primary,
      secondary,
      icon,
      rightIcon,
      keyboardFocused,
      disabled,
      id,
      allowBrowserAutoTranslate = true,
      ...otherProps
    }: TextButtonProps,
    ref
  ) => {
    // In theory, focus ripple is only shown after a keyboard interaction
    // (see https://github.com/mui-org/material-ui/issues/12067). However, as
    // it's important to get focus right in the whole app, make the ripple
    // always visible to be sure we're getting focusing right.
    const focusRipple = true;

    return (
      <Button
        variant="text"
        size="small"
        translate={allowBrowserAutoTranslate ? undefined : 'no'}
        color={primary ? 'primary' : secondary ? 'secondary' : 'default'}
        autoFocus={keyboardFocused}
        focusRipple={focusRipple}
        disabled={disabled}
        id={id || undefined}
        {...otherProps}
        ref={ref}
      >
        {icon}
        {icon && (label || rightIcon) && <ButtonSpacer />}
        {/* span element is required to prevent browser auto translators to crash the app - See https://github.com/4ian/GDevelop/issues/3453 */}
        {label ? <span>{label}</span> : null}
        {rightIcon && label && <ButtonSpacer />}
        {rightIcon}
      </Button>
    );
  }
);

export default TextButton;
