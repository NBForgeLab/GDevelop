// @flow
import * as THREE from 'three';
import ResourcesLoader from '../ThreeResourcesLoader';
import Rectangle from '../../Utils/Rectangle';

/**
 * Rendered3DInstance is the base class used for creating 3D renderers of instances,
 * which display on the scene editor, using Three.js, the instance of an object (see InstancesEditor).
 */
export default class Rendered3DInstance {
  _project: gdProject;
  _instance: gdInitialInstance;
  _associatedObjectConfiguration: gdObjectConfiguration;
  // $FlowFixMe[value-as-type]
  _layerGroup: THREE.Group;
  // $FlowFixMe[value-as-type]
  _threeGroup: THREE.Group;
  _resourcesLoader: Class<ResourcesLoader>;

  // $FlowFixMe[value-as-type]
  _threeObject: THREE.Object3D | null;
  wasUsed: boolean;
  _wasDestroyed: boolean;
  _getPropertyOverridings: (() => Map<string, string>) | null;

  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration,
    // $FlowFixMe[value-as-type]
    layerGroup: THREE.Group,
    // $FlowFixMe[value-as-type]
    threeGroup: THREE.Group,
    resourcesLoader: Class<ResourcesLoader>,
    getPropertyOverridings: (() => Map<string, string>) | null = null
  ) {
    this._threeObject = null;
    this._instance = instance;
    this._associatedObjectConfiguration = associatedObjectConfiguration;
    this._layerGroup = layerGroup;
    this._threeGroup = threeGroup;
    this._project = project;
    this._resourcesLoader = resourcesLoader;
    this._getPropertyOverridings = getPropertyOverridings;
    this.wasUsed = true; //Used by InstancesRenderer to track rendered instance that are not used anymore.
    this._wasDestroyed = false;
  }

  isRenderedIn3D(): boolean {
    return true;
  }

  /**
   * Convert an angle from degrees to radians.
   */
  static toRad(angleInDegrees: number): number {
    return (angleInDegrees / 180) * Math.PI;
  }

  /**
   * Applies ratio to value without intermediary value to avoid precision issues.
   */
  static applyRatio({
    oldReferenceValue,
    newReferenceValue,
    valueToApplyTo,
  }: {|
    oldReferenceValue: number,
    newReferenceValue: number,
    valueToApplyTo: number,
  |}): number {
    return (newReferenceValue / oldReferenceValue) * valueToApplyTo;
  }

  /**
   * Called when the scene editor is rendered.
   */
  update() {
    //Nothing to do.
  }

  getThreeObject(): any {
    return this._threeObject;
  }

  getInstance(): any {
    return this._instance;
  }

  /**
   * Called to notify the instance renderer that its associated instance was removed from
   * the scene. The object should be removed from the container: This is what
   * the default implementation of the method does.
   */
  onRemovedFromScene() {
    this._wasDestroyed = true;
    if (this._threeObject !== null) {
      this._layerGroup.remove(this._threeObject);
      if (this._threeGroup) this._threeGroup.remove(this._threeObject);
    }
  }

  getOriginX(): any {
    return 0;
  }

  getOriginY(): any {
    return 0;
  }

  getOriginZ(): any {
    return 0;
  }

  getCenterX(): any {
    return this.getWidth() / 2;
  }

  getCenterY(): any {
    return this.getHeight() / 2;
  }

  getCenterZ(): any {
    return this.getDepth() / 2;
  }

  getCustomWidth(): number {
    return this._instance.getCustomWidth();
  }

  getCustomHeight(): number {
    return this._instance.getCustomHeight();
  }

  getCustomDepth(): number {
    return this._instance.getCustomDepth();
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
    // For compatibility, a custom depth can be used, without necessarily a custom width/height.
    return this._instance.hasCustomDepth()
      ? this.getCustomDepth()
      : this.getDefaultDepth();
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
    // For now the editor uses the unrotated bounds as a stable approximation for 3D instances.
    // This keeps selection/handles functional until a full oriented 3D bounds path is introduced.
    return this.getUnrotatedInstanceAABB();
  }

  /**
   * Return the width of the instance when the instance doesn't have a custom size.
   */
  getDefaultWidth(): any {
    return 32;
  }

  /**
   * Return the height of the instance when the instance doesn't have a custom size.
   */
  getDefaultHeight(): any {
    return 32;
  }

  /**
   * Return the depth of the instance when the instance doesn't have a custom size.
   */
  getDefaultDepth(): any {
    return 32;
  }

  getPropertyOverridings(): Map<string, string> | null {
    return this._getPropertyOverridings && this._getPropertyOverridings();
  }
}
