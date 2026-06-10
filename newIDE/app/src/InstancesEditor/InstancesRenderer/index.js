// @flow
import LayerRenderer from './LayerRenderer';
import ViewPosition from '../ViewPosition';
import * as PIXI from 'pixi.js';
import { rgbToHexNumber } from '../../Utils/ColorTransformer';
import Rectangle from '../../Utils/Rectangle';
import {
  type BasicProfilingCounters,
  makeBasicProfilingCounters,
  mergeBasicProfilingCounters,
  resetBasicProfilingCounters,
  increasePixiRenderingTime,
  increaseThreeRenderingTime,
  increasePixiUiRenderingTime,
} from './BasicProfilingCounters';

export type InstanceMeasurer = {|
  getInstanceAABB: (gdInitialInstance, Rectangle) => Rectangle,
  getUnrotatedInstanceAABB: (gdInitialInstance, Rectangle) => Rectangle,
  getUnrotatedInstanceSize: gdInitialInstance => [number, number, number],
|};

export default class InstancesRenderer {
  project: gdProject;
  instances: gdInitialInstancesContainer;
  layout: gdLayout | null;
  layersContainer: gdLayersContainer;
  globalObjectsContainer: gdObjectsContainer | null;
  objectsContainer: gdObjectsContainer | null;
  viewPosition: ViewPosition;
  onInstanceClicked: gdInitialInstance => void;
  onInstanceRightClicked: ({|
    offsetX: number,
    offsetY: number,
    x: number,
    y: number,
  |}) => void;
  _showObjectInstancesIn3D: boolean;
  onInstanceDoubleClicked: gdInitialInstance => void;
  onOverInstance: gdInitialInstance => void;
  onOutInstance: gdInitialInstance => void;
  onMoveInstance: (gdInitialInstance, number, number) => void;
  onMoveInstanceEnd: void => void;
  onDownInstance: (gdInitialInstance, number, number) => void;
  onUpInstance: (gdInitialInstance, number, number) => void;

  layersRenderers: { [string]: LayerRenderer };

  /**
   * This container contains all the layers.
   * Layers are rendered one by one.
   * But, as only the last rendered container is used for interactions,
   * all layers are included in the last render call with an opacity of 0.
   */
  // $FlowFixMe[value-as-type]
  pixiContainer: PIXI.Container;

  temporaryRectangle: Rectangle;
  instanceMeasurer: InstanceMeasurer;

  // $FlowFixMe[missing-local-annot]
  _basicProfilingCounters = (makeBasicProfilingCounters(): BasicProfilingCounters);

  constructor({
    project,
    layersContainer,
    globalObjectsContainer,
    objectsContainer,
    layout,
    instances,
    viewPosition,
    onInstanceClicked,
    onInstanceRightClicked,
    onInstanceDoubleClicked,
    onOverInstance,
    onOutInstance,
    onMoveInstance,
    onMoveInstanceEnd,
    onDownInstance,
    onUpInstance,
    showObjectInstancesIn3D,
  }: {|
    project: gdProject,
    instances: gdInitialInstancesContainer,
    layersContainer: gdLayersContainer,
    globalObjectsContainer: gdObjectsContainer | null,
    objectsContainer: gdObjectsContainer,
    layout: gdLayout | null,
    viewPosition: ViewPosition,
    onInstanceClicked: gdInitialInstance => void,
    onInstanceRightClicked: ({|
      offsetX: number,
      offsetY: number,
      x: number,
      y: number,
    |}) => void,
    onInstanceDoubleClicked: gdInitialInstance => void,
    onOverInstance: gdInitialInstance => void,
    onOutInstance: gdInitialInstance => void,
    onMoveInstance: (gdInitialInstance, number, number) => void,
    onMoveInstanceEnd: void => void,
    onDownInstance: (gdInitialInstance, number, number) => void,
    onUpInstance: (gdInitialInstance, number, number) => void,
    showObjectInstancesIn3D: boolean,
  |}) {
    this.project = project;
    this.globalObjectsContainer = globalObjectsContainer;
    this.instances = instances;
    this.layout = layout;
    this.layersContainer = layersContainer;
    this.objectsContainer = objectsContainer;
    this.viewPosition = viewPosition;
    this.onInstanceClicked = onInstanceClicked;
    this.onInstanceRightClicked = onInstanceRightClicked;
    this.onInstanceDoubleClicked = onInstanceDoubleClicked;
    this.onOverInstance = onOverInstance;
    this.onOutInstance = onOutInstance;
    this.onMoveInstance = onMoveInstance;
    this.onMoveInstanceEnd = onMoveInstanceEnd;
    this.onDownInstance = onDownInstance;
    this.onUpInstance = onUpInstance;

    this._showObjectInstancesIn3D = showObjectInstancesIn3D;
    this.layersRenderers = {};

    // This container is only used for user interactions.
    // Its content is not actually displayed.
    // TODO (3D) Check that it doesn't make the rendering slower.
    // TODO (3D) Should this container be used for the 2d editor
    //           instead of rendering layer one by one?
    // TODO (3D) Should this container be used instead of THREE
    //           when the scene is zoomed out?
    this.pixiContainer = new PIXI.Container();
    this.pixiContainer.alpha = 0;

    this.temporaryRectangle = new Rectangle();
    // TODO extract this to a class to have type checking (maybe rethink it)
    this.instanceMeasurer = {
      getInstanceAABB: (instance, bounds) => {
        const layerName = instance.getLayer();
        const layerRenderer = this.layersRenderers[layerName];
        if (!layerRenderer) {
          bounds.left = instance.getX();
          bounds.top = instance.getY();
          bounds.right = instance.getX();
          bounds.bottom = instance.getY();
          bounds.zMin = 0;
          bounds.zMax = 0;

          return bounds;
        }

        return layerRenderer.getInstanceAABB(instance, bounds);
      },
      getUnrotatedInstanceAABB: (instance, bounds) => {
        const layerName = instance.getLayer();
        const layerRenderer = this.layersRenderers[layerName];
        if (!layerRenderer) {
          bounds.left = instance.getX();
          bounds.top = instance.getY();
          bounds.right = instance.getX();
          bounds.bottom = instance.getY();
          bounds.zMin = 0;
          bounds.zMax = 0;

          return bounds;
        }

        return layerRenderer.getUnrotatedInstanceAABB(instance, bounds);
      },
      getUnrotatedInstanceSize: instance => {
        const layerName = instance.getLayer();
        const layerRenderer = this.layersRenderers[layerName];
        if (!layerRenderer) {
          return [0, 0, 0];
        }

        return layerRenderer.getUnrotatedInstanceSize(instance);
      },
    };
  }

