// CommonJS compatibility declaration for iso-639-1 whose upstream index.d.ts
// uses `export default` instead of `export =`, while the package exports the
// ISO6391 class directly via `module.exports`.
interface ISO6391 {
  getName: (code: string) => string;
  getAllNames: () => Array<string>;
  getNativeName: (code: string) => string;
  getAllNativeNames: () => Array<string>;
  getCode: (name: string) => string;
  getAllCodes: () => Array<string>;
  validate: (code: string) => boolean;
  getLanguages: (codes: Array<string>) => Array<{
    code: string;
    name: string;
    nativeName: string;
  }>;
}

declare const ISO6391: ISO6391;
export = ISO6391;
