import * as React from 'react';
import RaisedButton, { RaisedButtonPropsWithoutOnClick } from './RaisedButton';
import ElementWithMenu from './Menu/ElementWithMenu';
import { MenuItemTemplate } from './Menu/Menu';
import { I18n as I18nType } from '@lingui/core';

export interface RaisedButtonWithMenuProps extends RaisedButtonPropsWithoutOnClick {
  buildMenuTemplate: (i18n: I18nType) => MenuItemTemplate[];
}

const shouldNeverBeCalled = () => {
  throw new Error('This RaisedButtonWithMenu onClick should never be called');
};

/**
 * A raised button based on Material-UI button, that has a menu displayed when clicked.
 */
const RaisedButtonWithMenu: React.FC<RaisedButtonWithMenuProps> = ({
  buildMenuTemplate,
  ...otherProps
}: RaisedButtonWithMenuProps) => {
  return (
    <ElementWithMenu
      element={<RaisedButton {...otherProps} onClick={shouldNeverBeCalled} />}
      buildMenuTemplate={buildMenuTemplate}
    />
  );
};

export default RaisedButtonWithMenu;
