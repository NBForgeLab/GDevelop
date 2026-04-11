// @flow
import ObjectsRenderingService from '../../ObjectsRendering/ObjectsRenderingService';
import RenderedInstance from '../../ObjectsRendering/Renderers/RenderedInstance';
import getObjectByName from '../../Utils/GetObjectByName';
import ViewPosition from '../ViewPosition';
import * as THREE from 'three';
import Rectangle from '../../Utils/Rectangle';
import { type Polygon } from '../../Utils/PolygonHelper';
import Rendered3DInstance from '../../ObjectsRendering/Renderers/Rendered3DInstance';
import {
  type BasicProfilingCounters,
  increaseInstanceUpdate,
  makeBasicProfilingCounters,
  resetBasicProfilingCounters,
} from './BasicProfilingCounters';

const gd: libGDevelop = global.gd;

export default class LayerRenderer {
  project: gdProject;
  instances: gdInitialInstancesContainer;
  globalObjectsContainer: gdObjectsContainer | null;
  objectsContainer: gdObjectsContainer | null;
  layer: gdLayer;
  viewPosition: ViewPosition;
  onInstanceClicked: gdInitialInstance => void;
  onInstanceRightClicked: ({|
    offsetX: number,
    offsetY: number,
    x: number,
    y: number,
  |}) => void;
  onInstanceDoubleClicked: gdInitialInstance => void;
  onOverInstance: gdInitialInstance => void;
  onOutInstance: gdInitialInstance => void;
  onMoveInstance: (gdInitialInstance, number, number) => void;
  onMoveInstanceEnd: void => void;
  onDownInstance: (gdInitialInstance, number, number) => void;
  onUpInstance: (gdInitialInstance, number, number) => void;

  viewTopLeft: [number, number];
  viewBottomRight: [number, number];

  renderedInstances: { [number]: RenderedInstance | Rendered3DInstance } = {};
  threeLayerGroup: THREE.Group = new THREE.Group();
  instancesRenderer: gdInitialInstanceJSFunctor;
  wasUsed: boolean = false;

  _temporaryRectangle: Rectangle = new Rectangle();
  _temporaryRectanglePath: Polygon = [[0, 0], [0, 0], [0, 0], [0, 0]];

  _threeScene: THREE.Scene | null = null;
  _threeCamera: THREE.PerspectiveCamera | null = null;
  _threePlaneTexture: THREE.CanvasTexture | null = null; // Used if we were doing 2D-to-3D, simplified for now
  _threePlaneGeometry: THREE.PlaneGeometry | null = null;
  _threePlaneMaterial: THREE.MeshBasicMaterial | null = null;
  _threePlaneMesh: THREE.Mesh | null = null;

  _showObjectInstancesIn3D: boolean;
  _basicProfilingCounters = (makeBasicProfilingCounters(): BasicProfilingCounters);

  constructor({
    project,
    instances,
    globalObjectsContainer,
    objectsContainer,
    layer,
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
  }: any) {
    this.project = project;
    this.instances = instances;
    this.globalObjectsContainer = globalObjectsContainer;
    this.objectsContainer = objectsContainer;
    this.layer = layer;
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

    this.instancesRenderer = new gd.InitialInstanceJSFunctor();
    // $FlowFixMe
    this.instancesRenderer.invoke = instancePtr => {
      const instance = gd.wrapPointer(instancePtr, gd.InitialInstance);
      this._renderInstance(instance);
    };

    // Setup 3D Scene for the layer
    this._threeScene = new THREE.Scene();
    this._threeCamera = new THREE.PerspectiveCamera(45, 1, 0.1, 10000);
    this._threeScene.add(this.threeLayerGroup);

    // Initial lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    this._threeScene.add(ambientLight);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
    directionalLight.position.set(1, 1, 1);
    this._threeScene.add(directionalLight);
  }

  getLayerGroup(): THREE.Group {
    return this.threeLayerGroup;
  }

  getThreeScene(): THREE.Scene | null {
    return this._threeScene;
  }

  getThreeCamera(): THREE.PerspectiveCamera | null {
    return this._threeCamera;
  }

  getThreePlaneMesh(): THREE.Mesh | null {
    return this._threePlaneMesh;
  }

