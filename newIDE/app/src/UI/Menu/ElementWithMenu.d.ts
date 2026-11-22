import * as React from 'react';
import { MenuItemTemplate } from './Menu.flow';
import { I18n as I18nType } from '@lingui/core';

export interface ElementWithMenuProps {
  element: React.ReactElement<any>;
  buildMenuTemplate: (i18n: I18nType) => MenuItemTemplate[];
  openMenuWithSecondaryClick?: boolean;
  passExtraProps?: boolean;
  [key: string]: any;
}

export default class ElementWithMenu extends React.Component<ElementWithMenuProps> {
  open: (event?: any) => void;
}
