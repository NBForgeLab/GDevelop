// @flow
import * as THREE from 'three';
import Rectangle from '../Utils/Rectangle';
import { type InstancesEditorSettings } from './InstancesEditorSettings';
import RenderedInstance from '../ObjectsRendering/Renderers/RenderedInstance';

type Props = {|
  initialViewX: number,
  initialViewY: number,
  width: number,
  height: number,
  instancesEditorSettings: InstancesEditorSettings,
|};

export default class ViewPosition {
  viewX: number = 0;
  viewY: number = 0;
  _width: number;
  _height: number;
  instancesEditorSettings: InstancesEditorSettings;

  constructor({
    initialViewX,
    initialViewY,
    width,
    height,
    instancesEditorSettings,
  }: Props) {
    this.viewX = initialViewX;
    this.viewY = initialViewY;
    this.instancesEditorSettings = instancesEditorSettings;
    this.resize(width, height);
  }

  setInstancesEditorSettings(instancesEditorSettings: InstancesEditorSettings) {
    this.instancesEditorSettings = instancesEditorSettings;
  }

  resize(width: number, height: number) {
    this._width = width;
    this._height = height;
  }

  getWidth(): number {
    return this._width;
  }

  getHeight(): number {
    return this._height;
  }

  getViewTopLeft(): [number, number] {
    return this.toSceneCoordinates(0, 0);
  }

  getViewBottomRight(): [number, number] {
    return this.toSceneCoordinates(this._width, this._height);
  }

  containsPoint(x: number, y: number): boolean {
    const canvasPoint = this.toCanvasCoordinates(x, y);
    return (
      0 <= canvasPoint[0] &&
      canvasPoint[0] <= this._width &&
      0 <= canvasPoint[1] &&
      canvasPoint[1] <= this._height
    );
  }

  toSceneCoordinates = (x: number, y: number): [number, number] => {
    x -= this._width / 2;
    y -= this._height / 2;
    x /= Math.abs(this.instancesEditorSettings.zoomFactor);
    y /= Math.abs(this.instancesEditorSettings.zoomFactor);

    return [x + this.viewX, y + this.viewY];
  };

  toSceneScale = (a: number): number =>
    this.instancesEditorSettings.zoomFactor === 0
      ? a
      : a / Math.abs(this.instancesEditorSettings.zoomFactor);

  toCanvasScale = (a: number): number =>
    a * Math.abs(this.instancesEditorSettings.zoomFactor);

  toCanvasCoordinates = (x: number, y: number): [number, number] => {
    x -= this.viewX;
    y -= this.viewY;

    x *= Math.abs(this.instancesEditorSettings.zoomFactor);
    y *= Math.abs(this.instancesEditorSettings.zoomFactor);

    return [x + this._width / 2, y + this._height / 2];
  };

  scrollBy(x: number, y: number) {
    this.viewX += x;
    this.viewY += y;
  }

  scrollTo(x: number, y: number) {
    this.viewX = x;
    this.viewY = y;
  }

  fitToRectangle(rectangle: Rectangle): number {
    this.viewX = rectangle.centerX();
    this.viewY = rectangle.centerY();
    const idealZoomOnX = this._width / rectangle.width();
    const idealZoomOnY = this._height / rectangle.height();

    return Math.min(idealZoomOnX, idealZoomOnY) * 0.95;
  }

  getViewX(): number {
    return this.viewX;
  }

  getViewY(): number {
    return this.viewY;
  }

  applyTransformationToThreeGroup(container: THREE.Group) {
    const zoomFactor = this.instancesEditorSettings.zoomFactor;
    container.position.x = -this.viewX * zoomFactor + this._width / 2;
    container.position.y = -this.viewY * zoomFactor + this._height / 2;
    container.scale.set(zoomFactor, zoomFactor, 1);
  }

  applyTransformationToThree(
    threeCamera: THREE.PerspectiveCamera,
    threePlaneMesh: THREE.Mesh | null
  ) {
    threeCamera.aspect = this._width / this._height;
    const zoomFactor = this.instancesEditorSettings.zoomFactor;

    threeCamera.position.x = this.viewX;
    threeCamera.position.y = -this.viewY;

    // Calculate Z based on FOV and zoom so that 1 scene unit = 1 pixel at zoom 1
    const cameraFovInRadians = RenderedInstance.toRad(threeCamera.fov);
    const cameraZPosition =
      (0.5 * this._height) / zoomFactor / Math.tan(0.5 * cameraFovInRadians);
    threeCamera.position.z = cameraZPosition;
    threeCamera.far = Math.max(cameraZPosition + 10000, 20000);
    threeCamera.updateProjectionMatrix();

    if (threePlaneMesh) {
      threePlaneMesh.scale.x = this._width / zoomFactor;
      threePlaneMesh.scale.y = this._height / zoomFactor;
      threePlaneMesh.position.x = threeCamera.position.x;
      threePlaneMesh.position.y = -threeCamera.position.y;
    }
  }
}
