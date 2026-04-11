// @flow
import * as THREE from 'three';
import {
  getBasicProfilingCountersText,
  type BasicProfilingCounters,
} from './InstancesRenderer/BasicProfilingCounters';

export default class ProfilerBar {
  // $FlowFixMe[value-as-type]
  _profilerBarContainer: THREE.Group;

  constructor() {
    this._profilerBarContainer = new THREE.Group();
  }

  // $FlowFixMe[value-as-type]
  getThreeObject(): THREE.Group {
    return this._profilerBarContainer;
  }

  render({
    basicProfilingCounters,
    display,
  }: {|
    basicProfilingCounters: BasicProfilingCounters,
    display: boolean,
  |}) {}
}
