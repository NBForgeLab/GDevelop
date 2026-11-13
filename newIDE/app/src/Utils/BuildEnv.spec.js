// @flow
import { getPublicUrl, isReactAppEnvDevelopment } from './BuildEnv';

const originalProcess = global.process;
const originalEnv = originalProcess ? originalProcess.env : undefined;
const hasOriginalPublicUrl =
  !!originalEnv && Object.keys(originalEnv).includes('PUBLIC_URL');
const originalPublicUrl = originalEnv ? originalEnv.PUBLIC_URL : undefined;
const hasOriginalReactAppEnv =
  !!originalEnv && Object.keys(originalEnv).includes('REACT_APP_ENV');
const originalReactAppEnv = originalEnv ? originalEnv.REACT_APP_ENV : undefined;

const restoreProcess = () => {
  Object.defineProperty(global, 'process', {
    value: originalProcess,
    configurable: true,
    writable: true,
  });
  if (originalProcess) {
    originalProcess.env = originalEnv;
  }
  if (originalEnv) {
    if (hasOriginalPublicUrl) {
      originalEnv.PUBLIC_URL = originalPublicUrl;
    } else {
      delete originalEnv.PUBLIC_URL;
    }
    if (hasOriginalReactAppEnv) {
      originalEnv.REACT_APP_ENV = originalReactAppEnv;
    } else {
      delete originalEnv.REACT_APP_ENV;
    }
  }
};

const withGlobalProcess = (mockProcess: any, fn: () => void) => {
  try {
    Object.defineProperty(global, 'process', {
      value: mockProcess,
      configurable: true,
      writable: true,
    });
    fn();
  } finally {
    restoreProcess();
  }
};

const withoutGlobalProcess = (fn: () => void) => {
  try {
    delete global.process;
    fn();
  } finally {
    restoreProcess();
  }
};

describe('BuildEnv', () => {
  afterEach(() => {
    restoreProcess();
  });

  describe('getPublicUrl', () => {
    test('returns PUBLIC_URL when configured on process.env', () => {
      global.process.env.PUBLIC_URL = '/gdevelop-app';
      expect(getPublicUrl()).toBe('/gdevelop-app');
    });

    test('returns empty string when PUBLIC_URL is empty or unset', () => {
      global.process.env.PUBLIC_URL = '';
      expect(getPublicUrl()).toBe('');

      delete global.process.env.PUBLIC_URL;
      expect(getPublicUrl()).toBe('');
    });

    test('returns empty string when process or process.env is unavailable', () => {
      withGlobalProcess({}, () => {
        expect(getPublicUrl()).toBe('');
      });

      withGlobalProcess({ env: null }, () => {
        expect(getPublicUrl()).toBe('');
      });

      withGlobalProcess(undefined, () => {
        expect(getPublicUrl()).toBe('');
      });

      withGlobalProcess(null, () => {
        expect(getPublicUrl()).toBe('');
      });

      withoutGlobalProcess(() => {
        expect(getPublicUrl()).toBe('');
      });
    });
  });

  describe('isReactAppEnvDevelopment', () => {
    test('returns true only when REACT_APP_ENV is development', () => {
      global.process.env.REACT_APP_ENV = 'development';
      expect(isReactAppEnvDevelopment()).toBe(true);

      global.process.env.REACT_APP_ENV = 'production';
      expect(isReactAppEnvDevelopment()).toBe(false);

      global.process.env.REACT_APP_ENV = '';
      expect(isReactAppEnvDevelopment()).toBe(false);

      delete global.process.env.REACT_APP_ENV;
      expect(isReactAppEnvDevelopment()).toBe(false);
    });

    test('returns false when process or process.env is unavailable', () => {
      withGlobalProcess({}, () => {
        expect(isReactAppEnvDevelopment()).toBe(false);
      });

      withGlobalProcess({ env: null }, () => {
        expect(isReactAppEnvDevelopment()).toBe(false);
      });

      withGlobalProcess(undefined, () => {
        expect(isReactAppEnvDevelopment()).toBe(false);
      });

      withGlobalProcess(null, () => {
        expect(isReactAppEnvDevelopment()).toBe(false);
      });

      withoutGlobalProcess(() => {
        expect(isReactAppEnvDevelopment()).toBe(false);
      });
    });
  });
});
