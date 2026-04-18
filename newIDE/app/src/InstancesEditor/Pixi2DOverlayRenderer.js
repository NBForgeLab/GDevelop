// @flow
import {
  Application,
  Assets,
  Container,
  Color,
  Graphics,
  Sprite,
  Text,
  Texture,
  TilingSprite,
} from 'pixi.js';
import getObjectByName from '../Utils/GetObjectByName';
import ResourcesLoader from '../ResourcesLoader';
import Rectangle from '../Utils/Rectangle';
import { rgbToHexNumber } from '../Utils/ColorTransformer';
import {
  getLayerAlpha,
  getLayerRenderingType,
  getLayerVisibility,
  isLayerLocked,
} from '../LayersList/LayerRenderingType';

const gd: libGDevelop = global.gd;

type RenderMetrics = {|
  width: number,
  height: number,
  originX: number,
  originY: number,
|};

type CachedInstanceData = {|
  displayObject: Container,
  layerName: string,
  wasUsed: boolean,
  sceneAABB: Rectangle,
  unrotatedSceneAABB: Rectangle,
  unrotatedSize: [number, number, number],
|};

const fallbackTextureSize = 48;
const clampOpacity = (opacity: number) =>
  Math.max(0, Math.min(1, opacity / 255));

const makeMetrics = ({
  width,
  height,
  originX = 0,
  originY = 0,
}: {|
  width: number,
  height: number,
  originX?: number,
  originY?: number,
|}): RenderMetrics => ({
  width: Math.max(1, width),
  height: Math.max(1, height),
  originX,
  originY,
});

export default class Pixi2DOverlayRenderer {
  _app: Application | null = null;
  _worldContainer: Container = new Container();
  _backgroundContainer: Container = new Container();
  _backgroundGraphics: Graphics = new Graphics();
  _gridGraphics: Graphics = new Graphics();
  _centerGuidesGraphics: Graphics = new Graphics();
  _layerContainers: { [string]: Container } = {};
  _instancesByPointer: { [number]: CachedInstanceData } = {};
  _layerInstanceOrder: { [string]: Array<number> } = {};
  _instanceRenderer: gdInitialInstanceJSFunctor;
  _currentLayerName: string = '';
  _currentProject: gdProject | null = null;
  _currentLayout: gdLayout | null = null;
  _currentGlobalObjectsContainer: gdObjectsContainer | null = null;
  _currentObjectsContainer: gdObjectsContainer | null = null;
  _currentViewPosition: any = null;
  _loadedTextures: { [string]: Texture | Promise<Texture> } = {};
  _missingTextureWarnings: Set<string> = new Set();
  _ready: boolean = false;
  _lastBackgroundSignature: string = '';

  _addMissingTexturePlaceholder(
    displayObject: Container,
    width: number,
    height: number,
    originX: number = 0,
    originY: number = 0
  ) {
    const safeWidth = Math.max(1, width);
    const safeHeight = Math.max(1, height);
    const graphics = new Graphics();
    graphics
      .rect(-originX, -originY, safeWidth, safeHeight)
      .fill({ color: 0x413655, alpha: 0.42 })
      .stroke({ color: 0xff4ec7, alpha: 0.95, width: 1.5 })
      .moveTo(-originX, -originY)
      .lineTo(-originX + safeWidth, -originY + safeHeight)
      .moveTo(-originX + safeWidth, -originY)
      .lineTo(-originX, -originY + safeHeight)
      .stroke({ color: 0xff4ec7, alpha: 0.85, width: 1.2 });
    displayObject.addChild(graphics);
  }

  constructor() {
    this._instanceRenderer = new gd.InitialInstanceJSFunctor();
    // $FlowFixMe
    this._instanceRenderer.invoke = instancePtr => {
      const instance = gd.wrapPointer(instancePtr, gd.InitialInstance);
      this._renderInstance(instance);
    };
  }

