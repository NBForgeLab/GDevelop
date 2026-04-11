// @flow
import * as THREE from 'three';
import Rectangle from '../Utils/Rectangle';
import { type InstanceMeasurer } from './InstancesRenderer';
const gd: libGDevelop = global.gd;

export default class SelectionRectangle {
  instances: gdInitialInstancesContainer;
  instanceMeasurer: InstanceMeasurer;
  toSceneCoordinates: (x: number, y: number) => [number, number];

  threeRectangle: THREE.Mesh;
  selectionRectangleStart: { x: number, y: number } | null;
  selectionRectangleEnd: { x: number, y: number } | null;
  _instancesInSelectionRectangle: gdInitialInstance[];

  selector: gdInitialInstanceJSFunctor;
  /**
   * Used to check if an instance is in the selection rectangle
   */
  _temporaryAABB: Rectangle;

  constructor({
    instances,
    instanceMeasurer,
    toSceneCoordinates,
  }: {
    instances: gdInitialInstancesContainer,
    instanceMeasurer: InstanceMeasurer,
    toSceneCoordinates: (x: number, y: number) => [number, number],
  }) {
    this.instances = instances;
    this.instanceMeasurer = instanceMeasurer;
    this.toSceneCoordinates = toSceneCoordinates;

    const geometry = new THREE.PlaneGeometry(1, 1);
    geometry.translate(0.5, 0.5, 0); // Origin top-left
    const material = new THREE.MeshBasicMaterial({
      color: 0x6868e8,
      transparent: true,
      opacity: 0.1,
      side: THREE.DoubleSide,
    });
    this.threeRectangle = new THREE.Mesh(geometry, material);

    // Orthographic overlay Z index
    this.threeRectangle.position.z = -1;

    this.selectionRectangleStart = null;
    this.selectionRectangleEnd = null;
    this._instancesInSelectionRectangle = [];

    this._temporaryAABB = new Rectangle();
    this.selector = new gd.InitialInstanceJSFunctor();
    // $FlowFixMe[incompatible-type] - invoke is not writable
    // $FlowFixMe[cannot-write]
    this.selector.invoke = instancePtr => {
      // $FlowFixMe[incompatible-type] - wrapPointer is not exposed
      const instance = gd.wrapPointer(instancePtr, gd.InitialInstance);
      const instanceAABB = this.instanceMeasurer.getInstanceAABB(
        instance,
        this._temporaryAABB
      );

      const { selectionRectangleEnd, selectionRectangleStart } = this;
      if (!selectionRectangleStart || !selectionRectangleEnd) return;

      const selectionSceneStart = this.toSceneCoordinates(
        selectionRectangleStart.x,
        selectionRectangleStart.y
      );
      const selectionSceneEnd = this.toSceneCoordinates(
        selectionRectangleEnd.x,
        selectionRectangleEnd.y
      );

      if (
        selectionSceneStart[0] <= instanceAABB.left &&
        instanceAABB.right <= selectionSceneEnd[0] &&
        selectionSceneStart[1] <= instanceAABB.top &&
        instanceAABB.bottom <= selectionSceneEnd[1]
      ) {
        this._instancesInSelectionRectangle.push(instance);
      }
    };
  }

  hasStartedSelectionRectangle(): any {
    return this.selectionRectangleStart;
  }

  startSelectionRectangle = (x: number, y: number) => {
    this.selectionRectangleStart = { x, y };
    this.selectionRectangleEnd = { x, y };
  };

  updateSelectionRectangle = (lastX: number, lastY: number) => {
    if (!this.selectionRectangleStart)
      this.selectionRectangleStart = { x: lastX, y: lastY };

    this.selectionRectangleEnd = { x: lastX, y: lastY };
  };

  endSelectionRectangle = (): any => {
    if (!this.selectionRectangleStart || !this.selectionRectangleEnd) return [];

    this._instancesInSelectionRectangle.length = 0;
    if (this.selectionRectangleStart.x > this.selectionRectangleEnd.x) {
      const tmp = this.selectionRectangleStart.x;
      this.selectionRectangleStart.x = this.selectionRectangleEnd.x;
      this.selectionRectangleEnd.x = tmp;
    }
    if (this.selectionRectangleStart.y > this.selectionRectangleEnd.y) {
      const tmp = this.selectionRectangleStart.y;
      this.selectionRectangleStart.y = this.selectionRectangleEnd.y;
      this.selectionRectangleEnd.y = tmp;
    }

    this.instances.iterateOverInstances(
      // $FlowFixMe[incompatible-type] - gd.castObject is not supporting typings.
      this.selector
    );

    this.selectionRectangleStart = null;
    return this._instancesInSelectionRectangle;
  };

  getThreeObject(): any {
    return this.threeRectangle;
  }

  render() {
    if (!this.selectionRectangleStart || !this.selectionRectangleEnd) {
      this.threeRectangle.visible = false;
      return;
    }

    let x1 = this.selectionRectangleStart.x;
    let y1 = this.selectionRectangleStart.y;
    let x2 = this.selectionRectangleEnd.x;
    let y2 = this.selectionRectangleEnd.y;

    this.threeRectangle.visible = true;

    const minX = Math.min(x1, x2);
    const minY = Math.min(y1, y2);
    const w = Math.abs(x2 - x1);
    const h = Math.abs(y2 - y1);

    this.threeRectangle.position.set(minX, minY, -1);
    this.threeRectangle.scale.set(w, h, 1);
  }

  delete() {
    this.selector.delete();
  }
}
