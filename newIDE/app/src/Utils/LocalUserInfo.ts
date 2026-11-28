import optionalRequire from './OptionalRequire';
const os = optionalRequire('os');

export const getUID = (): number | string => {
  try {
    return os.userInfo().uid;
  } catch {
    return '';
  }
};
