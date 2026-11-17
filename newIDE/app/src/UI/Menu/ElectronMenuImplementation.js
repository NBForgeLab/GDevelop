// @flow
import DesktopService from '../../Utils/DesktopService';
import {
  type MenuItemTemplate,
  type ContextMenuImplementation,
} from './Menu.flow';

/**
 * Wraps an Electron Menu
 */
export default class ElectronMenuImplementation
  implements ContextMenuImplementation {
  menuTemplate: Array<MenuItemTemplate>;
  targetId: ?string;

  constructor(options?: {| targetId?: ?string |}) {
    this.targetId = options ? options.targetId : null;
  }

  buildFromTemplate(template: Array<MenuItemTemplate>): any {
    this.menuTemplate = template;
    return undefined;
  }

  showMenu(dimensions: {|
    left: number,
    top: number,
    width: number,
    height: number,
  |}) {
    if (!DesktopService.isDesktop()) return;

    Promise.resolve(
      DesktopService.popupMenu(this.menuTemplate, dimensions, this.targetId)
    ).catch(error => {
      console.warn('[ElectronMenuImplementation] popupMenu failed:', error);
    });
  }

  getMenuProps(): any {
    return {
      open: false,
    };
  }
}
