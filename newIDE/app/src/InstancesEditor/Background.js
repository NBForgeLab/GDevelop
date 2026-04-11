// @flow
import * as THREE from 'three';

type Props = {
  width: number,
  height: number,
  layout: gdLayout | null,
};

export default class Background {
  // $FlowFixMe[value-as-type]
  _checkeredBackground: THREE.Group;

  constructor({ width, height, layout }: Props) {
    this._checkeredBackground = new THREE.Group();
  }

  resize(width: number, height: number) {}

  // $FlowFixMe[value-as-type]
  getThreeObject(): THREE.Group {
    return this._checkeredBackground;
  }

  render() {}
}
