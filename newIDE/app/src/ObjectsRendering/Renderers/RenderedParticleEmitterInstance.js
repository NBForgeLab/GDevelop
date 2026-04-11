// @flow
import RenderedInstance from './RenderedInstance';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import * as THREE from 'three';
const gd: libGDevelop = global.gd;

/**
 * Renderer for an ParticleEmitter object.
 */
export default class RenderedParticleEmitterInstance extends RenderedInstance {
  _material: any;

  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration,
    // $FlowFixMe[value-as-type]
    threeGroup: THREE.Group,
    resourcesLoader: Class<ThreeResourcesLoader>
  ) {
    super(
      project,
      instance,
      associatedObjectConfiguration,
      threeGroup,
      resourcesLoader
    );

    const texture = new THREE.TextureLoader().load(
      'CppPlatform/Extensions/particleSystemicon.png'
    );
    texture.colorSpace = THREE.SRGBColorSpace;

    const geometry = new THREE.PlaneGeometry(32, 32);

    this._material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this._threeObject = new THREE.Mesh(geometry, this._material);
    this._threeObject.userData.instance = instance;
    this._threeObject.rotation.order = 'ZYX';
    this._layerGroup.add(this._threeObject);
    this.update();
  }

  onRemovedFromScene(): void {
    if (this._threeObject) {
      this._layerGroup.remove(this._threeObject);
      if (this._threeObject.material) {
        if (this._threeObject.material.map)
          this._threeObject.material.map.dispose();
        this._threeObject.material.dispose();
      }
      if (this._threeObject.geometry) {
        this._threeObject.geometry.dispose();
      }
      this._threeObject.userData.instance = null;
      this._threeObject = null;
    }
    this._wasDestroyed = true;
  }

  static getThumbnail(
    project: gdProject,
    resourcesLoader: Class<ThreeResourcesLoader>,
    objectConfiguration: gdObjectConfiguration
  ): any {
    return 'CppPlatform/Extensions/particleSystemicon.png';
  }

  update() {
    if (!this._threeObject) return;
    this._threeObject.position.x = this._instance.getX();
    this._threeObject.position.y = this._instance.getY();
    // Do not hide completely an object so it can still be manipulated
    const alphaForDisplay = Math.max(this._instance.getOpacity() / 255, 0.5);
    this._material.opacity = alphaForDisplay;

    // TODO: implement 3D line primitive drawing for cone approximation
  }

  getDefaultWidth(): any {
    return 128;
  }

  getDefaultHeight(): any {
    return 128;
  }

  getOriginX(): any {
    return 64;
  }

  getOriginY(): any {
    return 64;
  }
}
