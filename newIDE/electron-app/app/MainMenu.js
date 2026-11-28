const electron = require('electron');
const { Menu } = electron;

/**
 * @typedef {import('electron').MenuItemConstructorOptions & {
 *   onClickSendEvent?: string,
 *   onClickOpenLink?: string,
 *   eventArgs?: any,
 *   submenu?: DeclarativeMenuItemTemplate[],
 * }} DeclarativeMenuItemTemplate
 */

/**
 * Create the editor main menu. Menu items that requires interaction
 * with the editor and that are not native are sent using events
 * to the electron renderer process (see ElectronEventsBridge).
 *
 * @param {import('electron').BrowserWindow | null} window The window for which the menu is built
 * @param {DeclarativeMenuItemTemplate[]} mainMenuTemplate The template (see ElectronMainMenu.js), where "click" is replaced
 * by declarative properties like onClickSendEvent or onClickOpenLink.
 */
const buildElectronMenuFromDeclarativeTemplate = (window, mainMenuTemplate) => {
  /**
   * @param {DeclarativeMenuItemTemplate[]} menuTemplate
   * @returns {import('electron').MenuItemConstructorOptions[]}
   */
  const adaptMenuDeclarativeItemTemplate = (menuTemplate) =>
    menuTemplate.map((menuItemTemplate) => {
      const hasOnClick =
        menuItemTemplate.onClickSendEvent || menuItemTemplate.onClickOpenLink;
      const args = menuItemTemplate.eventArgs;

      return {
        ...menuItemTemplate,
        click: hasOnClick
          ? function () {
              if (
                menuItemTemplate.onClickSendEvent &&
                window &&
                !window.isDestroyed()
              ) {
                if (args)
                  window.webContents.send(
                    menuItemTemplate.onClickSendEvent,
                    args
                  );
                else window.webContents.send(menuItemTemplate.onClickSendEvent);
              }

              if (menuItemTemplate.onClickOpenLink) {
                electron.shell.openExternal(menuItemTemplate.onClickOpenLink);
              }
            }
          : undefined,
        submenu: menuItemTemplate.submenu
          ? adaptMenuDeclarativeItemTemplate(menuItemTemplate.submenu)
          : undefined,
      };
    });

  return Menu.buildFromTemplate(
    mainMenuTemplate.map((rootMenuTemplate) => ({
      ...rootMenuTemplate,
      submenu: rootMenuTemplate.submenu
        ? adaptMenuDeclarativeItemTemplate(rootMenuTemplate.submenu)
        : undefined,
    }))
  );
};

/**
 * Create a placeholder main menu, displayed before the real main menu
 * is constructed.
 */
const buildPlaceholderMainMenu = () => {
  /** @type {import('electron').MenuItemConstructorOptions} */
  const placeholderMenuItem = {
    label: 'GDevelop is loading...',
    enabled: false,
  };

  /** @type {import('electron').MenuItemConstructorOptions} */
  const fileTemplate = {
    label: 'File',
    submenu: [placeholderMenuItem],
  };

  /** @type {import('electron').MenuItemConstructorOptions} */
  const editTemplate = {
    label: 'Edit',
    submenu: [placeholderMenuItem],
  };

  /** @type {import('electron').MenuItemConstructorOptions} */
  const viewTemplate = {
    label: 'View',
    submenu: [placeholderMenuItem],
  };

  /** @type {import('electron').MenuItemConstructorOptions} */
  const windowTemplate = {
    role: 'window',
    submenu: [{ role: 'minimize' }],
  };

  /** @type {import('electron').MenuItemConstructorOptions} */
  const helpTemplate = {
    role: 'help',
    submenu: [placeholderMenuItem],
  };

  /** @type {import('electron').MenuItemConstructorOptions[]} */
  const template = [
    fileTemplate,
    editTemplate,
    viewTemplate,
    windowTemplate,
    helpTemplate,
  ];

  if (process.platform === 'darwin') {
    template.unshift({
      label: 'GDevelop 5',
      submenu: [placeholderMenuItem],
    });

    windowTemplate.submenu = [
      { role: 'minimize' },
      { role: 'zoom' },
      { type: 'separator' },
      { role: 'front' },
    ];
  }

  return Menu.buildFromTemplate(template);
};

module.exports = {
  buildElectronMenuFromDeclarativeTemplate,
  buildPlaceholderMainMenu,
};
