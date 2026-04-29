import type * as PixiTilemap from "@pixi/tilemap";

declare global {
  namespace PIXI {
    namespace tilemap {
      type CompositeTilemap = PixiTilemap.CompositeTilemap;
      type Tilemap = PixiTilemap.Tilemap;

      const CompositeTilemap: typeof PixiTilemap.CompositeTilemap;
      const Tilemap: typeof PixiTilemap.Tilemap;
      const settings: typeof PixiTilemap.settings;
    }
  }
}

export {};