  async initialize(canvas: HTMLCanvasElement, width: number, height: number) {
    this._app = new Application();
    await this._app.init({
      canvas,
      width: Math.max(1, width),
      height: Math.max(1, height),
      autoStart: false,
      autoDensity: true,
      antialias: true,
      backgroundAlpha: 0,
      clearBeforeRender: true,
    });

    this._app.stage.eventMode = 'none';
    this._app.stage.sortableChildren = true;
    this._worldContainer.sortableChildren = true;
    this._worldContainer.isRenderGroup = true;
    this._backgroundContainer.sortableChildren = true;
    this._backgroundContainer.zIndex = -1000;
    this._backgroundContainer.addChild(this._backgroundGraphics);
    this._backgroundContainer.addChild(this._gridGraphics);
    this._backgroundContainer.addChild(this._centerGuidesGraphics);
    this._app.stage.addChild(this._worldContainer);
    this._worldContainer.addChild(this._backgroundContainer);
    this._ready = true;
  }

  resize(width: number, height: number) {
    if (!this._app) return;
    this._app.renderer.resize(Math.max(1, width), Math.max(1, height));
  }

  render({
    project,
    layout,
    layersContainer,
    globalObjectsContainer,
    objectsContainer,
    instances,
    viewPosition,
  }: {|
    project: gdProject,
    layout: gdLayout | null,
    layersContainer: gdLayersContainer,
    globalObjectsContainer: gdObjectsContainer | null,
    objectsContainer: gdObjectsContainer,
    instances: gdInitialInstancesContainer,
    viewPosition: any,
  |}) {
    if (!this._app || !this._ready) return;

    this._currentProject = project;
    this._currentLayout = layout;
    this._currentGlobalObjectsContainer = globalObjectsContainer;
    this._currentObjectsContainer = objectsContainer;
    this._currentViewPosition = viewPosition;

    const zoom = Math.abs(viewPosition.instancesEditorSettings.zoomFactor) || 1;
    this._worldContainer.scale.set(zoom, zoom);
    this._worldContainer.position.set(
      viewPosition.getWidth() / 2 - viewPosition.getViewX() * zoom,
      viewPosition.getHeight() / 2 - viewPosition.getViewY() * zoom
    );
    this._renderBackgroundGuides(project, layout, viewPosition);

    Object.keys(this._instancesByPointer).forEach(ptr => {
      this._instancesByPointer[ptr].wasUsed = false;
    });
    Object.keys(this._layerInstanceOrder).forEach(layerName => {
      this._layerInstanceOrder[layerName] = [];
    });

    for (let i = 0; i < layersContainer.getLayersCount(); i++) {
      const layer = layersContainer.getLayerAt(i);
      const layerName = layer.getName();
      if (getLayerRenderingType(layer) !== '2d') {
        const layerContainer = this._layerContainers[layerName];
        if (layerContainer) layerContainer.visible = false;
        continue;
      }

      let layerContainer = this._layerContainers[layerName];
      if (!layerContainer) {
        layerContainer = new Container({
          sortableChildren: true,
          isRenderGroup: true,
        });
        this._layerContainers[layerName] = layerContainer;
        this._worldContainer.addChild(layerContainer);
      }

      layerContainer.visible = getLayerVisibility(layer);
      layerContainer.alpha = getLayerAlpha(layer);
      layerContainer.zIndex = i;
      this._currentLayerName = layerName;
      this._layerInstanceOrder[layerName] = [];

      instances.iterateOverInstancesWithZOrdering(
        // $FlowFixMe[incompatible-type]
        this._instanceRenderer,
        layerName
      );
    }

    Object.keys(this._instancesByPointer).forEach(ptr => {
      const cachedInstance = this._instancesByPointer[ptr];
      if (!cachedInstance.wasUsed) {
        if (cachedInstance.displayObject.parent) {
          cachedInstance.displayObject.parent.removeChild(
            cachedInstance.displayObject
          );
        }
        cachedInstance.displayObject.destroy({ children: true });
        delete this._instancesByPointer[ptr];
      }
    });

    this._app.render();
  }

