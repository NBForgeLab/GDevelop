import type { CommandName } from '../CommandPalette/CommandsList';

export type ShortcutMap = { [key in CommandName]: string };

export declare const defaultSecondaryShortcuts: Partial<ShortcutMap>;

declare const defaultShortcuts: ShortcutMap;
export default defaultShortcuts;
