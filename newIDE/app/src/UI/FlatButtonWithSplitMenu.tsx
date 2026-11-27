import * as React from 'react';
import ElementWithMenu from './Menu/ElementWithMenu';
import { MenuItemTemplate } from './Menu/Menu';
import { I18n as I18nType } from '@lingui/core';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import { ButtonSpacer } from './Grid';
import ChevronArrowBottom from './CustomSvgIcons/ChevronArrowBottom';

export interface FlatButtonWithSplitMenuProps {
  id?: string;
  splitMenuButtonId?: string;
  label?: React.ReactNode;
  primary?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  onClick?: (event?: React.MouseEvent<any> | any) => void | Promise<void>;
  buildMenuTemplate: (i18n: I18nType) => MenuItemTemplate[];
  style?: React.CSSProperties;
  fullWidth?: boolean;
  [key: string]: any;
}

const shouldNeverBeCalled = () => {
  throw new Error(
    'This FlatButtonWithSplitMenu onClick should never be called'
  );
};

const styles = {
  mainButton: { flex: 1 },
  arrowDropDownButton: {
    // Reduce the size forced by Material UI to avoid making the arrow
    // too big.
    minWidth: 30,
    maxWidth: 30,
    paddingLeft: 0,
    paddingRight: 0,
  },
};

/**
 * A flat button based on Material-UI button, that has a menu displayed
 * when the dropdown arrow is clicked.
 */
const FlatButtonWithSplitMenu: React.FC<FlatButtonWithSplitMenuProps> = ({
  id,
  splitMenuButtonId,
  buildMenuTemplate,
  onClick,
  label,
  primary,
  icon,
  disabled,
  fullWidth,
  style,
}: FlatButtonWithSplitMenuProps) => {
  // In theory, focus ripple is only shown after a keyboard interaction
  // (see https://github.com/mui-org/material-ui/issues/12067). However, as
  // it's important to get focus right in the whole app, make the ripple
  // always visible to be sure we're getting focusing right.
  const focusRipple = true;

  return (
    <ButtonGroup
      variant={'outlined'}
      disableElevation
      color={primary ? 'secondary' : 'default'}
      disabled={disabled}
      size="small"
      style={style}
      fullWidth={fullWidth}
    >
      <Button
        id={id || undefined}
        focusRipple={focusRipple}
        onClick={onClick}
        style={styles.mainButton}
      >
        {icon}
        {!!icon && !!label && <ButtonSpacer />}
        {label}
      </Button>
      <ElementWithMenu
        passExtraProps={
          true /* ButtonGroup is passing props to Button: disabled, color, variant, size */
        }
        element={
          <Button
            id={splitMenuButtonId || undefined}
            onClick={shouldNeverBeCalled}
            focusRipple={focusRipple}
            style={styles.arrowDropDownButton}
          >
            <ChevronArrowBottom />
          </Button>
        }
        buildMenuTemplate={buildMenuTemplate}
      />
    </ButtonGroup>
  );
};

export default FlatButtonWithSplitMenu;
