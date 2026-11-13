'use strict';

const path = require('path');

// Custom Jest transformer turning file imports into filenames (and SVG mocks).
// https://jestjs.io/docs/webpack

const toPascalCase = str =>
  str
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1-$2')
    .replace(/([a-z0-9])([A-Z])/g, '$1-$2')
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map(part => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join('');

module.exports = {
  process(sourceText, sourcePath) {
    const assetFilename = JSON.stringify(path.basename(sourcePath));

    if (sourcePath.match(/\.svg$/)) {
      // Based on how SVGR generates a component name:
      // https://github.com/smooth-code/svgr/blob/01b194cf967347d43d4cbe6b434404731b87cf27/packages/core/src/state.js#L6
      const pascalCaseFilename = toPascalCase(path.parse(sourcePath).name);
      const componentName = `Svg${pascalCaseFilename}`;
      return {
        code: `const React = require('react');
module.exports = {
  __esModule: true,
  default: ${assetFilename},
  ReactComponent: React.forwardRef(function ${componentName}(props, ref) {
    return {
      $$typeof: Symbol.for('react.element'),
      type: 'svg',
      ref: ref,
      key: null,
      props: Object.assign({}, props, {
        children: ${assetFilename}
      })
    };
  }),
};`,
      };
    }

    return { code: `module.exports = ${assetFilename};` };
  },
};
