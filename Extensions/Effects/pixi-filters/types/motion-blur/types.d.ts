declare namespace PIXI.filters {
  export interface MotionBlurFilterOptions {
    velocity?: PIXI.PointData | number[];
    kernelSize?: number;
    offset?: number;
  }

  export class MotionBlurFilter extends PIXI.Filter {
    constructor(options?: MotionBlurFilterOptions);
    velocity: PIXI.PointData;
    velocityX: number;
    velocityY: number;
    kernelSize: number;
    offset: number;
  }
}

declare module '@pixi/filter-motion-blur' {
  export import MotionBlurFilter = PIXI.filters.MotionBlurFilter;
  export import MotionBlurFilterOptions = PIXI.filters.MotionBlurFilterOptions;
}
