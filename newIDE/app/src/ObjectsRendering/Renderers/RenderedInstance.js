// @flow
import * as THREE from 'three';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import Rectangle from '../../Utils/Rectangle';

/**
 * RenderedInstance is the base class used for creating 2D renderers of instances,
 * which display on the scene editor, using Three.js, the instance of an object (see InstancesEditor).
 */
export default class RenderedInstance {
  _project: gdProject;
  _instance: gdInitialInstance;
  _associatedObjectConfiguration: gdObjectConfiguration;
  // $FlowFixMe[value-as-type]
  _layerGroup: THREE.Group;
  _resourcesLoader: Class<ThreeResourcesLoader>;
  // $FlowFixMe[value-as-type]
  _threeObject: any;
  wasUsed: boolean;
  _wasDestroyed: boolean;
  _getPropertyOverridings: (() => Map<string, string>) | null;

  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration,
    // $FlowFixMe[value-as-type]
    layerGroup: THREE.Group,
    resourcesLoader: Class<ThreeResourcesLoader>,
    getPropertyOverridings: (() => Map<string, string>) | null = null
  ) {
    this._threeObject = null;
    this._instance = instance;
    this._associatedObjectConfiguration = associatedObjectConfiguration;
    this._layerGroup = layerGroup;
    this._project = project;
    this._resourcesLoader = resourcesLoader;
    this._getPropertyOverridings = getPropertyOverridings;
    this.wasUsed = true; //Used by InstancesRenderer to track rendered instance that are not used anymore.
    this._wasDestroyed = false;
  }

  isRenderedIn3D(): boolean {
    return false;
  }

  /**
   * Convert an angle from degrees to radians.
   */
  static toRad(angleInDegrees: number): any {
    return (angleInDegrees / 180) * Math.PI;
  }

  /**
   * Called when the scene editor is rendered.
   */
  update() {
    //Nothing to do.
  }

  // $FlowFixMe[value-as-type]
  getThreeObject(): any {
    return this._threeObject;
  }

  getInstance(): gdInitialInstance {
    return this._instance;
  }

  /**
   * Called to notify the instance renderer that its associated instance was removed from
   * the scene. The object should be removed from the container: This is what
   * the default implementation of the method does.
   */
  onRemovedFromScene(): void {
    this._wasDestroyed = true;
    if (this._threeObject !== null) this._layerGroup.remove(this._threeObject);
  }

  getOriginX(): number {
    return 0;
  }

  getOriginY(): number {
    return 0;
  }

  getOriginZ(): number {
    return 0;
  }

  getCenterX(): number {
    return this.getWidth() / 2;
  }

  getCenterY(): number {
    return this.getHeight() / 2;
  }

  getCustomWidth(): number {
    return this._instance.getCustomWidth();
  }

  getCustomHeight(): number {
    return this._instance.getCustomHeight();
  }

  getWidth(): number {
    return this._instance.hasCustomSize()
      ? this.getCustomWidth()
      : this.getDefaultWidth();
  }

  getHeight(): number {
    return this._instance.hasCustomSize()
      ? this.getCustomHeight()
      : this.getDefaultHeight();
  }

  getDepth(): number {
    return 0;
  }

  getUnrotatedInstanceSize(): [number, number, number] {
    return [this.getWidth(), this.getHeight(), this.getDepth()];
  }

  getUnrotatedInstanceAABB(): Rectangle {
    const width = this.getWidth();
    const height = this.getHeight();
    const depth = this.getDepth();

    return new Rectangle(
      this._instance.getX() - this.getOriginX(),
      this._instance.getY() - this.getOriginY(),
      this._instance.getX() - this.getOriginX() + width,
      this._instance.getY() - this.getOriginY() + height,
      this._instance.getZ() - this.getOriginZ(),
      this._instance.getZ() - this.getOriginZ() + depth
    );
  }

  getInstanceAABB(): Rectangle {
    const aabb = this.getUnrotatedInstanceAABB();
    const angle = this._instance.getAngle();
    if (angle === 0) return aabb;

    const originX = this._instance.getX();
    const originY = this._instance.getY();
    const radians = RenderedInstance.toRad(angle);
    const cosine = Math.cos(radians);
    const sine = Math.sin(radians);

    const corners = [
      [aabb.left, aabb.top],
      [aabb.right, aabb.top],
      [aabb.right, aabb.bottom],
      [aabb.left, aabb.bottom],
    ];

    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;

    corners.forEach(([x, y]) => {
      const relativeX = x - originX;
      const relativeY = y - originY;
      const rotatedX = originX + relativeX * cosine - relativeY * sine;
      const rotatedY = originY + relativeX * sine + relativeY * cosine;
      left = Math.min(left, rotatedX);
      top = Math.min(top, rotatedY);
      right = Math.max(right, rotatedX);
      bottom = Math.max(bottom, rotatedY);
    });

    return new Rectangle(left, top, right, bottom, aabb.zMin, aabb.zMax);
  }

  /**
   * Return the width of the instance when the instance doesn't have a custom size.
   */
  getDefaultWidth(): number {
    return 32;
  }

  /**
   * Return the height of the instance when the instance doesn't have a custom size.
   */
  getDefaultHeight(): number {
    return 32;
  }

  getDefaultDepth(): number {
    return 0;
  }

  getPropertyOverridings(): Map<string, string> | null {
    return this._getPropertyOverridings && this._getPropertyOverridings();
  }
}
