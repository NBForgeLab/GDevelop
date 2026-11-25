import { AffineTransformation } from './AffineTransformation';
import { type TileMapTileSelection } from '../InstancesEditor/TileSetVisualizer';

export type TileMapTilePatch = {
  tileCoordinates?: { x: number; y: number };
  erase?: boolean;
  topLeftCorner: { x: number; y: number };
  bottomRightCorner: { x: number; y: number };
};

export type TileSet = {
  rowCount: number;
  columnCount: number;
  tileSize: number;
  atlasImage: string;
};

export declare const optimizeTilesGridCoordinates: (options: {
  tileMapTilePatches: TileMapTilePatch[];
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
}) => TileMapTilePatch[];

export declare const isSelectionASingleTileRectangle: (
  tileMapTileSelection: TileMapTileSelection
) => boolean;

export declare const getTilesGridCoordinatesFromPointerSceneCoordinates: (options: {
  tileMapTileSelection: TileMapTileSelection;
  coordinates: Array<{ x: number; y: number }>;
  tileSize: number;
  sceneToTileMapTransformation: AffineTransformation;
}) => TileMapTilePatch[];

export declare const getTileSet: (object: gdObject) => TileSet;

export declare const isTileSetBadlyConfigured: (tileSet: TileSet) => boolean;
