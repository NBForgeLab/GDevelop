// @flow
import { Trans } from '@lingui/macro';

import * as React from 'react';
import * as THREE from 'three';
// $FlowFixMe[cannot-resolve-module] Three.js addons are provided by the bundled three package.
import * as SkeletonUtils from 'three/addons/utils/SkeletonUtils';
// $FlowFixMe[cannot-resolve-module] Three.js addons are provided by the bundled three package.
import { OrbitControls } from 'three/addons/controls/OrbitControls';
// $FlowFixMe[cannot-resolve-module] Three.js addons are provided by the bundled three package.
import { TransformControls } from 'three/addons/controls/TransformControls';
import Dialog from '../../../UI/Dialog';
import FlatButton from '../../../UI/FlatButton';
import RaisedButton from '../../../UI/RaisedButton';
import Paper from '../../../UI/Paper';
import Text from '../../../UI/Text';
import AlertMessage from '../../../UI/AlertMessage';
import GDevelopThemeContext from '../../../UI/Theme/GDevelopThemeContext';
import { Column, Line } from '../../../UI/Grid';
import {
  ColumnStackLayout,
  ResponsiveLineStackLayout,
} from '../../../UI/Layout';
import ScrollView from '../../../UI/ScrollView';
import ResourceSelectorWithThumbnail from '../../../ResourcesList/ResourceSelectorWithThumbnail';
import PixiResourcesLoader from '../../../ObjectsRendering/PixiResourcesLoader';
import { NumericProperty, ChoiceProperty } from '../Physics2Editor';
import {
  createTriangularPrismVertices,
  epsilon,
  getEffectiveShapeDimensions,
  getModel3DPointForLocation,
  getPhysics3DPreviewCameraFrameKey,
  getPhysics3DPreviewCameraPosition,
  getRuntimeObjectDimensions,
  getUpdatedShapeValuesFromTransform,
  type EffectiveShapeDimensions,
  type Model3DDefaultTransform,
  type ObjectDimensions,
  type Physics3DShape,
  type Physics3DShapeOrientation,
} from './Physics3DShapeEditorHelpers';

const gd: libGDevelop = global.gd;

type TransformMode = 'translate' | 'scale';
type PreparedModel3DPreview = {|
  model: any,
  objectDimensions: ObjectDimensions,
|};
type PreviewColors = {|
  background: string,
  gridCenter: string,
  grid: string,
  objectBounds: string,
  collider: string,
  colliderWire: string,
|};
type PreviewContext = {|
  camera: any,
  renderer: any,
  controls: any,
  previewObjectsGroup: any,
  transformControls: any,
  transformControlsHelper: any,
|};
const styles = {
  body: {
    display: 'flex',
    flex: 1,
    minHeight: 0,
    width: '100%',
  },
  previewContainer: {
    position: 'relative',
    display: 'flex',
    flex: 1,
    minWidth: 0,
    minHeight: 360,
  },
  canvasContainer: {
    position: 'absolute',
    inset: 0,
    overflow: 'hidden',
  },
  toolbar: {
    position: 'absolute',
    left: 12,
    top: 12,
    display: 'flex',
    gap: 8,
    zIndex: 1,
  },
  sidePanel: {
    width: 360,
    maxWidth: '38%',
    minWidth: 300,
    display: 'flex',
    flexDirection: 'column',
  },
};

const parsePropertyNumber = (
  properties: gdMapStringPropertyDescriptor,
  propertyName: string,
  defaultValue: number = 0
) => {
  if (!properties.has(propertyName)) return defaultValue;
  const value = parseFloat(properties.get(propertyName).getValue());
  return Number.isNaN(value) ? defaultValue : value;
};

const getObjectDimensionFromProperties = (
  properties: gdMapStringPropertyDescriptor,
  propertyName: string
) => {
  if (!properties.has(propertyName)) return 100;
  const value = parseFloat(properties.get(propertyName).getValue());
  return value > 0 ? value : 100;
};

const getModel3DConfiguration = (object: gdObject): any | null => {
  if (object.getType() !== 'Scene3D::Model3DObject') return null;
  return gd.asModel3DConfiguration(object.getConfiguration());
};

const formatNumber = (value: number) => {
  if (!Number.isFinite(value)) return '0';
  return Number(value.toFixed(4)).toString(10);
};

const getColliderDepth = (
  shape: Physics3DShape,
  orientation: Physics3DShapeOrientation,
  dimensions: EffectiveShapeDimensions
) => {
  if (shape === 'Box' || shape === 'Sphere' || shape === 'Triangle') {
    return dimensions.depth;
  }
  if (orientation === 'X') return dimensions.width;
  if (orientation === 'Y') return dimensions.height;
  return dimensions.depth;
};