  getInstanceAABB(
    instance: gdInitialInstance,
    bounds: Rectangle
  ): Rectangle | null {
    const cachedInstance = this._instancesByPointer[instance.ptr];
    if (!cachedInstance) return null;
    bounds.setRectangle(cachedInstance.sceneAABB);
    return bounds;
  }

  getUnrotatedInstanceAABB(
    instance: gdInitialInstance,
    bounds: Rectangle
  ): Rectangle | null {
    const cachedInstance = this._instancesByPointer[instance.ptr];
    if (!cachedInstance) return null;
    bounds.setRectangle(cachedInstance.unrotatedSceneAABB);
    return bounds;
  }

  getUnrotatedInstanceSize(
    instance: gdInitialInstance
  ): [number, number, number] | null {
    const cachedInstance = this._instancesByPointer[instance.ptr];
    if (!cachedInstance) return null;
    return cachedInstance.unrotatedSize;
  }

  getInstancesAt(
    canvasX: number,
    canvasY: number,
    layersContainer: gdLayersContainer
  ): Array<gdInitialInstance> {
    const foundInstances = [];

    for (let i = layersContainer.getLayersCount() - 1; i >= 0; i--) {
      const layer = layersContainer.getLayerAt(i);
      const layerName = layer.getName();
      if (
        getLayerRenderingType(layer) !== '2d' ||
        !getLayerVisibility(layer) ||
        isLayerLocked(layer)
      ) {
        continue;
      }

      const instanceOrder = this._layerInstanceOrder[layerName];
      if (!instanceOrder) continue;

      for (let j = instanceOrder.length - 1; j >= 0; j--) {
        const ptr = instanceOrder[j];
        const cachedInstance = this._instancesByPointer[ptr];
        if (!cachedInstance || !cachedInstance.displayObject.visible) continue;
        const globalBounds = cachedInstance.displayObject.getBounds();
        const boundsLeft = globalBounds.x;
        const boundsTop = globalBounds.y;
        const boundsRight = globalBounds.x + globalBounds.width;
        const boundsBottom = globalBounds.y + globalBounds.height;
        if (
          globalBounds.width > 0 &&
          globalBounds.height > 0 &&
          canvasX >= boundsLeft &&
          canvasX <= boundsRight &&
          canvasY >= boundsTop &&
          canvasY <= boundsBottom
        ) {
          // $FlowFixMe[prop-missing]
          foundInstances.push(cachedInstance.displayObject.__gdInstance);
          return foundInstances;
        }
      }
    }

    return foundInstances;
  }

  delete() {
    Object.keys(this._instancesByPointer).forEach(ptr => {
      this._instancesByPointer[ptr].displayObject.destroy({ children: true });
      delete this._instancesByPointer[ptr];
    });
    Object.keys(this._layerContainers).forEach(layerName => {
      this._layerContainers[layerName].destroy({ children: true });
      delete this._layerContainers[layerName];
    });
    this._backgroundGraphics.destroy();
    this._gridGraphics.destroy();
    this._centerGuidesGraphics.destroy();
    if (this._app) {
      this._app.destroy();
      this._app = null;
    }
    this._instanceRenderer.delete();
    this._ready = false;
  }