  getPixiContainer(): any {
    return this.pixiContainer;
  }

  getInstanceMeasurer(): any {
    return this.instanceMeasurer;
  }

  getBasicProfilingCounters(): BasicProfilingCounters {
    return this._basicProfilingCounters;
  }

  render(
    // $FlowFixMe[value-as-type]
    pixiRenderer: PIXI.Renderer,
    // $FlowFixMe[value-as-type]
    threeRenderer: any | null,
    viewPosition: ViewPosition,
    // $FlowFixMe[value-as-type]
    uiPixiContainer: PIXI.Container,
    // $FlowFixMe[value-as-type]
    backgroundPixiContainer: PIXI.Container
  ) {
    resetBasicProfilingCounters(this._basicProfilingCounters);

    // Reset renderer states for the very first frame when available.
    if (threeRenderer) {
      threeRenderer.resetState && threeRenderer.resetState();
      pixiRenderer.resetState();
    }

    const { layout } = this;

    const backgroundColorRed = layout ? layout.getBackgroundColorRed() : 0x88;
    const backgroundColorGreen = layout
      ? layout.getBackgroundColorGreen()
      : 0x88;
    const backgroundColorBlue = layout ? layout.getBackgroundColorBlue() : 0x88;
    const backgroundColor = rgbToHexNumber(
      backgroundColorRed,
      backgroundColorGreen,
      backgroundColorBlue
    );

    const clearColor = [
      backgroundColorRed / 255,
      backgroundColorGreen / 255,
      backgroundColorBlue / 255,
      1,
    ];

    // Render the background color.
    pixiRenderer.background.color = backgroundColor;
    pixiRenderer.background.alpha = 1;
    pixiRenderer.render({
      container: backgroundPixiContainer,
      clear: true,
      clearColor,
    });

    for (let i = 0; i < this.layersContainer.getLayersCount(); i++) {
      const layer = this.layersContainer.getLayerAt(i);
      const layerName = layer.getName();

      let layerRenderer = this.layersRenderers[layerName];
      if (!layerRenderer) {
        this.layersRenderers[layerName] = layerRenderer = new LayerRenderer({
          project: this.project,
          globalObjectsContainer: this.globalObjectsContainer,
          objectsContainer: this.objectsContainer,
          instances: this.instances,
          viewPosition: this.viewPosition,
          layer: layer,
          onInstanceClicked: this.onInstanceClicked,
          onInstanceRightClicked: this.onInstanceRightClicked,
          onInstanceDoubleClicked: this.onInstanceDoubleClicked,
          onOverInstance: this.onOverInstance,
          onOutInstance: this.onOutInstance,
          onMoveInstance: this.onMoveInstance,
          onMoveInstanceEnd: this.onMoveInstanceEnd,
          onDownInstance: this.onDownInstance,
          onUpInstance: this.onUpInstance,
          pixiRenderer: pixiRenderer,
          showObjectInstancesIn3D: this._showObjectInstancesIn3D,
        });
        this.pixiContainer.addChild(layerRenderer.getPixiContainer());
      }

      // /!\ Objects representing layers can be deleted at any moment and replaced
      // by new one, for example when two layers are swapped.
      // We update the layer object of the renderer so that the renderer always has
      // a valid layer object that can be used.
      layerRenderer.layer = layer;
      layerRenderer.wasUsed = true;
      layerRenderer.getPixiContainer().zOrder = i;
      layerRenderer.render();
      mergeBasicProfilingCounters(
        this._basicProfilingCounters,
        layerRenderer.getBasicProfilingCounters()
      );

      const layerContainer = layerRenderer.getPixiContainer();
      viewPosition.applyTransformationToPixi(layerContainer);

      const threeCamera = layerRenderer.getThreeCamera();
      const threePlaneMesh = layerRenderer.getThreePlaneMesh();
      if (threeCamera) {
        viewPosition.applyTransformationToThree(threeCamera, threePlaneMesh);
        threeCamera.fov = layer.getCamera3DFieldOfView();
      }

      const threeScene = layerRenderer.getThreeScene();

      if (!threeRenderer || !threeScene || !threeCamera) {
        // Render a layer with 2D rendering (PixiJS) only.
        const time = performance.now();
        pixiRenderer.render({ container: layerContainer, clear: false });
        increasePixiRenderingTime(
          this._basicProfilingCounters,
          performance.now() - time
        );
      } else {
        layerRenderer.renderOnPixiRenderTexture(pixiRenderer);
        layerRenderer.updateThreePlaneTextureFromPixiRenderTexture(
          threeRenderer,
          pixiRenderer
        );

        pixiRenderer.resetState();
        threeRenderer.resetState && threeRenderer.resetState();

        // Clear the depth as each layer is independent and display on top of the previous one,
        // even 3D objects.
        threeRenderer.clearDepth();

        const threeStartTime = performance.now();
        threeRenderer.render(threeScene, threeCamera);
        increaseThreeRenderingTime(
          this._basicProfilingCounters,
          performance.now() - threeStartTime
        );
      }
    }
    this._updatePixiObjectsZOrder();
    this._cleanUnusedLayerRenderers();

    if (threeRenderer) {
      // Ensure the state is clean for PixiJS to render.
      threeRenderer.resetState && threeRenderer.resetState();
      pixiRenderer.resetState();
    }

    const time = performance.now();
    pixiRenderer.render({ container: uiPixiContainer, clear: false });
    increasePixiUiRenderingTime(
      this._basicProfilingCounters,
      performance.now() - time
    );

    if (threeRenderer) {
      // Ensure the 3D rendering starts from a clean renderer state.
      pixiRenderer.resetState();
      threeRenderer.resetState && threeRenderer.resetState();
    }
  }

