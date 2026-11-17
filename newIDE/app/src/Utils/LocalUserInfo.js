// @flow
import DesktopService from './DesktopService';

export const getUID = (): any | string => {
  try {
    const userInfo = DesktopService.getUserInfo();
    return userInfo ? userInfo.uid : '';
  } catch (e) {
    return '';
  }
};
