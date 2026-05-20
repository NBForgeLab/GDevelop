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

const getDefaultModel3DDefaultTransform = (): Model3DDefaultTransform => ({
  rotationX: 0,
  rotationY: 0,
  rotationZ: 0,
  keepAspectRatio: false,
  originLocation: 'ModelOrigin',
  centerLocation: 'CenteredOnZ',
});

const getModel3DConfiguration = (object: gdObject): any | null => {
  if (object.getType() !== 'Scene3D::Model3DObject') return null;
  return gd.asModel3DConfiguration(object.getConfiguration());
};

const getObjectDimensions = (object: gdObject): ObjectDimensions => {
  const model3DConfiguration = getModel3DConfiguration(object);
  if (model3DConfiguration) {
    return {
      width:
        model3DConfiguration.getWidth() > 0
          ? model3DConfiguration.getWidth()
          : 100,
      height:
        model3DConfiguration.getHeight() > 0
          ? model3DConfiguration.getHeight()
          : 100,
      depth:
        model3DConfiguration.getDepth() > 0
          ? model3DConfiguration.getDepth()
          : 100,
    };
  }

  const objectProperties = object.getConfiguration().getProperties();
  return {
    width: getObjectDimensionFromProperties(objectProperties, 'width'),
    height: getObjectDimensionFromProperties(objectProperties, 'height'),
    depth: getObjectDimensionFromProperties(objectProperties, 'depth'),
  };
};

const getModel3DDefaultTransform = (
  object: gdObject
): Model3DDefaultTransform => {
  const model3DConfiguration = getModel3DConfiguration(object);
  if (!model3DConfiguration) return getDefaultModel3DDefaultTransform();

  return {
    rotationX: model3DConfiguration.getRotationX(),
    rotationY: model3DConfiguration.getRotationY(),
    rotationZ: model3DConfiguration.getRotationZ(),
    keepAspectRatio: model3DConfiguration.shouldKeepAspectRatio(),
    originLocation: model3DConfiguration.getOriginLocation(),
    centerLocation: model3DConfiguration.getCenterLocation(),
  };
};

const getModelResourceName = (object: gdObject) => {
  const model3DConfiguration = getModel3DConfiguration(object);
  return model3DConfiguration
    ? model3DConfiguration.getModelResourceName()
    : '';
};

const getModel3DConfigurationKey = (object: gdObject) => {
  const model3DConfiguration = getModel3DConfiguration(object);
  if (!model3DConfiguration) return object.getType();
  return [
    model3DConfiguration.getModelResourceName(),
    model3DConfiguration.getWidth(),
    model3DConfiguration.getHeight(),
    model3DConfiguration.getDepth(),
    model3DConfiguration.getRotationX(),
    model3DConfiguration.getRotationY(),
    model3DConfiguration.getRotationZ(),
    model3DConfiguration.shouldKeepAspectRatio(),
    model3DConfiguration.getOriginLocation(),
    model3DConfiguration.getCenterLocation(),
  ].join(';');
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
}: {|
  width: number,
  height: number,
  depth: number,
|}): THREE.BufferGeometry => {
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
  const containerRef = React.useRef<?HTMLDivElement>(null);
  const transformControlsRef = React.useRef<any>(null);
  const colliderRef = React.useRef<any>(null);
  const cameraViewRef = React.useRef<?{|
    position: THREE.Vector3,
    target: THREE.Vector3,
  |}>(null);
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
  const model3DConfigurationKey = getModel3DConfigurationKey(object);
  const modelResourceName = React.useMemo(() => getModelResourceName(object), [
    object,
    model3DConfigurationKey,
  ]);
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
  const configuredObjectDimensions = React.useMemo(
    () => getObjectDimensions(object),
    [object, model3DConfigurationKey]
  );
  const objectDimensions = preparedModel3D
    ? preparedModel3D.objectDimensions
    : configuredObjectDimensions;
  const meshShapeObjectDimensions = objectDimensions;
  const modelDefaultTransform = React.useMemo(
    () => getModel3DDefaultTransform(object),
    [object, model3DConfigurationKey]
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
      const container = containerRef.current;
      if (!container) return;

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100000);
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
      });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      renderer.setClearColor(previewColors.background, 1);
      container.appendChild(renderer.domElement);

      const contentGroup = new THREE.Group();
      scene.add(contentGroup);
      const previewObjectsGroup = new THREE.Group();
      contentGroup.add(previewObjectsGroup);

      const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
      scene.add(ambientLight);
      const directionalLight = new THREE.DirectionalLight(0xffffff, 0.9);
      directionalLight.position.set(1, 2, 3);
      scene.add(directionalLight);
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
      contentGroup.add(grid);

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
        previewObjectsGroup.add(
          new THREE.Box3Helper(objectBox, previewColors.objectBounds)
        );
      }

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.08;

      let colliderDispose = null;
      if (shape === 'Mesh' && meshShape3D) {
        meshShape3D.position.set(shapeOffsetX, shapeOffsetY, shapeOffsetZ);
        previewObjectsGroup.add(meshShape3D);
        colliderRef.current = null;
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
          const transformControls = new TransformControls(
            camera,
            renderer.domElement
          );
          transformControls.setMode(transformModeRef.current);
          transformControls.setSpace('local');
          transformControls.attach(collider.group);
          transformControls.addEventListener('dragging-changed', event => {
            controls.enabled = !event.value;
            if (!event.value) commitTransform();
          });
          const transformControlsHelper = transformControls.getHelper();
          transformControlsHelper.rotation.order = 'ZYX';
          scene.add(transformControlsHelper);
          transformControlsRef.current = transformControls;
        } else {
          transformControlsRef.current = null;
        }
      } else {
        colliderRef.current = null;
      }

      const bounds = new THREE.Box3().setFromObject(previewObjectsGroup);
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
      const cameraView = cameraViewRef.current;
      if (cameraView) {
        controls.target.copy(cameraView.target);
        camera.position.copy(cameraView.position);
        camera.lookAt(cameraView.target);
      } else {
        controls.target.copy(center);
        camera.position.set(
          center.x + maxDimension * 1.3,
          center.y + maxDimension * 1.1,
          center.z + maxDimension * 1.5
        );
        camera.lookAt(center);
      }

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

      return () => {
        cameraViewRef.current = {
          position: camera.position.clone(),
          target: controls.target.clone(),
        };
        if (animationFrameId !== null) {
          cancelAnimationFrame(animationFrameId);
        }
        if (resizeObserver) resizeObserver.disconnect();
        else window.removeEventListener('resize', resize);
        controls.dispose();
        const transformControls = transformControlsRef.current;
        if (transformControls) {
          transformControls.detach();
          transformControls.dispose();
          transformControlsRef.current = null;
        }
        if (colliderDispose) colliderDispose();
        renderer.dispose();
        if (renderer.domElement.parentNode === container) {
          container.removeChild(renderer.domElement);
        }
      };
    },
    [
      commitTransform,
      effectiveDimensions,
      isMeshShapeSupported,
      meshShape3D,
      objectDimensions,
      orientation,
      preparedModel3D,
      previewColors,
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
          <div ref={containerRef} style={styles.canvasContainer} />
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
