// @flow
import DesktopService from './DesktopService';

export type ScriptEntry = {| script: string, keepTerminalOpen?: boolean |};

/**
 * Runs an npm script in a new terminal window.
 * Only works in Electron (desktop) environment.
 * The script name must be a valid npm script defined in the project's package.json.
 */
export const runNpmScript = (
  projectPath: string,
  entry: ScriptEntry
): boolean => {
  if (!DesktopService.isDesktop()) {
    console.warn('npm scripts are only supported in the desktop app');
    return false;
  }

  DesktopService.runNpmScript({
    projectPath,
    npmScript: entry.script,
    keepTerminalOpen: !!entry.keepTerminalOpen,
  });
  return true;
};