  getBasicProfilingCounters(): BasicProfilingCounters {
    return this._basicProfilingCounters;
  }

  render() {
    resetBasicProfilingCounters(this._basicProfilingCounters);
    this.viewTopLeft = this.viewPosition.getViewTopLeft();
    this.viewBottomRight = this.viewPosition.getViewBottomRight();

    this.instances.iterateOverInstancesInLayer(
      this.layer.getName(),
      this.instancesRenderer
    );

    this._cleanUnusedRenderedInstances();
  }

  _renderInstance(instance: gdInitialInstance) {
    const startTime = performance.now();
    const ptr = instance.ptr;
    let renderedInstance = this.renderedInstances[ptr];
    if (!renderedInstance) {
      const objectName = instance.getObjectName();
      const object = getObjectByName(
        this.project,
        this.globalObjectsContainer,
        this.objectsContainer,
        objectName
      );
      if (object) {
        renderedInstance = ObjectsRenderingService.createNewInstanceRenderer(
          this.project,
          instance,
          object.getConfiguration(),
          this.threeLayerGroup,
          this._showObjectInstancesIn3D ? this.threeLayerGroup : null
        );
        this.renderedInstances[ptr] = renderedInstance;
      }
    }

    if (renderedInstance) {
      renderedInstance.update();
      renderedInstance.wasUsed = true;
    }
    increaseInstanceUpdate(
      this._basicProfilingCounters,
      performance.now() - startTime
    );
  }

  _cleanUnusedRenderedInstances() {
    for (let i in this.renderedInstances) {
      if (this.renderedInstances.hasOwnProperty(i)) {
        const renderedInstance = this.renderedInstances[i];
        if (!renderedInstance.wasUsed) {
          renderedInstance.onRemovedFromScene();
          delete this.renderedInstances[i];
        } else renderedInstance.wasUsed = false;
      }
    }
  }

  getInstanceAABB(instance: gdInitialInstance, bounds: Rectangle): Rectangle {
    const ptr = instance.ptr;
    const renderedInstance = this.renderedInstances[ptr];
    if (renderedInstance) {
      bounds.setRectangle(renderedInstance.getInstanceAABB());
      return bounds;
    }

    bounds.left = instance.getX();
    bounds.top = instance.getY();
    bounds.right = instance.getX();
    bounds.bottom = instance.getY();
    return bounds;
  }

  getUnrotatedInstanceAABB(
    instance: gdInitialInstance,
    bounds: Rectangle
  ): Rectangle {
    const ptr = instance.ptr;
    const renderedInstance = this.renderedInstances[ptr];
    if (renderedInstance) {
      bounds.setRectangle(renderedInstance.getUnrotatedInstanceAABB());
      return bounds;
    }

    bounds.left = instance.getX();
    bounds.top = instance.getY();
    bounds.right = instance.getX();
    bounds.bottom = instance.getY();
    return bounds;
  }

  getUnrotatedInstanceSize(
    instance: gdInitialInstance
  ): [number, number, number] {
    const ptr = instance.ptr;
    const renderedInstance = this.renderedInstances[ptr];
    if (renderedInstance) return renderedInstance.getUnrotatedInstanceSize();
    return [0, 0, 0];
  }

  resetInstanceRenderersFor(objectName: string) {
    for (let i in this.renderedInstances) {
      if (this.renderedInstances.hasOwnProperty(i)) {
        const renderedInstance = this.renderedInstances[i];
        if (renderedInstance.getInstance().getObjectName() === objectName) {
          renderedInstance.onRemovedFromScene();
          delete this.renderedInstances[i];
        }
      }
    }
  }

  delete() {
    for (let i in this.renderedInstances) {
      if (this.renderedInstances.hasOwnProperty(i)) {
        this.renderedInstances[i].onRemovedFromScene();
        delete this.renderedInstances[i];
      }
    }

    // Dispose resources
    if (this._threePlaneGeometry) this._threePlaneGeometry.dispose();
    if (this._threePlaneMaterial) this._threePlaneMaterial.dispose();
    if (this._threePlaneTexture) this._threePlaneTexture.dispose();

    this.threeLayerGroup.clear();
    if (this._threeScene) this._threeScene.clear();
    this.instancesRenderer.delete();
  }
}