  _renderInstance(instance: gdInitialInstance) {
    const project = this._currentProject;
    const globalObjectsContainer = this._currentGlobalObjectsContainer;
    const objectsContainer = this._currentObjectsContainer;
    const viewPosition = this._currentViewPosition;
    const layerName = this._currentLayerName;
    if (!project || !objectsContainer || !viewPosition) return;

    const object = getObjectByName(
      globalObjectsContainer,
      objectsContainer,
      instance.getObjectName()
    );
    if (!object) return;

    let cachedInstance = this._instancesByPointer[instance.ptr];
    if (!cachedInstance) {
      const displayObject = new Container({ sortableChildren: true });
      // $FlowFixMe[prop-missing]
      displayObject.__gdInstance = instance;
      cachedInstance = {
        displayObject,
        layerName,
        wasUsed: true,
        sceneAABB: new Rectangle(),
        unrotatedSceneAABB: new Rectangle(),
        unrotatedSize: [0, 0, 0],
      };
      this._instancesByPointer[instance.ptr] = cachedInstance;
    }

    cachedInstance.wasUsed = true;
    cachedInstance.layerName = layerName;
    this._layerInstanceOrder[layerName].push(instance.ptr);

    const layerContainer = this._layerContainers[layerName];
    if (cachedInstance.displayObject.parent !== layerContainer) {
      if (cachedInstance.displayObject.parent) {
        cachedInstance.displayObject.parent.removeChild(
          cachedInstance.displayObject
        );
      }
      layerContainer.addChild(cachedInstance.displayObject);
    }

    cachedInstance.displayObject.removeChildren().forEach(child => {
      child.destroy({ children: true });
    });
    cachedInstance.displayObject.alpha = clampOpacity(instance.getOpacity());
    cachedInstance.displayObject.visible = true;
    cachedInstance.displayObject.zIndex = instance.getZOrder();
    cachedInstance.displayObject.position.set(instance.getX(), instance.getY());
    cachedInstance.displayObject.rotation = 0;
    cachedInstance.displayObject.scale.set(1, 1);

    const metrics = this._renderObjectInstance(
      project,
      object,
      instance,
      cachedInstance.displayObject
    );
    if (!metrics) {
      cachedInstance.displayObject.visible = false;
      cachedInstance.sceneAABB.set(
        0,
        0,
        0,
        0,
        instance.getZ(),
        instance.getZ()
      );
      cachedInstance.unrotatedSceneAABB.set(
        0,
        0,
        0,
        0,
        instance.getZ(),
        instance.getZ()
      );
      cachedInstance.unrotatedSize = [0, 0, 0];
      return;
    }

    const bounds = cachedInstance.displayObject.getBounds();
    const [left, top] = viewPosition.toSceneCoordinates(bounds.x, bounds.y);
    const [right, bottom] = viewPosition.toSceneCoordinates(
      bounds.x + bounds.width,
      bounds.y + bounds.height
    );

    cachedInstance.sceneAABB.set(
      Math.min(left, right),
      Math.min(top, bottom),
      Math.max(left, right),
      Math.max(top, bottom),
      instance.getZ(),
      instance.getZ()
    );
    cachedInstance.unrotatedSceneAABB.set(
      instance.getX() - metrics.originX,
      instance.getY() - metrics.originY,
      instance.getX() - metrics.originX + metrics.width,
      instance.getY() - metrics.originY + metrics.height,
      instance.getZ(),
      instance.getZ()
    );
    cachedInstance.unrotatedSize = [metrics.width, metrics.height, 0];
  }

  _renderObjectInstance(
    project: gdProject,
    object: gdObject,
    instance: gdInitialInstance,
    displayObject: Container
  ): RenderMetrics | null {
    const objectType = object.getType();

    if (objectType === 'Sprite') {
      return this._renderSpriteInstance(
        project,
        object.getConfiguration(),
        instance,
        displayObject
      );
    }

    if (objectType === 'TiledSpriteObject::TiledSprite') {
      return this._renderTiledSpriteInstance(
        project,
        object.getConfiguration(),
        instance,
        displayObject
      );
    }

    if (objectType === 'PanelSpriteObject::PanelSprite') {
      return this._renderPanelSpriteInstance(
        project,
        object.getConfiguration(),
        instance,
        displayObject
      );
    }

    if (objectType === 'TextObject::Text') {
      return this._renderTextInstance(
        object.getConfiguration(),
        instance,
        displayObject
      );
    }

    return null;
  }

