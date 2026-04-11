// @flow
import RenderedInstance from './RenderedInstance';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import ResourcesLoader from '../../ResourcesLoader';
import * as THREE from 'three';
const gd: libGDevelop = global.gd;

/**
 * Renderer for gd.TiledSpriteObject
 */
export default class RenderedTiledSpriteInstance extends RenderedInstance {
  _texture: string;
  _currentThreeTexture: any = null;

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

    const tiledSprite = gd.asTiledSpriteConfiguration(
      associatedObjectConfiguration
    );
    this._texture = tiledSprite.getTexture();

    // Setup the THREE object
    const geometry = new THREE.PlaneGeometry(1, 1);
    const material = new THREE.MeshBasicMaterial({
      map: this._resourcesLoader.getInvalidThreeTexture(),
      color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this._threeObject = new THREE.Mesh(geometry, material);
    this._threeObject.userData.instance = instance;
    this._threeObject.rotation.order = 'ZYX';
    this._layerGroup.add(this._threeObject);

    this.updateTexture();
  }

  onRemovedFromScene(): void {
    if (this._threeObject) {
      this._layerGroup.remove(this._threeObject);
      if (this._threeObject.material) {
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

  /**
   * Return a URL for thumbnail of the specified object.
   */
  static getThumbnail(
    project: gdProject,
    resourcesLoader: Class<ThreeResourcesLoader>,
    objectConfiguration: gdObjectConfiguration
  ): any {
    const tiledSprite = gd.asTiledSpriteConfiguration(objectConfiguration);

    return ResourcesLoader.getResourceFullUrl(
      project,
      tiledSprite.getTexture(),
      {}
    );
  }

  updateTexture() {
    if (!this._threeObject) return;

    this._resourcesLoader
      .getThreeTexture(this._project, this._texture)
      .then(threeTexture => {
        if (this._wasDestroyed || !this._threeObject) return;

        this._currentThreeTexture = threeTexture;
        // Setup tiling
        threeTexture.wrapS = THREE.RepeatWrapping;
        threeTexture.wrapT = THREE.RepeatWrapping;

        this._threeObject.material.map = threeTexture;
        this._threeObject.material.needsUpdate = true;

        this.updateMesh();
      });
  }

  updateMesh() {
    if (!this._threeObject) return;

    const tiledSprite = gd.asTiledSpriteConfiguration(
      this._associatedObjectConfiguration
    );
    let width = tiledSprite.getWidth();
    let height = tiledSprite.getHeight();

    if (this._instance.hasCustomSize()) {
      width = this.getCustomWidth();
      height = this.getCustomHeight();
    }

    if (this._currentThreeTexture && this._currentThreeTexture.image) {
      this._currentThreeTexture.repeat.set(
        width / this._currentThreeTexture.image.width,
        height / this._currentThreeTexture.image.height
      );
    }

    this._threeObject.scale.set(width, height, 1);
    this._threeObject.position.x = this._instance.getX() + width / 2;
    this._threeObject.position.y = this._instance.getY() + height / 2;
    this._threeObject.rotation.z = -RenderedInstance.toRad(
      this._instance.getAngle()
    );

    const alphaForDisplay = Math.max(this._instance.getOpacity() / 255, 0.5);
    this._threeObject.material.opacity = alphaForDisplay;
    this._threeObject.material.transparent =
      alphaForDisplay < 1.0 ||
      (this._currentThreeTexture &&
        this._currentThreeTexture.format === THREE.RGBAFormat);
  }

  update() {
    const tiledSprite = gd.asTiledSpriteConfiguration(
      this._associatedObjectConfiguration
    );

    if (this._texture !== tiledSprite.getTexture()) {
      this._texture = tiledSprite.getTexture();
      this.updateTexture();
    } else {
      this.updateMesh();
    }
  }

  getDefaultWidth(): any {
    const tiledSprite = gd.asTiledSpriteConfiguration(
      this._associatedObjectConfiguration
    );
    return tiledSprite.getWidth();
  }

  getDefaultHeight(): any {
    const tiledSprite = gd.asTiledSpriteConfiguration(
      this._associatedObjectConfiguration
    );
    return tiledSprite.getHeight();
  }
}
