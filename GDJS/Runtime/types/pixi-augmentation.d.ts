import '@pixi/core';

// PixiJS v7 types define `IArrayBuffer extends ArrayBuffer`, which rejects
// TypedArray views (ArrayBufferView) under TypeScript 5.7+ strict ArrayBufferLike typing.
declare module '@pixi/core' {
  interface Geometry {
    addIndex(
      buffer?: Buffer | IArrayBuffer | ArrayBufferView | number[]
    ): Geometry;
  }

  interface Buffer {
    update(data?: IArrayBuffer | ArrayBufferView | Array<number>): void;
  }
}

export {};
