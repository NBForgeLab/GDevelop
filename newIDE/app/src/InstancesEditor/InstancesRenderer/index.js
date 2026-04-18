// @flow
import LayerRenderer from './LayerRenderer';
import ViewPosition from '../ViewPosition';
import * as THREE from 'three';
import { rgbToHexNumber } from '../../Utils/ColorTransformer';
import Rectangle from '../../Utils/Rectangle';
import {
  getLayerRenderingType,
  getLayerVisibility,
  isLayerLocked,
} from '../../LayersList/LayerRenderingType';
import {
  type BasicProfilingCounters,
  makeBasicProfilingCounters,
  mergeBasicProfilingCounters,
  resetBasicProfilingCounters,
  increaseThreeRenderingTime,
  increaseUiRenderingTime,
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
  pixiOverlayRenderer: any;

  layersRenderers: { [string]: LayerRenderer };
  layersGroup: THREE.Group = new THREE.Group();
  temporaryRectangle: Rectangle = new Rectangle();
  instanceMeasurer: InstanceMeasurer;

  // Reusable rendering objects to avoid GC pressure (High Performance)
  _uiCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
    0,
    1,
    0,
    1,
    -1000,
    1000
  );
  _bgCamera: THREE.OrthographicCamera = new THREE.OrthographicCamera(
    -1,
    1,
    1,
    -1,
    0,
    1
  );
  _uiScene: THREE.Scene = new THREE.Scene();
  _bgScene: THREE.Scene = new THREE.Scene();

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
    pixiOverlayRenderer,
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
    pixiOverlayRenderer: any,
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
    this.pixiOverlayRenderer = pixiOverlayRenderer;

    this._showObjectInstancesIn3D = showObjectInstancesIn3D;
    this.layersRenderers = {};

    this.instanceMeasurer = {
      getInstanceAABB: (instance, bounds) => {
        const layer = this.layersContainer.getLayer(instance.getLayer());
        if (
          layer &&
          getLayerRenderingType(layer) === '2d' &&
          this.pixiOverlayRenderer
        ) {
          const pixiBounds = this.pixiOverlayRenderer.getInstanceAABB(
            instance,
            bounds
          );
          if (pixiBounds) return pixiBounds;
        }
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
        const layer = this.layersContainer.getLayer(instance.getLayer());
        if (
          layer &&
          getLayerRenderingType(layer) === '2d' &&
          this.pixiOverlayRenderer
        ) {
          const pixiBounds = this.pixiOverlayRenderer.getUnrotatedInstanceAABB(
            instance,
            bounds
          );
          if (pixiBounds) return pixiBounds;
        }
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
        const layer = this.layersContainer.getLayer(instance.getLayer());
        if (
          layer &&
          getLayerRenderingType(layer) === '2d' &&
          this.pixiOverlayRenderer
        ) {
          const pixiSize = this.pixiOverlayRenderer.getUnrotatedInstanceSize(
            instance
          );
          if (pixiSize) return pixiSize;
        }
        const layerName = instance.getLayer();
        const layerRenderer = this.layersRenderers[layerName];
        if (!layerRenderer) return [0, 0, 0];
        return layerRenderer.getUnrotatedInstanceSize(instance);
      },
    };
  }

  getThreeGroup(): THREE.Group {
    return this.layersGroup;
  }

  getInstanceMeasurer(): InstanceMeasurer {
    return this.instanceMeasurer;
  }

  getBasicProfilingCounters(): BasicProfilingCounters {
    return this._basicProfilingCounters;
  }

  render(
    renderer: THREE.WebGLRenderer,
    viewPosition: ViewPosition,
    uiGroup: THREE.Group,
    backgroundGroup: THREE.Group,
    renderThreeScene: boolean = true
  ) {
    resetBasicProfilingCounters(this._basicProfilingCounters);

    if (renderer) {
      renderer.resetState();
    }

    const { layout } = this;
    const backgroundColor =
      renderThreeScene && layout
        ? rgbToHexNumber(
            layout.getBackgroundColorRed(),
            layout.getBackgroundColorGreen(),
            layout.getBackgroundColorBlue()
          )
        : 0x000000;

    renderer.setClearColor(backgroundColor, renderThreeScene ? 1 : 0);
    renderer.clear();

    if (renderThreeScene) {
      if (this._bgScene.children[0] !== backgroundGroup) {
        this._bgScene.clear();
        this._bgScene.add(backgroundGroup);
      }
      renderer.render(this._bgScene, this._bgCamera);

      for (let i = 0; i < this.layersContainer.getLayersCount(); i++) {
        const layer = this.layersContainer.getLayerAt(i);
        if (getLayerRenderingType(layer) !== '3d') continue;
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
            renderer: renderer,
            showObjectInstancesIn3D: this._showObjectInstancesIn3D,
          });
          this.layersGroup.add(layerRenderer.getLayerGroup());
        }

        layerRenderer.layer = layer;
        layerRenderer.wasUsed = true;
        layerRenderer.render();
        mergeBasicProfilingCounters(
          this._basicProfilingCounters,
          layerRenderer.getBasicProfilingCounters()
        );

        const threeCamera = layerRenderer.getThreeCamera();
        const threePlaneMesh = layerRenderer.getThreePlaneMesh();
        if (threeCamera && threePlaneMesh) {
          viewPosition.applyTransformationToThree(threeCamera, threePlaneMesh);
          threeCamera.fov = layer.getCamera3DFieldOfView();
        }

        const threeScene = layerRenderer.getThreeScene();
        if (threeScene && threeCamera && renderer) {
          renderer.clearDepth();
          const threeStartTime = performance.now();
          renderer.render(threeScene, threeCamera);
          increaseThreeRenderingTime(
            this._basicProfilingCounters,
            performance.now() - threeStartTime
          );
        }
      }
    }
    this._cleanUnusedLayerRenderers();

    if (renderer) {
      renderer.resetState();
    }

    const time = performance.now();
    if (renderer) {
      const canvasWidth = renderer.domElement.clientWidth;
      const canvasHeight = renderer.domElement.clientHeight;

      // Professional UI Camera setup: match canvas client size
      this._uiCamera.left = 0;
      this._uiCamera.right = canvasWidth;
      this._uiCamera.top = 0;
      this._uiCamera.bottom = canvasHeight;
      this._uiCamera.updateProjectionMatrix();

      if (this._uiScene.children[0] !== uiGroup) {
        this._uiScene.clear();
        this._uiScene.add(uiGroup);
      }
      renderer.clearDepth();
      renderer.render(this._uiScene, this._uiCamera);
    }
    increaseUiRenderingTime(
      this._basicProfilingCounters,
      performance.now() - time
    );
  }

  getInstancesAt(
    canvasX: number,
    canvasY: number,
    renderer: THREE.WebGLRenderer,
    raycaster: THREE.Raycaster
  ): Array<gdInitialInstance> {
    if (this.pixiOverlayRenderer) {
      const pixiInstances = this.pixiOverlayRenderer.getInstancesAt(
        canvasX,
        canvasY,
        this.layersContainer
      );
      if (pixiInstances.length > 0) return pixiInstances;
    }

    const foundInstances = [];
    const width = renderer.domElement.clientWidth;
    const height = renderer.domElement.clientHeight;

    // Normalize coordinates for Three.js raycaster (-1 to +1)
    const mouse = new THREE.Vector2(
      (canvasX / width) * 2 - 1,
      -(canvasY / height) * 2 + 1
    );

    const layersCount = this.layersContainer.getLayersCount();
    for (let i = layersCount - 1; i >= 0; i--) {
      const layer = this.layersContainer.getLayerAt(i);
      if (
        !getLayerVisibility(layer) ||
        isLayerLocked(layer) ||
        getLayerRenderingType(layer) !== '3d'
      )
        continue;

      const layerName = layer.getName();
      const layerRenderer = this.layersRenderers[layerName];
      if (!layerRenderer) continue;

      const camera = layerRenderer.getThreeCamera();
      if (!camera) continue;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(
        layerRenderer.getLayerGroup().children,
        true
      );

      for (const intersect of intersects) {
        let obj = intersect.object;
        while (obj && !obj.userData.instance) {
          obj = obj.parent;
        }
        if (obj && obj.userData.instance) {
          foundInstances.push(obj.userData.instance);
          return foundInstances;
        }
      }
    }
    return foundInstances;
  }

  resetInstanceRenderersFor(objectName: string) {
    for (let i in this.layersRenderers) {
      if (this.layersRenderers.hasOwnProperty(i)) {
        const layerRenderer = this.layersRenderers[i];
        layerRenderer.resetInstanceRenderersFor(objectName);
      }
    }
  }

  getRendererOfInstance(layerName: string, instance: gdInitialInstance): any {
    if (!this.layersRenderers.hasOwnProperty(layerName)) return null;
    const layerRenderer = this.layersRenderers[layerName];
    return layerRenderer.getRendererOfInstance(instance);
  }

  _cleanUnusedLayerRenderers() {
    for (let i in this.layersRenderers) {
      if (this.layersRenderers.hasOwnProperty(i)) {
        const layerRenderer = this.layersRenderers[i];
        if (!layerRenderer.wasUsed) {
          layerRenderer.delete();
          this.layersGroup.remove(layerRenderer.getLayerGroup());
          delete this.layersRenderers[i];
        } else layerRenderer.wasUsed = false;
      }
    }
  }

  delete() {
    for (let i in this.layersRenderers) {
      if (this.layersRenderers.hasOwnProperty(i)) {
        this.layersRenderers[i].delete();
      }
    }
    this.layersGroup.clear();
    this._uiScene.clear();
    this._bgScene.clear();
  }
}
