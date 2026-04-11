// @flow
import * as THREE from 'three';

type Props = {
  getLastCursorSceneCoordinates: () => [number, number] | null,
  width: number,
  height: number,
};

export default class StatusBar {
  _width: number;
  _height: number;
  _getLastCursorSceneCoordinates: () => [number, number] | null;
  // $FlowFixMe[value-as-type]
  _statusBarContainer: THREE.Group;

  constructor({ getLastCursorSceneCoordinates, width, height }: Props) {
    this._getLastCursorSceneCoordinates = getLastCursorSceneCoordinates;
    this._statusBarContainer = new THREE.Group();
    this.resize(width, height);
  }

  resize(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  // $FlowFixMe[value-as-type]
  getThreeObject(): THREE.Group {
    return this._statusBarContainer;
  }

  render() {}
}
