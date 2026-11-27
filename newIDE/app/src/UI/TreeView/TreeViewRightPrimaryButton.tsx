import * as React from 'react';
import { I18n } from '@lingui/react';
import Button from '@material-ui/core/Button';
import { Spacer } from '../../UI/Grid';
import { type MessageDescriptor } from '../../Utils/i18n/MessageDescriptor';

export type TreeViewRightPrimaryButtonProps = {
  label?: MessageDescriptor | null;
  disabled?: boolean;
  icon?: React.ReactNode;
  id?: string | null;
  onClick:
    | ((
        mouseEvent: React.MouseEvent<HTMLButtonElement>
      ) => void | Promise<void>)
    | null
    | undefined;
};

export const TreeViewRightPrimaryButton = React.forwardRef<
  HTMLButtonElement,
  TreeViewRightPrimaryButtonProps
>(
  (
    { label, icon, disabled, id, onClick }: TreeViewRightPrimaryButtonProps,
    ref
  ) => {
    // In theory, focus ripple is only shown after a keyboard interaction
    // (see https://github.com/mui-org/material-ui/issues/12067). However, as
    // it's important to get focus right in the whole app, make the ripple
    // always visible to be sure we're getting focusing right.
    const focusRipple = true;

    return (
      <I18n>
        {({ i18n }) => (
          <Button
            variant="contained"
            size="small"
            disableElevation
            color="primary"
            focusRipple={focusRipple}
            disabled={disabled}
            id={id || undefined}
            onClick={onClick || undefined}
            style={{
              // If no label is specified, reduce the min width so that the button
              // is just around the icon.
              minWidth: !label ? 0 : undefined,
              padding: label ? '2px 8px 2px 2px' : '2px 2px 2px 2px',
              marginRight: label ? 2 : 0,
              flexShrink: 0,
            }}
            ref={ref}
          >
            {icon}
            {!!icon && !!label && <Spacer />}
            {/* span element is required to prevent browser auto translators to crash the app - See https://github.com/4ian/GDevelop/issues/3453 */}
            {label ? <span>{i18n._(label)}</span> : null}
          </Button>
        )}
      </I18n>
    );
  }
);
