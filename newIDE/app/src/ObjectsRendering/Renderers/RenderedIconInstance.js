// @flow
import RenderedInstance from './RenderedInstance';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import * as THREE from 'three';

/**
 * Create a renderer for an type of object displayed as an icon
 */
export default function makeRenderer(
  iconPath: string
  // $FlowFixMe[cannot-resolve-name]
): typeof RenderedIconInstance {
  class RenderedIconInstance extends RenderedInstance {
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

      const texture = new THREE.TextureLoader().load(iconPath);
      texture.colorSpace = THREE.SRGBColorSpace;

      const geometry = new THREE.PlaneGeometry(1, 1);
      geometry.translate(0.5, -0.5, 0);
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        transparent: true,
        side: THREE.DoubleSide,
        depthWrite: false,
      });

      this._threeObject = new THREE.Mesh(geometry, material);
      this._threeObject.userData.instance = instance;
      this._threeObject.rotation.order = 'ZYX';
      this._layerGroup.add(this._threeObject);
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

    update() {
      if (!this._threeObject) return;
      this._threeObject.position.x = this._instance.getX();
      this._threeObject.position.y = this._instance.getY();
      this._threeObject.rotation.z = -RenderedInstance.toRad(
        this._instance.getAngle()
      );

      // Icon size
      this._threeObject.scale.set(32, 32, 1);

      // Do not hide completely an object so it can still be manipulated
      const alphaForDisplay = Math.max(this._instance.getOpacity() / 255, 0.5);
      this._threeObject.material.opacity = alphaForDisplay;
    }

    static getThumbnail(
      project: gdProject,
      resourcesLoader: Class<ThreeResourcesLoader>,
      objectConfiguration: gdObjectConfiguration
      // $FlowFixMe[missing-local-annot]
    ) {
      return iconPath;
    }
  }

  return RenderedIconInstance;
}