const createTriangularPrismGeometry = ({
  width,
  height,
  depth,
}: {
  width: number,
  height: number,
  depth: number,
  ...
}) => {
  const geometry = new THREE.BufferGeometry();
  const vertices = createTriangularPrismVertices(width, height, depth);
  geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));
  geometry.computeVertexNormals();
  return geometry;
};

const createColliderMesh = ({
  shape,
  orientation,
  dimensions,
  colors,
}: {|
  shape: Physics3DShape,
  orientation: Physics3DShapeOrientation,
  dimensions: EffectiveShapeDimensions,
  colors: PreviewColors,
|}) => {
  const material = new THREE.MeshBasicMaterial({
    color: colors.collider,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
  });
  const wireMaterial = new THREE.MeshBasicMaterial({
    color: colors.colliderWire,
    wireframe: true,
    transparent: true,
    opacity: 0.72,
  });
  let geometry;

  if (shape === 'Sphere') {
    geometry = new THREE.SphereGeometry(dimensions.radius, 32, 16);
  } else if (shape === 'Capsule') {
    const depth = getColliderDepth(shape, orientation, dimensions);
    geometry = new THREE.CapsuleGeometry(
      dimensions.radius,
      Math.max(0, depth - dimensions.radius * 2),
      12,
      24
    );
  } else if (shape === 'Cylinder') {
    const depth = getColliderDepth(shape, orientation, dimensions);
    geometry = new THREE.CylinderGeometry(
      dimensions.radius,
      dimensions.radius,
      depth,
      32,
      1,
      false
    );
  } else if (shape === 'Triangle') {
    geometry = createTriangularPrismGeometry(dimensions);
  } else {
    geometry = new THREE.BoxGeometry(
      dimensions.width,
      dimensions.height,
      dimensions.depth
    );
  }

  const solid = new THREE.Mesh(geometry, material);
  const wire = new THREE.Mesh(geometry.clone(), wireMaterial);
  if (shape === 'Capsule' || shape === 'Cylinder') {
    if (orientation === 'X') {
      solid.rotation.z = -Math.PI / 2;
      wire.rotation.z = -Math.PI / 2;
    } else if (orientation === 'Z') {
      solid.rotation.x = Math.PI / 2;
      wire.rotation.x = Math.PI / 2;
    }
  }

  const group = new THREE.Group();
  group.add(solid);
  group.add(wire);

  return {
    group,
    dispose: () => {
      geometry.dispose();
      wire.geometry.dispose();
      material.dispose();
      wireMaterial.dispose();
    },
  };
};

const stretchModelIntoUnitaryCube = (
  model: any,
  defaultTransform: Model3DDefaultTransform
): ObjectDimensions | null => {
  const rotationX = (defaultTransform.rotationX * Math.PI) / 180;
  const rotationY = (defaultTransform.rotationY * Math.PI) / 180;
  const rotationZ = (defaultTransform.rotationZ * Math.PI) / 180;

  // These formulas mirror gdjs.Model3DRuntimeObject3DRenderer.stretchModelIntoUnitaryCube.
  model.rotation.set(rotationX, rotationY, rotationZ);
  model.updateMatrixWorld(true);
  const box = new THREE.Box3().setFromObject(model);
  if (box.isEmpty()) return null;

  const originPoint = getModel3DPointForLocation(
    defaultTransform.originLocation
  );
  if (originPoint.some(coordinate => coordinate === null)) {
    box.expandByPoint(
      new THREE.Vector3(
        originPoint[0] === null ? 0 : box.min.x,
        originPoint[1] === null ? 0 : box.min.y,
        originPoint[2] === null ? 0 : box.min.z
      )
    );
  }

  const modelWidth = box.max.x - box.min.x;
  const modelHeight = box.max.y - box.min.y;
  const modelDepth = box.max.z - box.min.z;
  const centerPoint = getModel3DPointForLocation(
    defaultTransform.centerLocation
  );

  if (centerPoint[0] !== null) {
    model.position.x = -(box.min.x + modelWidth * centerPoint[0]);
  }
  if (centerPoint[1] !== null) {
    // The model is flipped on Y axis by the runtime renderer.
    model.position.y = -(box.min.y + modelHeight * (1 - centerPoint[1]));
  }
  if (centerPoint[2] !== null) {
    model.position.z = -(box.min.z + modelDepth * centerPoint[2]);
  }

  model.scale.set(1, 1, 1);
  model.rotation.set(rotationX, rotationY, rotationZ);

  const scaleMatrix = new THREE.Matrix4();
  scaleMatrix.makeScale(
    modelWidth < epsilon ? 1 : 1 / modelWidth,
    modelHeight < epsilon ? 1 : -1 / modelHeight,
    modelDepth < epsilon ? 1 : 1 / modelDepth
  );
  model.updateMatrix();
  model.applyMatrix4(scaleMatrix);

  return {
    width: modelWidth,
    height: modelHeight,
    depth: modelDepth,
  };
};