  _renderSpriteInstance(
    project: gdProject,
    objectConfiguration: gdObjectConfiguration,
    instance: gdInitialInstance,
    displayObject: Container
  ): RenderMetrics {
    const spriteConfiguration = gd.asSpriteConfiguration(objectConfiguration);
    const animations = spriteConfiguration.getAnimations();
    if (animations.hasNoAnimations()) {
      return null;
    }

    let animationIndex = instance.getRawDoubleProperty('animation');
    if (animationIndex >= animations.getAnimationsCount()) animationIndex = 0;
    const animation = animations.getAnimation(animationIndex);
    if (animation.hasNoDirections()) {
      return null;
    }

    let directionIndex = 0;
    let shouldRotate = true;
    if (animation.useMultipleDirections()) {
      let normalizedAngle = Math.floor(instance.getAngle()) % 360;
      if (normalizedAngle < 0) normalizedAngle += 360;
      directionIndex = Math.round(normalizedAngle / 45) % 8;
      shouldRotate = false;
    }
    if (directionIndex >= animation.getDirectionsCount()) directionIndex = 0;

    const direction = animation.getDirection(directionIndex);
    if (direction.getSpritesCount() === 0) {
      return null;
    }

    const spriteMetadata = direction.getSprite(0);
    const resourceUrl = ResourcesLoader.getResourceFullUrl(
      project,
      spriteMetadata.getImageName(),
      {}
    );
    const texture = this._getLoadedTexture(resourceUrl);
    const preScale = spriteConfiguration.getPreScale();
    const fallbackBaseWidth = fallbackTextureSize;
    const fallbackBaseHeight = fallbackTextureSize;
    const fallbackScaleX = instance.hasCustomSize()
      ? instance.getCustomWidth() / Math.max(1, fallbackBaseWidth)
      : preScale;
    const fallbackScaleY = instance.hasCustomSize()
      ? instance.getCustomHeight() / Math.max(1, fallbackBaseHeight)
      : preScale;
    const fallbackWidth = Math.abs(fallbackBaseWidth * fallbackScaleX);
    const fallbackHeight = Math.abs(fallbackBaseHeight * fallbackScaleY);
    const origin = spriteMetadata.getOrigin();
    const fallbackOriginX = origin.getX() * Math.abs(fallbackScaleX);
    const fallbackOriginY = origin.getY() * Math.abs(fallbackScaleY);

    if (!texture || texture === Texture.EMPTY) {
      this._addMissingTexturePlaceholder(
        displayObject,
        fallbackWidth,
        fallbackHeight,
        fallbackOriginX,
        fallbackOriginY
      );
      if (shouldRotate) {
        displayObject.rotation = (instance.getAngle() / 180) * Math.PI;
      }
      displayObject.scale.set(
        instance.isFlippedX() ? -1 : 1,
        instance.isFlippedY() ? -1 : 1
      );
      return makeMetrics({
        width: fallbackWidth,
        height: fallbackHeight,
        originX: fallbackOriginX,
        originY: fallbackOriginY,
      });
    }

    const textureWidth = texture.width || fallbackTextureSize;
    const textureHeight = texture.height || fallbackTextureSize;
    const scaleX = instance.hasCustomSize()
      ? instance.getCustomWidth() / Math.max(1, textureWidth)
      : preScale;
    const scaleY = instance.hasCustomSize()
      ? instance.getCustomHeight() / Math.max(1, textureHeight)
      : preScale;
    const width = Math.abs(textureWidth * scaleX);
    const height = Math.abs(textureHeight * scaleY);

    const sprite = new Sprite({ texture });
    sprite.anchor.set(
      origin.getX() / Math.max(1, textureWidth),
      origin.getY() / Math.max(1, textureHeight)
    );
    sprite.scale.set(
      Math.abs(scaleX) * (instance.isFlippedX() ? -1 : 1),
      Math.abs(scaleY) * (instance.isFlippedY() ? -1 : 1)
    );
    if (shouldRotate) {
      displayObject.rotation = (instance.getAngle() / 180) * Math.PI;
    }
    displayObject.addChild(sprite);

    return makeMetrics({
      width,
      height,
      originX: origin.getX() * Math.abs(scaleX),
      originY: origin.getY() * Math.abs(scaleY),
    });
  }

