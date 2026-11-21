import {
  getUserAgent,
  getArch,
  getSystemVersion,
  getPlatformName,
  isWindows,
  isMacLike,
  isMobile,
  isNativeMobileApp,
  isNativeIos,
  isNativeAndroid,
} from './Platform';

describe('Platform', () => {
  test('returns platform booleans as expected in node/test environment', () => {
    expect(typeof isWindows()).toBe('boolean');
    expect(typeof isMacLike()).toBe('boolean');
    expect(typeof isMobile()).toBe('boolean');
    expect(isNativeMobileApp()).toBe(false);
    expect(isNativeIos()).toBe(false);
    expect(isNativeAndroid()).toBe(false);
  });

  test('returns string descriptors', () => {
    expect(typeof getUserAgent()).toBe('string');
    expect(typeof getArch()).toBe('string');
    expect(typeof getSystemVersion()).toBe('string');
    expect(typeof getPlatformName()).toBe('string');
  });
});