const makeModelPreviewTransparent = (model: any) => {
  model.traverse(child => {
    // $FlowFixMe[prop-missing] Three.js mesh runtime flag.
    if (!child.isMesh) return;
    // $FlowFixMe[incompatible-type]
    const mesh = (child: any);
    if (Array.isArray(mesh.material)) {
      mesh.material = mesh.material.map(material => {
        const clonedMaterial = material.clone();
        clonedMaterial.transparent = true;
        clonedMaterial.opacity = 0.42;
        clonedMaterial.depthWrite = false;
        return clonedMaterial;
      });
    } else if (mesh.material) {
      const clonedMaterial = mesh.material.clone();
      clonedMaterial.transparent = true;
      clonedMaterial.opacity = 0.42;
      clonedMaterial.depthWrite = false;
      mesh.material = clonedMaterial;
    }
  });
};

const makeModelPreviewWireframe = (model: any, color: string) => {
  model.traverse(child => {
    // $FlowFixMe[prop-missing] Three.js mesh runtime flag.
    if (!child.isMesh) return;
    // $FlowFixMe[incompatible-type]
    const mesh = (child: any);
    mesh.material = new THREE.MeshBasicMaterial({
      color,
      wireframe: true,
      transparent: true,
      opacity: 0.86,
      depthTest: false,
    });
  });
};

const prepareModelForPreview = (
  model: any,
  objectDimensions: ObjectDimensions,
  defaultTransform: Model3DDefaultTransform
): PreparedModel3DPreview => {
  const modelInObjectSpace = new THREE.Group();
  modelInObjectSpace.rotation.order = 'ZYX';
  modelInObjectSpace.add(model);
  const modelSize = stretchModelIntoUnitaryCube(
    modelInObjectSpace,
    defaultTransform
  );
  const runtimeObjectDimensions = getRuntimeObjectDimensions({
    objectDimensions,
    modelSize: modelSize || { width: 1, height: 1, depth: 1 },
    keepAspectRatio: defaultTransform.keepAspectRatio,
  });

  const previewModel = new THREE.Group();
  previewModel.add(modelInObjectSpace);
  previewModel.scale.set(
    runtimeObjectDimensions.width,
    runtimeObjectDimensions.height,
    runtimeObjectDimensions.depth
  );
  makeModelPreviewTransparent(previewModel);
  return {
    model: previewModel,
    objectDimensions: runtimeObjectDimensions,
  };
};

const prepareMeshShapeForPreview = (
  model: any,
  objectDimensions: ObjectDimensions,
  defaultTransform: Model3DDefaultTransform,
  color: string
) => {
  const modelInObjectSpace = new THREE.Group();
  modelInObjectSpace.rotation.order = 'ZYX';
  modelInObjectSpace.add(model);
  stretchModelIntoUnitaryCube(modelInObjectSpace, defaultTransform);

  const previewModel = new THREE.Group();
  previewModel.add(modelInObjectSpace);
  previewModel.scale.set(
    objectDimensions.width,
    objectDimensions.height,
    objectDimensions.depth
  );
  makeModelPreviewWireframe(previewModel, color);
  return previewModel;
};

const disposePreviewModel = (model: any) => {
  model.traverse(child => {
    // $FlowFixMe[prop-missing] Three.js mesh runtime flag.
    if (!child.isMesh) return;
    // $FlowFixMe[incompatible-type]
    const mesh = (child: any);
    if (Array.isArray(mesh.material)) {
      mesh.material.forEach(material => material.dispose());
    } else if (mesh.material) {
      mesh.material.dispose();
    }
  });
};

const disposeGeneratedObject = (object: any) => {
  object.traverse(child => {
    // $FlowFixMe[prop-missing] Three.js generated helpers expose geometry.
    if (child.geometry) child.geometry.dispose();
    // $FlowFixMe[prop-missing] Three.js generated helpers expose material.
    const material = child.material;
    if (Array.isArray(material)) {
      material.forEach(material => material.dispose());
    } else if (material) {
      material.dispose();
    }
  });
};