  _renderTiledSpriteInstance(
    project: gdProject,
    objectConfiguration: gdObjectConfiguration,
    instance: gdInitialInstance,
    displayObject: Container
  ): RenderMetrics {
    const tiledSpriteConfiguration = gd.asTiledSpriteConfiguration(
      objectConfiguration
    );
    const resourceUrl = ResourcesLoader.getResourceFullUrl(
      project,
      tiledSpriteConfiguration.getTexture(),
      {}
    );
    const texture = this._getLoadedTexture(resourceUrl);
    const width = instance.hasCustomSize()
      ? instance.getCustomWidth()
      : tiledSpriteConfiguration.getWidth();
    const height = instance.hasCustomSize()
      ? instance.getCustomHeight()
      : tiledSpriteConfiguration.getHeight();

    if (!texture || texture === Texture.EMPTY) {
      this._addMissingTexturePlaceholder(displayObject, width, height);
      displayObject.rotation = (instance.getAngle() / 180) * Math.PI;
      return makeMetrics({ width, height });
    }

    const tiledSprite = new TilingSprite({
      texture,
      width,
      height,
    });
    displayObject.rotation = (instance.getAngle() / 180) * Math.PI;
    displayObject.addChild(tiledSprite);
    return makeMetrics({ width, height });
  }

  _renderPanelSpriteInstance(
    project: gdProject,
    objectConfiguration: gdObjectConfiguration,
    instance: gdInitialInstance,
    displayObject: Container
  ): RenderMetrics {
    const panelSpriteConfiguration = gd.asPanelSpriteConfiguration(
      objectConfiguration
    );
    const resourceUrl = ResourcesLoader.getResourceFullUrl(
      project,
      panelSpriteConfiguration.getTexture(),
      {}
    );
    const texture = this._getLoadedTexture(resourceUrl);
    const width = instance.hasCustomSize()
      ? instance.getCustomWidth()
      : panelSpriteConfiguration.getWidth();
    const height = instance.hasCustomSize()
      ? instance.getCustomHeight()
      : panelSpriteConfiguration.getHeight();

    if (!texture || texture === Texture.EMPTY) {
      this._addMissingTexturePlaceholder(displayObject, width, height);
      displayObject.rotation = (instance.getAngle() / 180) * Math.PI;
      return makeMetrics({ width, height });
    }

    const sprite = new Sprite({ texture });
    sprite.width = width;
    sprite.height = height;
    displayObject.rotation = (instance.getAngle() / 180) * Math.PI;
    displayObject.addChild(sprite);
    return makeMetrics({ width, height });
  }

  _renderTextInstance(
    objectConfiguration: gdObjectConfiguration,
    instance: gdInitialInstance,
    displayObject: Container
  ): RenderMetrics {
    const textConfiguration = gd.asTextObjectConfiguration(objectConfiguration);
    const text = new Text({
      text: textConfiguration.getText(),
      style: {
        fontFamily: textConfiguration.getFontName() || 'Arial',
        fontSize: Math.max(1, textConfiguration.getCharacterSize()),
        fill: `rgb(${textConfiguration
          .getColor()
          .split(';')
          .join(',')})`,
        align: textConfiguration.getTextAlignment(),
      },
    });
    const anchorX =
      textConfiguration.getTextAlignment() === 'center'
        ? 0.5
        : textConfiguration.getTextAlignment() === 'right'
        ? 1
        : 0;
    const anchorY =
      textConfiguration.getVerticalTextAlignment() === 'center'
        ? 0.5
        : textConfiguration.getVerticalTextAlignment() === 'bottom'
        ? 1
        : 0;
    text.anchor.set(anchorX, anchorY);
    displayObject.rotation = (instance.getAngle() / 180) * Math.PI;
    displayObject.addChild(text);
    return makeMetrics({
      width: text.width || fallbackTextureSize,
      height: text.height || fallbackTextureSize,
      originX: (text.width || fallbackTextureSize) * anchorX,
      originY: (text.height || fallbackTextureSize) * anchorY,
    });
  }

