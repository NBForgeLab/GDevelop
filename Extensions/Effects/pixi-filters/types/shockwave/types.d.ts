declare namespace PIXI.filters {
  interface ShockwaveFilterOptions {
    center?: PIXI.PointData;
    amplitude?: number;
    wavelength?: number;
    speed?: number;
    brightness?: number;
    radius?: number;
    time?: number;
  }
  /**
   * The ShockwaveFilter class lets you apply a shockwave effect.<br>
   *
   * @class
   * @extends PIXI.Filter
   * @see {@link https://www.npmjs.com/package/@pixi/filter-shockwave|@pixi/filter-shockwave}
   * @see {@link https://www.npmjs.com/package/pixi-filters|pixi-filters}
   */
  export class ShockwaveFilter extends PIXI.Filter {
    /** Default constructor options. */
    static readonly DEFAULT_OPTIONS: ShockwaveFilterOptions;
    /**
     * Sets the elapsed time of the shockwave.
     * It could control the current size of shockwave.
     */
    time: number;
    constructor(options?: ShockwaveFilterOptions);
    /**
     * Sets the center of the shockwave in normalized screen coords. That is
     * (0,0) is the top-left and (1,1) is the bottom right.
     *
     * @member {PIXI.PointData}
     */
    get center(): PIXI.PointData;
    set center(value: PIXI.PointData | number[]);
    /**
     * The amplitude of the shockwave.
     */
    get amplitude(): number;
    set amplitude(value: number);
    /**
     * The wavelength of the shockwave.
     */
    get wavelength(): number;
    set wavelength(value: number);
    /**
     * The brightness of the shockwave.
     */
    get brightness(): number;
    set brightness(value: number);
    /**
     * The speed about the shockwave ripples out.
     * The unit is `pixel/second`
     */
    get speed(): number;
    set speed(value: number);
    /**
     * The maximum radius of shockwave.
     * `< 0.0` means it's infinity.
     */
    get radius(): number;
    set radius(value: number);
  }
}

declare module '@pixi/filter-shockwave' {
  export import ShockwaveFilter = PIXI.filters.ShockwaveFilter;
  export import ShockwaveFilterOptions = PIXI.filters.ShockwaveFilterOptions;
}