const frameCameraToBounds = ({
  camera,
  controls,
  bounds,
  objectDimensions,
}: {|
  camera: any,
  controls: any,
  bounds: any,
  objectDimensions: ObjectDimensions,
|}) => {
  if (bounds.isEmpty()) {
    bounds.setFromCenterAndSize(
      new THREE.Vector3(),
      new THREE.Vector3(
        objectDimensions.width,
        objectDimensions.height,
        objectDimensions.depth
      )
    );
  }

  const size = new THREE.Vector3();
  const center = new THREE.Vector3();
  bounds.getSize(size);
  bounds.getCenter(center);
  const maxDimension = Math.max(size.x, size.y, size.z, 100);
  const cameraPosition = getPhysics3DPreviewCameraPosition({
    center,
    maxDimension,
  });
  controls.target.copy(center);
  camera.up.set(0, 0, 1);
  camera.position.set(cameraPosition.x, cameraPosition.y, cameraPosition.z);
  camera.lookAt(center);
};

type Props = {|
  object: gdObject,
  project: gdProject,
  properties: gdMapStringPropertyDescriptor,
  resourceManagementProps: any,
  projectScopedContainersAccessor: any,
  updateBehaviorProperty: (propertyName: string, value: string) => void,
  onClose: () => void,
|};

