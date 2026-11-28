declare global {
  var GD_STARTUP_TIMES: Array<[string, number]> | undefined;
  var initializeGDevelopJs:
    ((options?: any) => Promise<libGDevelop>) | undefined;
  var PIXI: typeof import('pixi.js-legacy') | undefined;
}

export {};
