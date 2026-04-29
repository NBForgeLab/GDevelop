declare namespace PIXI.filters {
  export interface ColorMapFilterOptions {
    colorMap: PIXI.Texture | PIXI.TextureSource;
    nearest?: boolean;
    mix?: number;
  }

  export class ColorMapFilter extends PIXI.Filter {
    constructor(options: ColorMapFilterOptions);
    colorMap: PIXI.Texture | PIXI.TextureSource;
    nearest: boolean;
    mix: number;
    readonly colorSize: number;
  }
}

declare module '@pixi/filter-color-map' {
  export import ColorMapFilter = PIXI.filters.ColorMapFilter;
  export import ColorMapFilterOptions = PIXI.filters.ColorMapFilterOptions;
}