  _getLoadedTexture(resourceUrl: string): Texture | null {
    if (!resourceUrl) {
      return Texture.EMPTY;
    }

    const cachedTexture = this._loadedTextures[resourceUrl];
    if (!cachedTexture || cachedTexture instanceof Promise) {
      if (!cachedTexture) {
        this._loadedTextures[resourceUrl] = Assets.load({
          src: resourceUrl,
          parser: 'texture',
        })
          .then(texture => {
            this._loadedTextures[resourceUrl] = texture;
            return texture;
          })
          .catch(error => {
            if (!this._missingTextureWarnings.has(resourceUrl)) {
              this._missingTextureWarnings.add(resourceUrl);
              console.warn(
                `Unable to load Pixi texture for 2D overlay (${resourceUrl}).`,
                error
              );
            }
            this._loadedTextures[resourceUrl] = Texture.EMPTY;
            return Texture.EMPTY;
          });
      }
      return null;
    }

    return cachedTexture;
  }

  _renderBackgroundGuides(
    project: gdProject,
    layout: gdLayout | null,
    viewPosition: any
  ) {
    const gameWidth = Math.max(1, project.getGameResolutionWidth());
    const gameHeight = Math.max(1, project.getGameResolutionHeight());
    const backgroundColor = layout
      ? rgbToHexNumber(
          layout.getBackgroundColorRed(),
          layout.getBackgroundColorGreen(),
          layout.getBackgroundColorBlue()
        )
      : 0x1c1c1c;
    const gridSettings = viewPosition.instancesEditorSettings;
    const zoom = Math.max(
      1,
      Math.abs(viewPosition.instancesEditorSettings.zoomFactor)
    );
    const backgroundSignature = JSON.stringify({
      gameWidth,
      gameHeight,
      backgroundColor,
      zoom,
      grid: gridSettings.grid,
      gridWidth: gridSettings.gridWidth,
      gridHeight: gridSettings.gridHeight,
      gridColor: gridSettings.gridColor,
      gridAlpha: gridSettings.gridAlpha,
    });
    if (backgroundSignature === this._lastBackgroundSignature) {
      return;
    }
    this._lastBackgroundSignature = backgroundSignature;

    this._backgroundGraphics.clear();
    this._backgroundGraphics
      .rect(0, 0, gameWidth, gameHeight)
      .fill({ color: backgroundColor, alpha: 1 })
      .stroke({
        color: 0xffffff,
        alpha: 0.18,
        width: 2 / zoom,
      });

    this._gridGraphics.clear();
    if (
      gridSettings.grid &&
      gridSettings.gridWidth > 0 &&
      gridSettings.gridHeight > 0
    ) {
      const gridColor = new Color(gridSettings.gridColor).toNumber();
      const lineWidth = 1 / zoom;

      for (let x = 0; x <= gameWidth; x += gridSettings.gridWidth) {
        this._gridGraphics.moveTo(x, 0).lineTo(x, gameHeight);
      }
      for (let y = 0; y <= gameHeight; y += gridSettings.gridHeight) {
        this._gridGraphics.moveTo(0, y).lineTo(gameWidth, y);
      }

      this._gridGraphics.stroke({
        color: gridColor,
        alpha: Math.min(0.35, Math.max(0.06, gridSettings.gridAlpha * 0.75)),
        width: lineWidth,
      });
    }

    this._centerGuidesGraphics.clear();
    this._centerGuidesGraphics
      .moveTo(gameWidth / 2, 0)
      .lineTo(gameWidth / 2, gameHeight)
      .moveTo(0, gameHeight / 2)
      .lineTo(gameWidth, gameHeight / 2)
      .stroke({
        color: 0xffffff,
        alpha: 0.12,
        width: 1 / zoom,
      });
  }
}
