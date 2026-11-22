export type MenuItemTemplate =
  | {
      id?: string;
      label: string;
      visible?: boolean;
      enabled?: boolean;
      disabled?: boolean;
      click?: (() => void | Promise<void>) | null;
      accelerator?: string;
    }
  | {
      id?: string;
      label: string;
      submenu: Array<MenuItemTemplate>;
    }
  | {
      id?: string;
      type: 'checkbox';
      label: string;
      visible?: boolean;
      enabled?: boolean;
      checked: boolean;
      click?: (() => void | Promise<void>) | null;
    }
  | {
      type: 'separator';
    };
