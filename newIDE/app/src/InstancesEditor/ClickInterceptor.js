// @flow

import * as THREE from 'three';
import ViewPosition from './ViewPosition';

type TileMapTileSelection = any;

type Coordinates = {| x: number, y: number |};

type Props = {|
  viewPosition: ViewPosition,
  getTileMapTileSelection: () => ?TileMapTileSelection,
  onPanMove: (deltaX: number, deltaY: number, x: number, y: number) => void,
  onClick: (scenePathCoordinates: Array<Coordinates>) => void,
  onInterceptPointerMove: () => void,
|};

class ClickInterceptor {
  viewPosition: ViewPosition;
  getTileMapTileSelection: () => ?TileMapTileSelection;
  onPanMove: (deltaX: number, deltaY: number, x: number, y: number) => void;
  onClick: (scenePathCoordinates: Array<Coordinates>) => void;
  pointerPathCoordinates: ?Array<Coordinates>;
  onInterceptPointerMove: () => void;
  _shouldCancelClick: boolean = false;
  _isIntercepting: boolean = false;
  _touchingPointerIds: Set<number> = new Set();
  _cancelUntilNoMoreTouches: boolean = false;

  // $FlowFixMe[value-as-type]
  threeGroup: THREE.Group;

  constructor({
    viewPosition,
    getTileMapTileSelection,
    onClick,
    onPanMove,
    onInterceptPointerMove,
  }: Props) {
    this.viewPosition = viewPosition;
    this.onClick = onClick;
    this.onPanMove = onPanMove;
    this.onInterceptPointerMove = onInterceptPointerMove;
    this.getTileMapTileSelection = getTileMapTileSelection;
    this.pointerPathCoordinates = null;
    this.threeGroup = new THREE.Group();
  }

  // $FlowFixMe[value-as-type]
  getThreeObject(): THREE.Group {
    return this.threeGroup;
  }

  getPointerPathCoordinates(): ?Array<Coordinates> {
    return this.pointerPathCoordinates;
  }

  _startClickInterception(deviceX: number, deviceY: number) {
    this._shouldCancelClick = false;
    this._isIntercepting = true;
    const sceneCoordinates = this.viewPosition.toSceneCoordinates(
      deviceX,
      deviceY
    );
    this.pointerPathCoordinates = [
      { x: sceneCoordinates[0], y: sceneCoordinates[1] },
    ];
  }

  _endClickInterception() {
    this._isIntercepting = false;
    if (!this.pointerPathCoordinates) return;
    if (this._shouldCancelClick) {
      this._shouldCancelClick = false;
      return;
    }
    this.onClick(this.pointerPathCoordinates);
    this.pointerPathCoordinates = null;
  }

  _interceptPointerMove(deviceX: number, deviceY: number) {
    if (this._shouldCancelClick || this._cancelUntilNoMoreTouches) return;
    this.onInterceptPointerMove();
    const pointerPathCoordinates = this.pointerPathCoordinates;
    if (!pointerPathCoordinates) return;

    const sceneCoordinates = this.viewPosition.toSceneCoordinates(
      deviceX,
      deviceY
    );
    const tileMapTileSelection = this.getTileMapTileSelection();

    if (
      tileMapTileSelection &&
      (tileMapTileSelection.kind === 'floodfill' ||
        tileMapTileSelection.kind === 'picker')
    ) {
      pointerPathCoordinates[0] = {
        x: sceneCoordinates[0],
        y: sceneCoordinates[1],
      };
      return;
    }

    if (tileMapTileSelection && tileMapTileSelection.kind === 'freehand') {
      const lastPoint =
        pointerPathCoordinates[pointerPathCoordinates.length - 1];
      if (lastPoint) {
        const dx = sceneCoordinates[0] - lastPoint.x;
        const dy = sceneCoordinates[1] - lastPoint.y;
        if (Math.abs(dx) < 2 && Math.abs(dy) < 2) return;
      }
      if (pointerPathCoordinates.length < 10000) {
        pointerPathCoordinates.push({
          x: sceneCoordinates[0],
          y: sceneCoordinates[1],
        });
      }
      return;
    }

    if (pointerPathCoordinates[1]) {
      pointerPathCoordinates[1] = {
        x: sceneCoordinates[0],
        y: sceneCoordinates[1],
      };
      return;
    }

    pointerPathCoordinates.push({
      x: sceneCoordinates[0],
      y: sceneCoordinates[1],
    });
  }

  startPointerInterception(deviceX: number, deviceY: number) {
    this._startClickInterception(deviceX, deviceY);
  }

  endPointerInterception() {
    this._endClickInterception();
  }

  interceptPointerMove(deviceX: number, deviceY: number) {
    this._interceptPointerMove(deviceX, deviceY);
  }

  isIntercepting(): boolean {
    return this._isIntercepting;
  }

  cancelClickInterception() {
    this._shouldCancelClick = true;
    if (this.pointerPathCoordinates) {
      this.pointerPathCoordinates = null;
    }
  }

  render() {}
}
export default ClickInterceptor;
