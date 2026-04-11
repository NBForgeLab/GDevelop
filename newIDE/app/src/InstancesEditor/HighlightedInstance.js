// @flow
import * as THREE from 'three';
import { type InstanceMeasurer } from './InstancesRenderer';
import Rectangle from '../Utils/Rectangle';

export default class HighlightedInstance {
  instanceMeasurer: InstanceMeasurer;
  toCanvasCoordinates: (x: number, y: number) => [number, number];
  isInstanceOf3DObject: gdInitialInstance => boolean;
  highlightedInstance: gdInitialInstance | null;
  isHighlightedInstanceOf3DObject: boolean;
  highlightRectangle: THREE.LineSegments;
  _highlightGeometry: THREE.EdgesGeometry;
  _highlightMaterial: THREE.LineBasicMaterial;

  constructor({
    instanceMeasurer,
    toCanvasCoordinates,
    isInstanceOf3DObject,
  }: {
    instanceMeasurer: InstanceMeasurer,
    toCanvasCoordinates: (x: number, y: number) => [number, number],
    isInstanceOf3DObject: gdInitialInstance => boolean,
  }) {
    this.instanceMeasurer = instanceMeasurer;
    this.toCanvasCoordinates = toCanvasCoordinates;
    this.isInstanceOf3DObject = isInstanceOf3DObject;

    this.highlightedInstance = null;
    this.isHighlightedInstanceOf3DObject = false;
    this._highlightGeometry = new THREE.EdgesGeometry(
      new THREE.PlaneGeometry(1, 1)
    );
    this._highlightMaterial = new THREE.LineBasicMaterial({
      color: 0x4fc3f7,
      transparent: true,
      opacity: 0.9,
    });
    this.highlightRectangle = new THREE.LineSegments(
      this._highlightGeometry,
      this._highlightMaterial
    );
    this.highlightRectangle.visible = false;
  }

  setInstance(instance: gdInitialInstance | null) {
    this.isHighlightedInstanceOf3DObject = instance
      ? this.isInstanceOf3DObject(instance)
      : false;
    this.highlightedInstance = instance;
  }

  getInstance(): ?gdInitialInstance {
    return this.highlightedInstance;
  }

  getThreeObject(): THREE.LineSegments {
    return this.highlightRectangle;
  }

  render() {
    const highlightedInstance = this.highlightedInstance;
    if (highlightedInstance === null) {
      this.highlightRectangle.visible = false;
      return;
    }

    const aabb = this.instanceMeasurer.getInstanceAABB(
      highlightedInstance,
      new Rectangle()
    );
    const canvasTopLeft = this.toCanvasCoordinates(aabb.left, aabb.top);
    const canvasBottomRight = this.toCanvasCoordinates(aabb.right, aabb.bottom);
    const width = canvasBottomRight[0] - canvasTopLeft[0];
    const height = canvasBottomRight[1] - canvasTopLeft[1];

    this.highlightRectangle.visible = true;
    this.highlightRectangle.position.set(
      canvasTopLeft[0] + width / 2,
      canvasTopLeft[1] + height / 2,
      0
    );
    this.highlightRectangle.scale.set(width, height, 1);
  }
}
