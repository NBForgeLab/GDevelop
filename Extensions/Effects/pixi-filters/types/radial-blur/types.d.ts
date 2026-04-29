declare namespace PIXI.filters {
  export interface RadialBlurFilterOptions {
    angle?: number;
    center?: PIXI.PointData | number[];
    kernelSize?: number;
    radius?: number;
  }

  export class RadialBlurFilter extends PIXI.Filter {
    constructor(options?: RadialBlurFilterOptions);
    angle: number;
    center: PIXI.PointData;
    centerX: number;
    centerY: number;
    kernelSize: number;
    radius: number;
  }
}

declare module '@pixi/filter-radial-blur' {
  export import RadialBlurFilter = PIXI.filters.RadialBlurFilter;
  export import RadialBlurFilterOptions = PIXI.filters.RadialBlurFilterOptions;
}
