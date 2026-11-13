'use strict';

// Ensure Babel runs with the test preset behavior even when Jest is invoked
// directly without react-scripts setting BABEL_ENV / NODE_ENV.
process.env.BABEL_ENV = 'test';
if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'test';
}

const babelJestMd = require('babel-jest');
const babelJest = babelJestMd.__esModule ? babelJestMd.default : babelJestMd;

const hasJsxRuntime = (() => {
  if (process.env.DISABLE_NEW_JSX_TRANSFORM === 'true') {
    return false;
  }

  try {
    require.resolve('react/jsx-runtime');
    return true;
  } catch (e) {
    return false;
  }
})();

module.exports = babelJest.createTransformer({
  presets: [
    [
      require.resolve('babel-preset-react-app'),
      {
        runtime: hasJsxRuntime ? 'automatic' : 'classic',
      },
    ],
  ],
  plugins: [],
  babelrc: true,
});
