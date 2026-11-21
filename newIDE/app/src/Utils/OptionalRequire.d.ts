declare function optionalRequire(
  moduleName: string,
  config?: { rethrowException?: boolean }
): any;

export default optionalRequire;
