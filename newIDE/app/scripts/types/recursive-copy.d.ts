// CommonJS compatibility bridge for recursive-copy whose upstream index.d.ts
// uses `export default` instead of `export =`, while the package exports the
// function directly via `module.exports`.
import copy from '../../node_modules/recursive-copy/index';

export = copy;
