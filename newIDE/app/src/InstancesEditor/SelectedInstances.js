// @flow
import * as THREE from 'three';
import { type ScreenType } from '../UI/Responsive/ScreenTypeMeasurer';
import InstancesSelection from './InstancesSelection';
import {
  type ResizeGrabbingLocation,
  resizeGrabbingLocationValues,
  resizeGrabbingRelativePositions,
} from './InstancesResizer';
import { type InstanceMeasurer } from './InstancesRenderer';
import Rectangle from '../Utils/Rectangle';
import KeyboardShortcuts from '../UI/KeyboardShortcuts';

export default class SelectedInstances {
  instancesSelection: InstancesSelection;
  instanceMeasurer: InstanceMeasurer;
  shouldDisplayHandles: () => boolean;
  onResize: (
    deltaX: number,
    deltaY: number,
    grabbingLocation: ResizeGrabbingLocation
  ) => void;
  onResizeEnd: () => void;
  onRotate: (number, number) => void;
  onRotateEnd: () => void;
  toCanvasCoordinates: (x: number, y: number) => [number, number];
  _screenType: ScreenType;
  keyboardShortcuts: KeyboardShortcuts;
  onPanMove: (deltaX: number, deltaY: number, x: number, y: number) => void;
  onPanEnd: () => void;
  getFillColor: (isLocked: boolean) => {| color: number, alpha: number |};

  threeGroup: THREE.Group = new THREE.Group();
  _fillsGroup: THREE.Group = new THREE.Group();
  _rectsGroup: THREE.Group = new THREE.Group();
  _handlesGroup: THREE.Group = new THREE.Group();

  // High-performance shared resources
  _sharedFillGeometry = new THREE.PlaneGeometry(1, 1);
  _sharedRectGeometry = new THREE.EdgesGeometry(new THREE.PlaneGeometry(1, 1));
  _sharedHandleGeometry = new THREE.PlaneGeometry(1, 1);
  _sharedHandleMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });

  constructor({
    instancesSelection,
    instanceMeasurer,
    shouldDisplayHandles,
    onResize,
    onResizeEnd,
    onRotate,
    onRotateEnd,
    toCanvasCoordinates,
    screenType,
    keyboardShortcuts,
    onPanMove,
    onPanEnd,
    getFillColor,
  }: any) {
    this.instanceMeasurer = instanceMeasurer;
    this.onResize = onResize;
    this.shouldDisplayHandles = shouldDisplayHandles;
    this.onResizeEnd = onResizeEnd;
    this.onRotate = onRotate;
    this.onRotateEnd = onRotateEnd;
    this.toCanvasCoordinates = toCanvasCoordinates;
    this.instancesSelection = instancesSelection;
    this._screenType = screenType;
    this.keyboardShortcuts = keyboardShortcuts;
    this.onPanMove = onPanMove;
    this.onPanEnd = onPanEnd;
    this.getFillColor = getFillColor;

    this.threeGroup.add(this._fillsGroup);
    this.threeGroup.add(this._rectsGroup);
    this.threeGroup.add(this._handlesGroup);

    // Origin for rect geometry
    this._sharedRectGeometry.translate(0, 0, 0);
  }

  setScreenType(screenType: ScreenType) {
    this._screenType = screenType;
  }

  getThreeGroup(): THREE.Group {
    return this.threeGroup;
  }

  _clearGroup(group: THREE.Group) {
    // Don't dispose shared resources, just remove children
    while (group.children.length > 0) {
      const child = group.children[0];
      if (child.material && typeof child.material.dispose === 'function') {
        child.material.dispose();
      }
      group.remove(group.children[0]);
    }
  }

  getSelectionAABB = (): Rectangle => {
    const selectionAABB = new Rectangle();
    const selection = this.instancesSelection.getSelectedInstances();
    if (!selection.length) return selectionAABB;

    let instanceRect = new Rectangle();
    for (let i = 0; i < selection.length; i++) {
      const instance = selection[i];
      instanceRect = this.instanceMeasurer.getInstanceAABB(
        instance,
        instanceRect
      );
      if (i === 0) {
        selectionAABB.setRectangle(instanceRect);
      } else {
        selectionAABB.union(instanceRect);
      }
    }

    return selectionAABB;
  };

  render() {
    this._clearGroup(this._fillsGroup);
    this._clearGroup(this._rectsGroup);
    this._clearGroup(this._handlesGroup);

    const selection = this.instancesSelection.getSelectedInstances();
    if (selection.length === 0) return;

    const displayHandles =
      this.shouldDisplayHandles() &&
      selection.some(instance => !instance.isLocked());
    const handleSize = this._screenType === 'touch' ? 14 : 10;
    let tempRect = new Rectangle();

    selection.forEach(instance => {
      const aabb = this.instanceMeasurer.getInstanceAABB(instance, tempRect);
      const canvasPos1 = this.toCanvasCoordinates(aabb.left, aabb.top);
      const canvasPos2 = this.toCanvasCoordinates(aabb.right, aabb.bottom);

      const x = canvasPos1[0];
      const y = canvasPos1[1];
      const w = canvasPos2[0] - x;
      const h = canvasPos2[1] - y;
      const { color, alpha } = this.getFillColor(instance.isLocked());

      const fill = new THREE.Mesh(
        this._sharedFillGeometry,
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: alpha,
          depthWrite: false,
        })
      );
      fill.position.set(x + w / 2, y + h / 2, -0.5);
      fill.scale.set(w, h, 1);
      this._fillsGroup.add(fill);

      // Draw selection rectangle using shared resources
      const rect = new THREE.LineSegments(
        this._sharedRectGeometry,
        new THREE.LineBasicMaterial({ color })
      );
      rect.position.set(x + w / 2, y + h / 2, 0);
      rect.scale.set(w, h, 1);
      this._rectsGroup.add(rect);

      if (displayHandles && !instance.isLocked()) {
        resizeGrabbingLocationValues.forEach(
          (location: ResizeGrabbingLocation) => {
            const relativePosition = resizeGrabbingRelativePositions[location];
            const hx = x + relativePosition[0] * w;
            const hy = y + relativePosition[1] * h;

            const handle = new THREE.Mesh(
              this._sharedHandleGeometry,
              this._sharedHandleMaterial
            );
            handle.position.set(hx, hy, 1);
            handle.scale.set(handleSize, handleSize, 1);
            handle.userData.isHandle = true;
            handle.userData.instance = instance;
            handle.userData.location = location;
            this._handlesGroup.add(handle);
          }
        );
      }
    });
  }
}
