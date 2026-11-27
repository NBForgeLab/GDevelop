export declare const findJsExtensionModules: (args: {
  filterExamples: boolean;
  onFindGDJS?: (() => Promise<{ gdjsRoot: string }>) | null | undefined;
}) => Promise<Array<string>>;
