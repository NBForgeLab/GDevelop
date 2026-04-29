declare namespace PIXI.filters {
  export interface BulgePinchFilterOptions {
    center?: PIXI.PointData | number[] | number;
    radius?: number;
    strength?: number;
  }
  export class BulgePinchFilter extends PIXI.Filter {
    constructor(options?: BulgePinchFilterOptions);
    center: PIXI.PointData;
    centerX: number;
    centerY: number;
    radius: number;
    strength: number;
  }
}

declare module '@pixi/filter-bulge-pinch' {
  export import BulgePinchFilterOptions = PIXI.filters.BulgePinchFilterOptions;
  export import BulgePinchFilter = PIXI.filters.BulgePinchFilter;
}
