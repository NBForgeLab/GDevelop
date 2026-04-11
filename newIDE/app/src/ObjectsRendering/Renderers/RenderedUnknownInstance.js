// @flow
import RenderedInstance from './RenderedInstance';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import * as THREE from 'three';

let invalidThreeTexture = null;

const getInvalidThreeTexture = () => {
  if (!invalidThreeTexture) {
    invalidThreeTexture = new THREE.TextureLoader().load(
      'res/invalid_texture.png'
    );
    invalidThreeTexture.magFilter = THREE.NearestFilter;
    invalidThreeTexture.minFilter = THREE.NearestFilter;
    invalidThreeTexture.colorSpace = THREE.SRGBColorSpace;
  }
  return invalidThreeTexture;
};

/**
 * Objects with an unknown type are rendered with a placeholder rectangle.
 */
export default class RenderedUnknownInstance extends RenderedInstance {
  constructor(
    project: gdProject,
    instance: gdInitialInstance,
    associatedObjectConfiguration: gdObjectConfiguration | null,
    // $FlowFixMe[value-as-type]
    threeGroup: THREE.Group,
    resourcesLoader: Class<ThreeResourcesLoader>
  ) {
    super(
      project,
      instance,
      //$FlowFixMe[incompatible-type] It's ok because RenderedUnknownInstance don't use it.
      associatedObjectConfiguration,
      threeGroup,
      resourcesLoader
    );

    const material = new THREE.SpriteMaterial({
      map: getInvalidThreeTexture(),
      color: 0xffffff,
    });
    this._threeObject = new THREE.Sprite(material);
    this._threeObject.userData.instance = instance;

    this._layerGroup.add(this._threeObject);
  }

  onRemovedFromScene(): void {
    super.onRemovedFromScene(); // This calls child removal logic
    if (this._threeObject && this._threeObject.material) {
      this._threeObject.material.dispose();
    }
    if (this._threeObject) this._threeObject.userData.instance = null;
    this._threeObject = null;
  }

  static getThumbnail(
    project: gdProject,
    resourcesLoader: Class<ThreeResourcesLoader>,
    objectConfiguration: gdObjectConfiguration
  ): any {
    return 'res/unknown32.png';
  }

  update() {
    // Avoid to use _threeObject after destroy is called.
    // It can happen when onRemovedFromScene and update cross each other.
    if (!this._threeObject) {
      return;
    }

    // Three.js sprites use a centered anchor by default, so only position and scale are adjusted.

    // Position
    this._threeObject.position.x = this._instance.getX() + this.getCenterX();
    this._threeObject.position.y = this._instance.getY() + this.getCenterY();

    // Rotation is typically done via material in Sprite
    this._threeObject.material.rotation = -RenderedInstance.toRad(
      this._instance.getAngle()
    );

    // Scale
    const scaleX = this.getWidth() * (this._instance.isFlippedX() ? -1 : 1);
    const scaleY = this.getHeight() * (this._instance.isFlippedY() ? -1 : 1);

    this._threeObject.scale.set(scaleX, scaleY, 1);

    // Alpha - Do not hide completely an object so it can still be manipulated
    const alphaForDisplay = Math.max(this._instance.getOpacity() / 255, 0.5);
    this._threeObject.material.opacity = alphaForDisplay;
    this._threeObject.material.transparent = alphaForDisplay < 1.0;
  }
}