const Physics3DShapeEditorDialog = ({
  object,
  project,
  properties,
  resourceManagementProps,
  projectScopedContainersAccessor,
  updateBehaviorProperty,
  onClose,
}: Props): React.Node => {
  const gdevelopTheme = React.useContext(GDevelopThemeContext);
  const transformControlsRef = React.useRef<any>(null);
  const colliderRef = React.useRef<any>(null);
  const commitTransformRef = React.useRef<() => void>(() => {});
  const lastCameraFrameKeyRef = React.useRef<?string>(null);
  const [canvasContainer, setCanvasContainer] = React.useState<?HTMLDivElement>(
    null
  );
  const [previewContext, setPreviewContext] = React.useState<?PreviewContext>(
    null
  );
  const [transformMode, setTransformMode] = React.useState<TransformMode>(
    'translate'
  );
  const transformModeRef = React.useRef<TransformMode>(transformMode);
  const [
    preparedModel3D,
    setPreparedModel3D,
  ] = React.useState<?PreparedModel3DPreview>(null);
  const [meshShape3D, setMeshShape3D] = React.useState<any>(null);

  const shape: Physics3DShape = (properties.get('shape').getValue(): any);
  const model3DConfiguration = getModel3DConfiguration(object);
  const objectProperties = object.getConfiguration().getProperties();
  const modelResourceName = model3DConfiguration
    ? model3DConfiguration.getModelResourceName()
    : '';
  const configuredObjectWidth = model3DConfiguration
    ? model3DConfiguration.getWidth() > 0
      ? model3DConfiguration.getWidth()
      : 100
    : getObjectDimensionFromProperties(objectProperties, 'width');
  const configuredObjectHeight = model3DConfiguration
    ? model3DConfiguration.getHeight() > 0
      ? model3DConfiguration.getHeight()
      : 100
    : getObjectDimensionFromProperties(objectProperties, 'height');
  const configuredObjectDepth = model3DConfiguration
    ? model3DConfiguration.getDepth() > 0
      ? model3DConfiguration.getDepth()
      : 100
    : getObjectDimensionFromProperties(objectProperties, 'depth');
  const modelRotationX = model3DConfiguration
    ? model3DConfiguration.getRotationX()
    : 0;
  const modelRotationY = model3DConfiguration
    ? model3DConfiguration.getRotationY()
    : 0;
  const modelRotationZ = model3DConfiguration
    ? model3DConfiguration.getRotationZ()
    : 0;
  const modelKeepAspectRatio = model3DConfiguration
    ? model3DConfiguration.shouldKeepAspectRatio()
    : false;
  const modelOriginLocation = model3DConfiguration
    ? model3DConfiguration.getOriginLocation()
    : 'ModelOrigin';
  const modelCenterLocation = model3DConfiguration
    ? model3DConfiguration.getCenterLocation()
    : 'CenteredOnZ';
  const configuredMeshShapeResourceName = properties
    .get('meshShapeResourceName')
    .getValue();
  const isMeshShapeSupported =
    shape === 'Mesh' &&
    object.getType() === 'Scene3D::Model3DObject' &&
    !!(configuredMeshShapeResourceName || modelResourceName);
  const previewShape: Physics3DShape =
    shape === 'Mesh' && !isMeshShapeSupported ? 'Sphere' : shape;
  const orientation: Physics3DShapeOrientation =
    previewShape === 'Box' ||
    previewShape === 'Sphere' ||
    previewShape === 'Triangle'
      ? 'Z'
      : ((properties
          .get('shapeOrientation')
          .getValue(): any): Physics3DShapeOrientation);
  const shapeDimensionA = parsePropertyNumber(properties, 'shapeDimensionA');
  const shapeDimensionB = parsePropertyNumber(properties, 'shapeDimensionB');
  const shapeDimensionC = parsePropertyNumber(properties, 'shapeDimensionC');
  const shapeOffsetX = parsePropertyNumber(properties, 'shapeOffsetX');
  const shapeOffsetY = parsePropertyNumber(properties, 'shapeOffsetY');
  const shapeOffsetZ = parsePropertyNumber(properties, 'shapeOffsetZ');
  const configuredObjectDimensions = React.useMemo<ObjectDimensions>(
    () => ({
      width: configuredObjectWidth,
      height: configuredObjectHeight,
      depth: configuredObjectDepth,
    }),
    [configuredObjectDepth, configuredObjectHeight, configuredObjectWidth]
  );
  const objectDimensions = preparedModel3D
    ? preparedModel3D.objectDimensions
    : configuredObjectDimensions;
  const meshShapeObjectDimensions = objectDimensions;
  const modelDefaultTransform = React.useMemo<Model3DDefaultTransform>(
    () => ({
      rotationX: modelRotationX,
      rotationY: modelRotationY,
      rotationZ: modelRotationZ,
      keepAspectRatio: modelKeepAspectRatio,
      originLocation: modelOriginLocation,
      centerLocation: modelCenterLocation,
    }),
    [
      modelCenterLocation,
      modelKeepAspectRatio,
      modelOriginLocation,
      modelRotationX,
      modelRotationY,
      modelRotationZ,
    ]
  );
  const previewCameraFrameKey = React.useMemo(
    () =>
      getPhysics3DPreviewCameraFrameKey({
        modelResourceName,
        objectDimensions,
        modelDefaultTransform,
      }),
    [modelDefaultTransform, modelResourceName, objectDimensions]
  );
  const previewColors = React.useMemo<PreviewColors>(
    () => ({
      background: gdevelopTheme.dialog.backgroundColor,
      gridCenter: gdevelopTheme.toolbar.separatorColor,
      grid: gdevelopTheme.paper.backgroundColor.light,
      objectBounds: gdevelopTheme.text.color.secondary,
      collider: gdevelopTheme.link.color.default,
      colliderWire: gdevelopTheme.text.color.primary,
    }),
    [
      gdevelopTheme.dialog.backgroundColor,
      gdevelopTheme.link.color.default,
      gdevelopTheme.paper.backgroundColor.light,
      gdevelopTheme.text.color.primary,
      gdevelopTheme.text.color.secondary,
      gdevelopTheme.toolbar.separatorColor,
    ]
  );
  const sidePanelStyle = React.useMemo(
    () => ({
      ...styles.sidePanel,
      borderLeft: `1px solid ${gdevelopTheme.dialog.separator}`,
    }),
    [gdevelopTheme.dialog.separator]
  );
  const effectiveDimensions = React.useMemo(
    () =>
      getEffectiveShapeDimensions({
        shape: previewShape,
        orientation,
        shapeDimensionA,
        shapeDimensionB,
        shapeDimensionC,
        objectDimensions,
      }),
    [
      objectDimensions,
      orientation,
      previewShape,
      shapeDimensionA,
      shapeDimensionB,
      shapeDimensionC,
    ]
  );

  React.useEffect(
    () => {
      let isCancelled = false;
      if (!modelResourceName) {
        setPreparedModel3D(null);
        return;
      }

      (async () => {
        const gltf = await PixiResourcesLoader.get3DModel(
          project,
          modelResourceName
        );
        if (isCancelled) return;
        // $FlowFixMe[prop-missing] SkeletonUtils.clone accepts Object3D.
        const clonedModel = SkeletonUtils.clone(gltf.scene);
        setPreparedModel3D(
          prepareModelForPreview(
            clonedModel,
            configuredObjectDimensions,
            modelDefaultTransform
          )
        );
      })();

      return () => {
        isCancelled = true;
      };
    },
    [
      configuredObjectDimensions,
      modelDefaultTransform,
      modelResourceName,
      project,
    ]
  );

  React.useEffect(
    () => {
      return () => {
        if (preparedModel3D) disposePreviewModel(preparedModel3D.model);
      };
    },
    [preparedModel3D]
  );

  const meshShapeResourceName =
    shape === 'Mesh' && isMeshShapeSupported
      ? configuredMeshShapeResourceName || modelResourceName
      : '';
  React.useEffect(
    () => {
      let isCancelled = false;
      if (!meshShapeResourceName) {
        setMeshShape3D(null);
        return;
      }

      (async () => {
        const gltf = await PixiResourcesLoader.get3DModel(
          project,
          meshShapeResourceName
        );
        if (isCancelled) return;
        // $FlowFixMe[prop-missing] SkeletonUtils.clone accepts Object3D.
        const clonedModel = SkeletonUtils.clone(gltf.scene);
        setMeshShape3D(
          prepareMeshShapeForPreview(
            clonedModel,
            meshShapeObjectDimensions,
            modelDefaultTransform,
            previewColors.colliderWire
          )
        );
      })();

      return () => {
        isCancelled = true;
      };
    },
    [
      meshShapeResourceName,
      meshShapeObjectDimensions,
      modelDefaultTransform,
      previewColors.colliderWire,
      project,
    ]
  );

  React.useEffect(
    () => {
      return () => {
        if (meshShape3D) disposePreviewModel(meshShape3D);
      };
    },
    [meshShape3D]
  );

  React.useEffect(
    () => {
      transformModeRef.current = transformMode;
      if (transformControlsRef.current) {
        transformControlsRef.current.setMode(transformMode);
      }
    },
    [transformMode]
  );

  const commitTransform = React.useCallback(
    () => {
      const collider = colliderRef.current;
      if (!collider || shape === 'Mesh') return;
      const newValues = getUpdatedShapeValuesFromTransform({
        shape,
        orientation,
        effectiveDimensions,
        position: collider.position,
        scale: collider.scale,
      });

      updateBehaviorProperty(
        'shapeDimensionA',
        formatNumber(newValues.shapeDimensionA)
      );
      updateBehaviorProperty(
        'shapeDimensionB',
        formatNumber(newValues.shapeDimensionB)
      );
      updateBehaviorProperty(
        'shapeDimensionC',
        formatNumber(newValues.shapeDimensionC)
      );
      updateBehaviorProperty(
        'shapeOffsetX',
        formatNumber(newValues.shapeOffsetX)
      );
      updateBehaviorProperty(
        'shapeOffsetY',
        formatNumber(newValues.shapeOffsetY)
      );
      updateBehaviorProperty(
        'shapeOffsetZ',
        formatNumber(newValues.shapeOffsetZ)
      );
    },
    [effectiveDimensions, orientation, shape, updateBehaviorProperty]
  );

  const setTransformModeAndCommit = React.useCallback(
    (mode: TransformMode) => {
      commitTransform();
      setTransformMode(mode);
    },
    [commitTransform]
  );

  React.useEffect(
    () => {
      commitTransformRef.current = commitTransform;
    },
    [commitTransform]
  );

  React.useEffect(
    () => {
      const container = canvasContainer;
      if (!container) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
      camera.up.set(0, 0, 1);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);

      const previewObjectsGroup = new THREE.Group();
      scene.add(previewObjectsGroup);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
      directionalLight.position.set(1, 2, 3);
      scene.add(directionalLight);

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

      const transformControls = new TransformControls(
        camera,
        renderer.domElement
      );
      transformControls.setMode(transformModeRef.current);
      transformControls.setSpace('local');
      transformControls.addEventListener('dragging-changed', event => {
        controls.enabled = !event.value;
        if (!event.value) commitTransformRef.current();
      });
      const transformControlsHelper = transformControls.getHelper();
      transformControlsHelper.rotation.order = 'ZYX';
      transformControlsHelper.visible = false;
      scene.add(transformControlsHelper);
      transformControlsRef.current = transformControls;

      const resize = () => {
        const width = Math.max(container.clientWidth, 1);
        const height = Math.max(container.clientHeight, 1);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.updateProjectionMatrix();
      };
      resize();
      const resizeObserver =
        typeof ResizeObserver !== 'undefined'
          ? new ResizeObserver(resize)
          : null;
      if (resizeObserver) resizeObserver.observe(container);
      else window.addEventListener('resize', resize);

      let animationFrameId: AnimationFrameID | null = null;
      const render = () => {
        controls.update();
        renderer.render(scene, camera);
        animationFrameId = requestAnimationFrame(render);
      };
      render();

      const newPreviewContext = {
        camera,
        renderer,
        controls,
        previewObjectsGroup,
        transformControls,
        transformControlsHelper,
      };
      setPreviewContext(newPreviewContext);

      return () => {
        setPreviewContext(currentPreviewContext =>
          currentPreviewContext === newPreviewContext
            ? null
            : currentPreviewContext
        );
        lastCameraFrameKeyRef.current = null;
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        if (resizeObserver) resizeObserver.disconnect();
        else window.removeEventListener('resize', resize);
        controls.dispose();
        transformControls.detach();
        transformControls.dispose();
        transformControlsRef.current = null;
        previewObjectsGroup.clear();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    },
    [canvasContainer]
  );

  React.useEffect(
    () => {
      if (!previewContext) return;

      previewContext.renderer.setClearColor(previewColors.background, 1);
    },
    [previewColors.background, previewContext]
  );

  React.useEffect(
    () => {
      if (!previewContext) return;

      const {
        camera,
        controls,
        previewObjectsGroup,
        transformControls,
        transformControlsHelper,
      } = previewContext;
      const generatedObjects = [];
      let colliderDispose = null;

      const grid = new THREE.GridHelper(
        Math.max(
          objectDimensions.width,
          objectDimensions.height,
          objectDimensions.depth,
          100
        ) * 1.5,
        10,
        previewColors.gridCenter,
        previewColors.grid
      );
      grid.rotation.x = Math.PI / 2;
      previewObjectsGroup.add(grid);
      generatedObjects.push(grid);

      if (preparedModel3D) {
        previewObjectsGroup.add(preparedModel3D.model);
      } else {
        const objectBox = new THREE.Box3(
          new THREE.Vector3(
            -objectDimensions.width / 2,
            -objectDimensions.height / 2,
            -objectDimensions.depth / 2
          ),
          new THREE.Vector3(
            objectDimensions.width / 2,
            objectDimensions.height / 2,
            objectDimensions.depth / 2
          )
        );
        const objectBoundsHelper = new THREE.Box3Helper(
          objectBox,
          previewColors.objectBounds
        );
        previewObjectsGroup.add(objectBoundsHelper);
        generatedObjects.push(objectBoundsHelper);
      }

      if (shape === 'Mesh' && meshShape3D) {
        meshShape3D.position.set(shapeOffsetX, shapeOffsetY, shapeOffsetZ);
        previewObjectsGroup.add(meshShape3D);
        colliderRef.current = null;
        transformControls.detach();
        transformControlsHelper.visible = false;
      } else if (shape !== 'Mesh' || !isMeshShapeSupported) {
        const collider = createColliderMesh({
          shape: previewShape,
          orientation,
          dimensions: effectiveDimensions,
          colors: previewColors,
        });
        colliderDispose = collider.dispose;
        collider.group.position.set(shapeOffsetX, shapeOffsetY, shapeOffsetZ);
        previewObjectsGroup.add(collider.group);
        colliderRef.current = collider.group;

        if (shape !== 'Mesh') {
          transformControls.setMode(transformModeRef.current);
          transformControls.attach(collider.group);
          transformControlsHelper.visible = true;
        } else {
          transformControls.detach();
          transformControlsHelper.visible = false;
        }
      } else {
        colliderRef.current = null;
        transformControls.detach();
        transformControlsHelper.visible = false;
      }

      if (lastCameraFrameKeyRef.current !== previewCameraFrameKey) {
        frameCameraToBounds({
          camera,
          controls,
          bounds: new THREE.Box3().setFromObject(previewObjectsGroup),
          objectDimensions,
        });
        lastCameraFrameKeyRef.current = previewCameraFrameKey;
      }

      return () => {
        transformControls.detach();
        transformControlsHelper.visible = false;
        colliderRef.current = null;
        previewObjectsGroup.clear();
        if (colliderDispose) colliderDispose();
        generatedObjects.forEach(disposeGeneratedObject);
      };
    },
    [
      effectiveDimensions,
      isMeshShapeSupported,
      meshShape3D,
      objectDimensions,
      orientation,
      preparedModel3D,
      previewCameraFrameKey,
      previewColors,
      previewContext,
      previewShape,
      shape,
      shapeOffsetX,
      shapeOffsetY,
      shapeOffsetZ,
    ]
  );

  return (
    <Dialog
      title={<Trans>Edit 3D physics shape</Trans>}
      actions={[
        <RaisedButton
          key="apply"
          label={<Trans>Apply</Trans>}
          primary
          onClick={onClose}
        />,
      ]}
      onApply={onClose}
      onRequestClose={onClose}
      maxWidth="lg"
      fullHeight
      flexBody
      open
    >
      <div style={styles.body}>
        <Paper background="medium" square style={styles.previewContainer}>
          <div style={styles.toolbar}>
            <FlatButton
              label={<Trans>Move</Trans>}
              primary={transformMode === 'translate'}
              onClick={() => setTransformModeAndCommit('translate')}
              disabled={shape === 'Mesh'}
            />
            <FlatButton
              label={<Trans>Resize</Trans>}
              primary={transformMode === 'scale'}
              onClick={() => setTransformModeAndCommit('scale')}
              disabled={shape === 'Mesh'}
            />
          </div>
          <div ref={setCanvasContainer} style={styles.canvasContainer} />
        </Paper>
        <Paper background="medium" square style={sidePanelStyle}>
          <ScrollView>
            <ColumnStackLayout noMargin>
              <Text size="block-title">
                <Trans>Shape</Trans>
              </Text>
              <ChoiceProperty
                id="physics3d-shape-editor-shape"
                properties={properties}
                propertyName={'shape'}
                onUpdate={(e, i, newValue: string) => {
                  updateBehaviorProperty('shape', newValue);
                }}
              />
              {shape !== 'Mesh' && (
                <ChoiceProperty
                  id="physics3d-shape-editor-orientation"
                  properties={properties}
                  propertyName={'shapeOrientation'}
                  value={
                    shape === 'Box' ||
                    shape === 'Sphere' ||
                    shape === 'Triangle'
                      ? 'Z'
                      : orientation
                  }
                  onUpdate={(e, i, newValue: string) => {
                    updateBehaviorProperty('shapeOrientation', newValue);
                  }}
                  disabled={
                    shape === 'Box' ||
                    shape === 'Sphere' ||
                    shape === 'Triangle'
                  }
                />
              )}
              {shape === 'Mesh' ? (
                <React.Fragment>
                  <AlertMessage kind="info">
                    <Trans>
                      Mesh shapes use a 3D model resource as the physics shape
                      for static bodies. Dynamic and kinematic bodies use a
                      convex hull generated from the same model.
                    </Trans>
                  </AlertMessage>
                  {!isMeshShapeSupported && (
                    <AlertMessage kind="warning">
                      <Trans>
                        The preview shows the default sphere fallback used by
                        Physics 3D until this is a 3D model object with a model
                        resource.
                      </Trans>
                    </AlertMessage>
                  )}
                  <ResourceSelectorWithThumbnail
                    project={project}
                    resourceKind="model3D"
                    floatingLabelText={properties
                      .get('meshShapeResourceName')
                      .getLabel()}
                    resourceManagementProps={resourceManagementProps}
                    projectScopedContainersAccessor={
                      projectScopedContainersAccessor
                    }
                    resourceName={properties
                      .get('meshShapeResourceName')
                      .getValue()}
                    onChange={newValue => {
                      updateBehaviorProperty('meshShapeResourceName', newValue);
                    }}
                    id="physics3d-shape-editor-mesh-shape-resource-name"
                  />
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Text size="block-title">
                    <Trans>Dimensions</Trans>
                  </Text>
                  <ResponsiveLineStackLayout noColumnMargin>
                    <NumericProperty
                      properties={properties}
                      propertyName={'shapeDimensionA'}
                      step={1}
                      onUpdate={newValue =>
                        updateBehaviorProperty('shapeDimensionA', newValue)
                      }
                    />
                    {shape !== 'Sphere' && (
                      <NumericProperty
                        properties={properties}
                        propertyName={'shapeDimensionB'}
                        step={1}
                        onUpdate={newValue =>
                          updateBehaviorProperty('shapeDimensionB', newValue)
                        }
                      />
                    )}
                  </ResponsiveLineStackLayout>
                  {(shape === 'Box' || shape === 'Triangle') && (
                    <Line noMargin>
                      <Column expand noMargin>
                        <NumericProperty
                          properties={properties}
                          propertyName={'shapeDimensionC'}
                          step={1}
                          onUpdate={newValue =>
                            updateBehaviorProperty('shapeDimensionC', newValue)
                          }
                        />
                      </Column>
                    </Line>
                  )}
                  <Text size="block-title">
                    <Trans>Offset</Trans>
                  </Text>
                  <ResponsiveLineStackLayout noColumnMargin>
                    <NumericProperty
                      properties={properties}
                      propertyName={'shapeOffsetX'}
                      step={1}
                      onUpdate={newValue =>
                        updateBehaviorProperty('shapeOffsetX', newValue)
                      }
                    />
                    <NumericProperty
                      properties={properties}
                      propertyName={'shapeOffsetY'}
                      step={1}
                      onUpdate={newValue =>
                        updateBehaviorProperty('shapeOffsetY', newValue)
                      }
                    />
                  </ResponsiveLineStackLayout>
                  <Line noMargin>
                    <Column expand noMargin>
                      <NumericProperty
                        properties={properties}
                        propertyName={'shapeOffsetZ'}
                        step={1}
                        onUpdate={newValue =>
                          updateBehaviorProperty('shapeOffsetZ', newValue)
                        }
                      />
                    </Column>
                  </Line>
                </React.Fragment>
              )}
            </ColumnStackLayout>
          </ScrollView>
        </Paper>
      </div>
    </Dialog>
  );
};

export default Physics3DShapeEditorDialog;
