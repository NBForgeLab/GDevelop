// @flow
import RenderedInstance from './RenderedInstance';
import ThreeResourcesLoader from '../../ObjectsRendering/ThreeResourcesLoader';
import ResourcesLoader from '../../ResourcesLoader';
import * as THREE from 'three';
const gd: libGDevelop = global.gd;

const sharedGeometry = new THREE.PlaneGeometry(1, 1);
sharedGeometry.translate(0.5, -0.5, 0);

/**
 * Renderer for gd.SpriteObject using Three.js.
 */
export default class RenderedSpriteInstance extends RenderedInstance {
  _renderedAnimation: number;
  _renderedDirection: number;
  _centerX: number;
  _centerY: number;
  _originX: number;
  _originY: number;
  _sprite: ?gdSprite = null;
  _shouldNotRotate: boolean = false;
  _preScale = 1;
  _currentThreeTexture: THREE.Texture | null = null;

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

    this._renderedAnimation = 0;
    this._renderedDirection = 0;
    this._centerX = 0;
    this._centerY = 0;
    this._originX = 0;
    this._originY = 0;

    const material = new THREE.MeshBasicMaterial({
      map: this._resourcesLoader.getInvalidThreeTexture(),
      color: 0xffffff,
      transparent: true,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this._threeObject = new THREE.Mesh(sharedGeometry, material);
    this._threeObject.userData.instance = instance;
    this._threeObject.rotation.order = 'ZYX';
    this._layerGroup.add(this._threeObject);
    this.updateThreeTextureAndSprite();
  }

  onRemovedFromScene(): void {
    if (this._threeObject) {
      this._layerGroup.remove(this._threeObject);
      if (this._threeObject.material) this._threeObject.material.dispose();
      this._threeObject.userData.instance = null;
      this._threeObject = null;
    }
    this._wasDestroyed = true;
  }

  static getThumbnail(
    project: gdProject,
    resourcesLoader: Class<ResourcesLoader>,
    objectConfiguration: gdObjectConfiguration
  ): string {
    const spriteConfiguration = gd.asSpriteConfiguration(objectConfiguration);
    const animations = spriteConfiguration.getAnimations();

    if (
      animations.getAnimationsCount() > 0 &&
      animations.getAnimation(0).getDirectionsCount() > 0 &&
      animations
        .getAnimation(0)
        .getDirection(0)
        .getSpritesCount() > 0
    ) {
      const imageName = animations
        .getAnimation(0)
        .getDirection(0)
        .getSprite(0)
        .getImageName();
      return resourcesLoader.getResourceFullUrl(project, imageName, {});
    }

    return 'res/unknown32.png';
  }

  updateThreeObject(): void {
    if (!this._threeObject) return;

    const image = this._currentThreeTexture && this._currentThreeTexture.image;
    const textureWidth = image && image.width ? image.width : 32;
    const textureHeight = image && image.height ? image.height : 32;

    const scaleX = this._instance.hasCustomSize()
      ? this.getCustomWidth() / Math.max(1, textureWidth)
      : this._preScale;
    const scaleY = this._instance.hasCustomSize()
      ? this.getCustomHeight() / Math.max(1, textureHeight)
      : this._preScale;

    this._threeObject.scale.set(
      Math.abs(scaleX) * (this._instance.isFlippedX() ? -1 : 1),
      Math.abs(scaleY) * (this._instance.isFlippedY() ? -1 : 1),
      1
    );
    this._threeObject.rotation.z = this._shouldNotRotate
      ? 0
      : -RenderedInstance.toRad(this._instance.getAngle());
    this._threeObject.position.x =
      this._instance.getX() +
      (this._centerX - this._originX) * Math.abs(scaleX);
    this._threeObject.position.y =
      this._instance.getY() +
      (this._originY - this._centerY) * Math.abs(scaleY);
    this._threeObject.position.z = this._instance.getZ();

    const alphaForDisplay = Math.max(this._instance.getOpacity() / 255, 0.5);
    this._threeObject.material.opacity = alphaForDisplay;
    this._threeObject.material.transparent = true;
  }

  updateSprite(): boolean {
    this._sprite = null;
    this._shouldNotRotate = false;

    const spriteConfiguration = gd.asSpriteConfiguration(
      this._associatedObjectConfiguration
    );
    this._preScale = spriteConfiguration.getPreScale();
    const animations = spriteConfiguration.getAnimations();
    if (animations.hasNoAnimations()) return false;

    this._renderedAnimation = this._instance.getRawDoubleProperty('animation');
    if (this._renderedAnimation >= animations.getAnimationsCount())
      this._renderedAnimation = 0;

    const animation = animations.getAnimation(this._renderedAnimation);
    if (animation.hasNoDirections()) return false;

    this._renderedDirection = 0;
    if (animation.useMultipleDirections()) {
      let normalizedAngle = Math.floor(this._instance.getAngle()) % 360;
      if (normalizedAngle < 0) normalizedAngle += 360;

      this._renderedDirection = Math.round(normalizedAngle / 45) % 8;
    }

    if (this._renderedDirection >= animation.getDirectionsCount())
      this._renderedDirection = 0;

    const direction = animation.getDirection(this._renderedDirection);
    if (direction.getSpritesCount() === 0) return false;

    this._shouldNotRotate = animation.useMultipleDirections();
    this._sprite = direction.getSprite(0);
    return true;
  }

  updateThreeTextureAndSprite(): void {
    if (!this._threeObject) return;

    this.updateSprite();
    const sprite = this._sprite;
    if (!sprite) {
      this._currentThreeTexture = this._resourcesLoader.getInvalidThreeTexture();
      this._threeObject.material.map = this._currentThreeTexture;
      this._threeObject.material.needsUpdate = true;
      this.updateThreeObject();
      return;
    }

    this._resourcesLoader
      .getThreeTexture(this._project, sprite.getImageName())
      .then(texture => {
        if (this._wasDestroyed || !this._threeObject) return;

        this._currentThreeTexture = texture;
        this._threeObject.material.map = texture;
        this._threeObject.material.needsUpdate = true;

        const origin = sprite.getOrigin();
        this._originX = origin.getX();
        this._originY = origin.getY();

        const image = texture.image;
        const textureWidth = image && image.width ? image.width : 32;
        const textureHeight = image && image.height ? image.height : 32;

        if (sprite.isDefaultCenterPoint()) {
          this._centerX = textureWidth / 2;
          this._centerY = textureHeight / 2;
        } else {
          const center = sprite.getCenter();
          this._centerX = center.getX();
          this._centerY = center.getY();
        }

        this.updateThreeObject();
      });
  }

  update(): void {
    if (!this._threeObject) return;

    const animation = this._instance.getRawDoubleProperty('animation');
    if (this._renderedAnimation !== animation) {
      this.updateThreeTextureAndSprite();
      return;
    }

    this.updateThreeObject();
  }

  getOriginX(): number {
    const image = this._currentThreeTexture && this._currentThreeTexture.image;
    const textureWidth = image && image.width ? image.width : 32;
    const scaleX = this._instance.hasCustomSize()
      ? this.getCustomWidth() / Math.max(1, textureWidth)
      : this._preScale;
    return this._originX * Math.abs(scaleX);
  }

  getOriginY(): number {
    const image = this._currentThreeTexture && this._currentThreeTexture.image;
    const textureHeight = image && image.height ? image.height : 32;
    const scaleY = this._instance.hasCustomSize()
      ? this.getCustomHeight() / Math.max(1, textureHeight)
      : this._preScale;
    return this._originY * Math.abs(scaleY);
  }

  getDefaultWidth(): number {
    const image = this._currentThreeTexture && this._currentThreeTexture.image;
    const width = image && image.width ? image.width : 32;
    return Math.abs(width) * this._preScale;
  }

  getDefaultHeight(): number {
    const image = this._currentThreeTexture && this._currentThreeTexture.image;
    const height = image && image.height ? image.height : 32;
    return Math.abs(height) * this._preScale;
  }

  getCenterX(): number {
    const image = this._currentThreeTexture && this._currentThreeTexture.image;
    const textureWidth = image && image.width ? image.width : 32;
    const scaleX = this._instance.hasCustomSize()
      ? this.getCustomWidth() / Math.max(1, textureWidth)
      : this._preScale;
    return this._centerX * Math.abs(scaleX);
  }

  getCenterY(): number {
    const image = this._currentThreeTexture && this._currentThreeTexture.image;
    const textureHeight = image && image.height ? image.height : 32;
    const scaleY = this._instance.hasCustomSize()
      ? this.getCustomHeight() / Math.max(1, textureHeight)
      : this._preScale;
    return this._centerY * Math.abs(scaleY);
  }
}
