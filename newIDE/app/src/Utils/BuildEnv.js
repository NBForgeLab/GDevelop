// @flow

/**
 * Return the configured `PUBLIC_URL` build environment variable, or `''`.
 */
export const getPublicUrl = (): string => {
  try {
    // Read `process.env.PUBLIC_URL` directly so bundler replacements (such as
    // webpack DefinePlugin or Vite define) apply without needing `global.process`.
    // $FlowFixMe[cannot-resolve-name]
    const publicUrl = process.env.PUBLIC_URL;
    return typeof publicUrl === 'string' ? publicUrl : '';
  } catch (error) {
    return '';
  }
};

/**
 * Return true when `REACT_APP_ENV` is `'development'`.
 */
export const isReactAppEnvDevelopment = (): boolean => {
  try {
    // $FlowFixMe[cannot-resolve-name]
    return process.env.REACT_APP_ENV === 'development';
  } catch (error) {
    return false;
  }
};
