// @flow
import DesktopService from './DesktopService';

export type InstallCliInPathResult = {|
  status: 'success' | 'error',
  message: string,
|};

export const isCliInPathInstallSupported = (): boolean =>
  DesktopService.isDesktop();

export const installCliInPath = async (): Promise<InstallCliInPathResult> => {
  if (!DesktopService.isDesktop()) {
    return {
      status: 'error',
      message:
        'Installing the CLI in PATH is only available on the desktop app.',
    };
  }
  return ((DesktopService.cli.installInPath(): any): Promise<InstallCliInPathResult>);
};
