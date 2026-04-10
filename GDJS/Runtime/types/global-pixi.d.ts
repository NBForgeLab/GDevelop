declare namespace PIXI {
  type IPointData = { x: number; y: number };
  type TextStyleAlign = string;
  type ITextStyle = Record<string, any>;

  interface DisplayObject {
    alpha: number;
    visible: boolean;
    position: { x: number; y: number; set(x: number, y?: number): void };
    scale: { x: number; y: number; set(x: number, y?: number): void };
    anchor: { x: number; y: number; set(x: number, y?: number): void };
    pivot: { x: number; y: number; set(x: number, y?: number): void };
    rotation: number;
    width: number;
    height: number;
    filters?: Filter[];
    blendMode?: any;
    x: number;
    y: number;
    zIndex?: number;
    destroy(...args: any[]): void;
    removeFromParent(): void;
  }

  interface Container<T = DisplayObject> extends DisplayObject {
    children: T[];
    sortableChildren?: boolean;
    mask?: any;
    addChild(...children: any[]): any;
    addChildAt(...children: any[]): any;
    removeChild(...children: any[]): any;
  }

  interface Graphics extends Container {
    line: { color: number; alpha: number };
    fill: { color: number; alpha: number };
    clear(): this;
    lineStyle(...args: any[]): this;
    beginFill(...args: any[]): this;
    endFill(): this;
    drawCircle(...args: any[]): this;
    drawRect(...args: any[]): this;
    drawPolygon(...args: any[]): this;
    moveTo(...args: any[]): this;
    lineTo(...args: any[]): this;
    closePath(): this;
  }

  interface Sprite extends Container {
    texture: Texture;
    tint?: number;
  }

  interface Text extends Container {
    text: string;
    style: any;
  }

  interface BitmapText extends Container {
    text: string;
    fontName: string;
    fontSize: number;
    tint: number;
    dirty: boolean;
    maxWidth: number;
    textWidth: number;
    textHeight: number;
    align?: TextStyleAlign;
  }

  interface Mesh<T = any> extends Container {
    shader: T;
    geometry: any;
  }

  interface Shader {
    uniforms: Record<string, any>;
  }

  interface Filter {
    enabled: boolean;
    padding: number;
    blendMode?: any;
    uniforms: Record<string, any>;
  }

  interface NoiseFilter extends Filter {
    noise: number;
    seed: number;
  }

  interface ColorMatrixFilter extends Filter {
    alpha: number;
    brightness(...args: any[]): void;
    blackAndWhite(...args: any[]): void;
    sepia(...args: any[]): void;
  }

  interface AlphaFilter extends Filter {
    alpha: number;
  }

  interface BlurFilter extends Filter {
    blur: number;
    quality: number;
    kernelSize: number;
  }

  interface DisplacementFilter extends Filter {
    scale: { x: number; y: number; set(x: number, y?: number): void };
  }

  interface Geometry {
    addAttribute(...args: any[]): this;
    addIndex(...args: any[]): this;
  }

  interface Renderer {
    width: number;
    height: number;
    type?: any;
    background: { color: number; alpha: number };
    plugins: Record<string, any>;
    generateTexture(...args: any[]): Texture;
    render(...args: any[]): void;
    clear(): void;
    resize(...args: any[]): void;
    destroy(...args: any[]): void;
  }

  interface Texture {
    valid: boolean;
    destroyed?: boolean;
    width: number;
    height: number;
    baseTexture: BaseTexture;
    on(...args: any[]): Texture;
    destroy(...args: any[]): void;
  }

  interface BaseTexture {
    valid?: boolean;
    destroyed: boolean;
    resource: any;
    scaleMode?: any;
    wrapMode?: any;
    on(...args: any[]): BaseTexture;
  }

  interface TextStyle {
    [key: string]: any;
  }

  interface BitmapFont {
    font: string;
    size: number;
    pageTextures?: Record<string, Texture>;
    [key: string]: any;
  }

  class Point {
    constructor(x?: number, y?: number);
    x: number;
    y: number;
    set(x: number, y?: number): void;
  }

  const Container: {
    new (...args: any[]): Container;
  };
  const Graphics: {
    new (...args: any[]): Graphics;
  };
  const Sprite: {
    new (...args: any[]): Sprite;
    from(...args: any[]): Sprite;
  };
  const Text: {
    new (...args: any[]): Text;
  };
  const BitmapText: {
    new (...args: any[]): BitmapText;
  };
  const Mesh: {
    new (...args: any[]): Mesh;
  };
  const Filter: {
    new (...args: any[]): Filter;
    prototype: Filter;
    call(self: any, ...args: any[]): void;
  };
  const Shader: {
    from(...args: any[]): Shader;
  };
  const Geometry: {
    new (...args: any[]): Geometry;
  };
  const Renderer: {
    new (...args: any[]): Renderer;
  };
  const Texture: {
    from(...args: any[]): Texture;
    removeFromCache(...args: any[]): void;
  };
  const BaseTexture: {
    removeFromCache(...args: any[]): void;
  };
  const BitmapFont: {
    install(...args: any[]): BitmapFont;
    uninstall(...args: any[]): any;
    from(...args: any[]): BitmapFont;
    available: Record<string, BitmapFont>;
  };
  const TextStyle: {
    new (...args: any[]): TextStyle;
  };
  const NoiseFilter: {
    new (...args: any[]): NoiseFilter;
  };
  const ColorMatrixFilter: {
    new (...args: any[]): ColorMatrixFilter;
  };
  const AlphaFilter: {
    new (...args: any[]): AlphaFilter;
  };
  const BlurFilter: {
    new (...args: any[]): BlurFilter;
  };
  const DisplacementFilter: {
    new (...args: any[]): DisplacementFilter;
  };

  const BLEND_MODES: Record<string, any>;
  const SCALE_MODES: Record<string, any>;
  const WRAP_MODES: Record<string, any>;
  const RENDERER_TYPE: Record<string, any>;
  const settings: Record<string, any>;
  const utils: Record<string, any>;

  function autoDetectRenderer(...args: any[]): Renderer;
}

declare const PIXI: typeof PIXI;