  _updatePixiObjectsZOrder() {
    this.pixiContainer.children.sort((a, b) => {
      a.zOrder = a.zOrder || 0;
      b.zOrder = b.zOrder || 0;
      return a.zOrder - b.zOrder;
    });
  }

  /**
   * Delete instance renderers of the specified objects, which will then be recreated during
   * the next render.
   * @param {string} objectName The name of the object for which instance must be re-rendered.
   */
  resetInstanceRenderersFor(objectName: string) {
    for (let i in this.layersRenderers) {
      if (this.layersRenderers.hasOwnProperty(i)) {
        const layerRenderer = this.layersRenderers[i];
        layerRenderer.resetInstanceRenderersFor(objectName);
      }
    }
  }

  getRendererOfInstance(layerName: string, instance: gdInitialInstance): any {
    if (!this.layersRenderers.hasOwnProperty(layerName)) {
      return null;
    }
    const layerRenderer = this.layersRenderers[layerName];
    return layerRenderer.getRendererOfInstance(instance);
  }

  /**
   * Clean up rendered layers that are not existing anymore
   */
  _cleanUnusedLayerRenderers() {
    for (let i in this.layersRenderers) {
      if (this.layersRenderers.hasOwnProperty(i)) {
        const layerRenderer = this.layersRenderers[i];
        if (!layerRenderer.wasUsed) {
          layerRenderer.delete();
          delete this.layersRenderers[i];
        } else layerRenderer.wasUsed = false;
      }
    }
  }

  delete() {
    // Destroy the layers first.
    for (let i in this.layersRenderers) {
      if (this.layersRenderers.hasOwnProperty(i)) {
        this.layersRenderers[i].delete();
      }
    }
    this.pixiContainer.destroy();
  }
}
