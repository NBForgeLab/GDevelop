// @flow
import RenderedInstance from './RenderedInstance';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import * as THREE from 'three';
const gd: libGDevelop = global.gd;

/**
 * Renderer for gd.PanelSpriteObject
 */
export default class RenderedPanelSpriteInstance extends RenderedInstance {
  _textureName: string;
  _width: number;
  _height: number;
  _tiled: boolean;
  _leftMargin: number;
  _topMargin: number;
  _rightMargin: number;
  _bottomMargin: number;
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

    const panelSprite = gd.asPanelSpriteConfiguration(
      this._associatedObjectConfiguration
    );
    this._textureName = panelSprite.getTexture();

    // Setup the THREE object: Single dummy plane for now
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

  update() {
    const panelSprite = gd.asPanelSpriteConfiguration(
      this._associatedObjectConfiguration
    );

    let needsTextureUpdate = false;
    if (panelSprite.getTexture() !== this._textureName) {
      this._textureName = panelSprite.getTexture();
      needsTextureUpdate = true;
    }

    if (needsTextureUpdate) {
      this.updateTexture();
    } else {
      this.updateMesh();
    }
  }

  updateTexture() {
    if (!this._threeObject) return;

    this._resourcesLoader
      .getThreeTexture(this._project, this._textureName)
      .then(threeTexture => {
        if (this._wasDestroyed || !this._threeObject) return;

        this._currentThreeTexture = threeTexture;
        this._threeObject.material.map = threeTexture;
        this._threeObject.material.needsUpdate = true;

        this.updateMesh();
      });
  }

  updateMesh() {
    if (!this._threeObject) return;

    const panelSprite = gd.asPanelSpriteConfiguration(
      this._associatedObjectConfiguration
    );

    this._width = this._instance.hasCustomSize()
      ? this.getCustomWidth()
      : panelSprite.getWidth();
    this._height = this._instance.hasCustomSize()
      ? this.getCustomHeight()
      : panelSprite.getHeight();

    // Scale to size
    this._threeObject.scale.set(this._width, this._height, 1);

    // Position
    this._threeObject.position.x = this._instance.getX();
    this._threeObject.position.y = this._instance.getY();

    // Rotate around the panel center while preserving a top-left logical origin.

    // Position it at the center of the panel
    this._threeObject.position.x = this._instance.getX() + this._width / 2;
    this._threeObject.position.y = this._instance.getY() + this._height / 2;

    this._threeObject.rotation.z = RenderedInstance.toRad(
      this._instance.getAngle()
    );

    const alphaForDisplay = Math.max(this._instance.getOpacity() / 255, 0.5);
    this._threeObject.material.opacity = alphaForDisplay;
    this._threeObject.material.transparent =
      alphaForDisplay < 1.0 ||
      (this._currentThreeTexture &&
        this._currentThreeTexture.format === THREE.RGBAFormat);
  }

  static getThumbnail(
    project: gdProject,
    resourcesLoader: Class<ThreeResourcesLoader>,
    objectConfiguration: gdObjectConfiguration
  ): any {
    const panelSprite = gd.asPanelSpriteConfiguration(objectConfiguration);

    return resourcesLoader.getResourceFullUrl(
      project,
      panelSprite.getTexture(),
      {}
    );
  }

  getDefaultWidth(): any {
    const panelSprite = gd.asPanelSpriteConfiguration(
      this._associatedObjectConfiguration
    );
    return panelSprite.getWidth();
  }

  getDefaultHeight(): any {
    const panelSprite = gd.asPanelSpriteConfiguration(
      this._associatedObjectConfiguration
    );
    return panelSprite.getHeight();
  }
}
