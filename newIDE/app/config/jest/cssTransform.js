'use strict';

// Custom Jest transformer turning style imports into empty objects.
// https://jestjs.io/docs/webpack

module.exports = {
  process() {
    return { code: 'module.exports = {};' };
  },
  getCacheKey() {
    // The output is always the same.
    return 'cssTransform';
  },
};
