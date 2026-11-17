// @flow
import DesktopService from './DesktopService';

let _isWindows = false;
if (DesktopService.isDesktop()) {
  _isWindows = DesktopService.getPlatform() === 'win32';
}
const _isMacLike =
  typeof navigator !== 'undefined' &&
  navigator.platform.match(/(Mac|iPhone|iPod|iPad)/i)
    ? true
    : false;

const _isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
  typeof navigator !== 'undefined' ? navigator.userAgent : ''
);

export const getUserAgent = (): string => {
  return typeof navigator !== 'undefined'
    ? navigator.userAgent || 'Unknown navigator'
    : 'Unknown (not a navigator)';
};

export const getArch = (): string => {
  return DesktopService.isDesktop()
    ? DesktopService.getArch()
    : 'Unknown architecture (web-app)';
};

export const getSystemVersion = (): string => {
  return DesktopService.isDesktop()
    ? DesktopService.getSystemVersion()
    : 'Unknown system version (web-app)';
};

export const getPlatformName = (): string => {
  return DesktopService.isDesktop()
    ? DesktopService.getPlatform() || 'Unknown platform'
    : (typeof navigator !== 'undefined' ? navigator.platform : '') ||
        'Unknown platform (web-app)';
};

export const isWindows = (): boolean => _isWindows;
export const isMacLike = (): boolean => _isMacLike;
export const isMobile = (): boolean => _isMobile;
export const isNativeMobileApp = (): boolean => false;
export const isNativeIos = (): boolean => false;
export const isNativeAndroid = (): boolean => false;
