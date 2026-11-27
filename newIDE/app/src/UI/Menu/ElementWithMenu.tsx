import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import ReactDOM from 'react-dom';
import ContextMenu, { type ContextMenuInterface } from './ContextMenu';
import { type MenuItemTemplate } from './Menu';

type Props = {
  element: React.ReactElement<any>;
  buildMenuTemplate: (i18n: I18nType) => Array<MenuItemTemplate>;
  openMenuWithSecondaryClick?: boolean;
  passExtraProps?: boolean;
  [key: string]: any;
};

/**
 * Wrap an element and display a menu when `onClick` prop is called on the element.
 */

export default class ElementWithMenu extends React.Component<Props> {
  _contextMenu: ContextMenuInterface | null | undefined;
  _wrappedElement: any | null | undefined;

  open = (event?: React.SyntheticEvent<any> | Event) => {
    // Prevent the default behavior, notably the browser context menu
    // on the web version, which is otherwise not prevented because
    // `stopPropagation` stops the event before it reaches the global
    // `contextmenu` handler set up by `Window.setUpContextMenu`.
    if (event && event.preventDefault) event.preventDefault();
    if (event && event.stopPropagation) event.stopPropagation();
    const { _contextMenu } = this;
    if (!_contextMenu) return;

    const node = ReactDOM.findDOMNode(this._wrappedElement);
    // Use nodeType check instead of `instanceof HTMLElement` because
    // in a cross-window portal the node's constructor comes from the
    // child window, not the main window.
    if (node && node.nodeType === 1) {
      const dimensions = (node as Element).getBoundingClientRect();

      _contextMenu.open(
        Math.round(dimensions.left + dimensions.width / 2),
        Math.round(dimensions.top + dimensions.height)
      );
    }
  };

  render(): React.ReactNode {
    const {
      element,
      buildMenuTemplate,
      openMenuWithSecondaryClick,
      passExtraProps,
      ...otherProps
    } = this.props;

    return (
      <React.Fragment>
        {React.cloneElement(element, {
          onContextMenu: this.open,
          // Flow complaining about using too much spread operators
          ...(openMenuWithSecondaryClick ? {} : { onClick: this.open }),
          ref: (wrappedElement: any) => (this._wrappedElement = wrappedElement),
          ...(passExtraProps ? otherProps : {}),
        })}
        <ContextMenu
          ref={(contextMenu: ContextMenuInterface | null) =>
            (this._contextMenu = contextMenu)
          }
          buildMenuTemplate={buildMenuTemplate}
        />
      </React.Fragment>
    );
  }
}
