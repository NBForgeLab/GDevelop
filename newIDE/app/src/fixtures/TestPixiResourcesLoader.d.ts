export declare const PixiResourcesLoaderMock: {
  loadTextures: (
    project: gdProject,
    resourceNames: Array<string>
  ) => Promise<void>;
  getPIXITexture: (
    project: gdProject,
    resourceName: string
  ) => { height: number; valid: boolean; width: number };
  getInvalidPIXITexture: () => {
    height: number;
    valid: boolean;
    width: number;
  };
};
