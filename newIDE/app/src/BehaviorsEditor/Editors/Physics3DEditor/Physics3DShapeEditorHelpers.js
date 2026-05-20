// @flow

export type Vector3Like = {|
  x: number,
  y: number,
  z: number,
|};

export type ObjectDimensions = {|
  width: number,
  height: number,
  depth: number,
|};

export type EffectiveShapeDimensions = {|
  radius: number,
  width: number,
  height: number,
  depth: number,
|};

export type Physics3DShape =
  | 'Box'
  | 'Capsule'
  | 'Sphere'
  | 'Cylinder'
  | 'Triangle'
  | 'Mesh';
export type Physics3DShapeOrientation = 'X' | 'Y' | 'Z';
export type Model3DLocationPoint = [
  number | null,
  number | null,
  number | null,
];
export type Model3DDefaultTransform = {|
  rotationX: number,
  rotationY: number,
  rotationZ: number,
  keepAspectRatio: boolean,
  originLocation: string,
  centerLocation: string,
|};

export const epsilon = 1e-12;

/**
 * Build the triangular-prism vertex buffer shared by the IDE preview and the
 * runtime debug overlay. The prism has an isosceles triangular cross-section
 * with the apex at the bottom, extruded along the Z axis.
 */
export const createTriangularPrismVertices = (
  width: number,
  height: number,
  depth: number
): Float32Array => {
  const hw = width / 2;
  const hh = height / 2;
  const hd = depth / 2;
  // 2 triangular faces + 3 rectangular faces split into 2 triangles each.
  // Listed explicitly so the winding order is correct for computeVertexNormals.
  return new Float32Array([
    // Front face (z = -hd)
    -hw,
    hh,
    -hd,
    0,
    -hh,
    -hd,
    hw,
    hh,
    -hd,
    // Back face (z = +hd)
    -hw,
    hh,
    hd,
    hw,
    hh,
    hd,
    0,
    -hh,
    hd,
    // Top face
    -hw,
    hh,
    -hd,
    hw,
    hh,
    -hd,
    hw,
    hh,
    hd,
    -hw,
    hh,
    -hd,
    hw,
    hh,
    hd,
    -hw,
    hh,
    hd,
    // Right face
    hw,
    hh,
    -hd,
    0,
    -hh,
    -hd,
    0,
    -hh,
    hd,
    hw,
    hh,
    -hd,
    0,
    -hh,
    hd,
    hw,
    hh,
    hd,
    // Left face
    0,
    -hh,
    -hd,
    -hw,
    hh,
    -hd,
    -hw,
    hh,
    hd,
    0,
    -hh,
    -hd,
    -hw,
    hh,
    hd,
    0,
    -hh,
    hd,
  ]);
};

export const getPhysics3DPreviewCameraFrameKey = ({
  modelResourceName,
  objectDimensions,
  modelDefaultTransform,
}: {|
  modelResourceName: string,
  objectDimensions: ObjectDimensions,
  modelDefaultTransform: Model3DDefaultTransform,
|}): string =>
  [
    modelResourceName,
    objectDimensions.width,
    objectDimensions.height,
    objectDimensions.depth,
    modelDefaultTransform.rotationX,
    modelDefaultTransform.rotationY,
    modelDefaultTransform.rotationZ,
    modelDefaultTransform.keepAspectRatio ? '1' : '0',
    modelDefaultTransform.originLocation,
    modelDefaultTransform.centerLocation,
  ].join(';');

const parsePropertyNumber = (
  properties: gdMapStringPropertyDescriptor,
  propertyName: string,
  defaultValue: number = 0
) => {
  if (!properties.has(propertyName)) return defaultValue;
  const value = parseFloat(properties.get(propertyName).getValue());
  return Number.isNaN(value) ? defaultValue : value;
};

const getPropertyValue = (
  properties: gdMapStringPropertyDescriptor,
  propertyName: string,
  defaultValue: string = ''
) => {
  return properties.has(propertyName)
    ? properties.get(propertyName).getValue()
    : defaultValue;
};

export const getModel3DDefaultTransformFromProperties = (
  properties: gdMapStringPropertyDescriptor
): Model3DDefaultTransform => ({
  rotationX: parsePropertyNumber(properties, 'rotationX', 90),
  rotationY: parsePropertyNumber(properties, 'rotationY'),
  rotationZ: parsePropertyNumber(properties, 'rotationZ'),
  keepAspectRatio:
    getPropertyValue(properties, 'keepAspectRatio', 'true') === 'true',
  originLocation: getPropertyValue(properties, 'originLocation', 'ModelOrigin'),
  centerLocation: getPropertyValue(properties, 'centerLocation', 'CenteredOnZ'),
});

export const getModel3DPointForLocation = (
  location: string
): Model3DLocationPoint => {
  switch (location) {
    case 'ModelOrigin':
      return [null, null, null];
    case 'CenteredOnZ':
      return [null, null, 0.5];
    case 'ObjectCenter':
      return [0.5, 0.5, 0.5];
    case 'BottomCenterZ':
      return [0.5, 0.5, 0];
    case 'BottomCenterY':
      return [0.5, 1, 0.5];
    case 'TopLeft':
      return [0, 0, 0];
    default:
      return [null, null, null];
  }
};

export const getRuntimeObjectDimensions = ({
  objectDimensions,
  modelSize,
  keepAspectRatio,
}: {|
  objectDimensions: ObjectDimensions,
  modelSize: ObjectDimensions,
  keepAspectRatio: boolean,
|}): ObjectDimensions => {
  if (!keepAspectRatio) return objectDimensions;

  const modelWidth = Math.abs(modelSize.width);
  const modelHeight = Math.abs(modelSize.height);
  const modelDepth = Math.abs(modelSize.depth);
  const widthRatio =
    modelWidth < epsilon ? Infinity : objectDimensions.width / modelWidth;
  const heightRatio =
    modelHeight < epsilon ? Infinity : objectDimensions.height / modelHeight;
  const depthRatio =
    modelDepth < epsilon ? Infinity : objectDimensions.depth / modelDepth;
  const scaleRatio = Math.min(widthRatio, heightRatio, depthRatio);

  if (!Number.isFinite(scaleRatio)) return objectDimensions;

  return {
    width: modelWidth * scaleRatio,
    height: modelHeight * scaleRatio,
    depth: modelDepth * scaleRatio,
  };
};

export const getEffectiveShapeDimensions = ({
  shape,
  orientation,
  shapeDimensionA,
  shapeDimensionB,
  shapeDimensionC,
  objectDimensions,
}: {|
  shape: Physics3DShape,
  orientation: Physics3DShapeOrientation,
  shapeDimensionA: number,
  shapeDimensionB: number,
  shapeDimensionC: number,
  objectDimensions: ObjectDimensions,
|}): EffectiveShapeDimensions => {
  let { width, height, depth } = objectDimensions;

  // Match Physics3DRuntimeBehavior._createNewShapeSettingsWithoutMassCenterOffset.
  if (orientation === 'X') {
    const swap = depth;
    depth = width;
    width = swap;
  } else if (orientation === 'Y') {
    const swap = depth;
    depth = height;
    height = swap;
  }

  if (shape === 'Box' || shape === 'Triangle') {
    return {
      radius: 0,
      width: shapeDimensionA > 0 ? shapeDimensionA : objectDimensions.width,
      height: shapeDimensionB > 0 ? shapeDimensionB : objectDimensions.height,
      depth: shapeDimensionC > 0 ? shapeDimensionC : objectDimensions.depth,
    };
  }

  if (shape === 'Sphere' || shape === 'Mesh') {
    const radius =
      shapeDimensionA > 0
        ? shapeDimensionA
        : Math.pow(
            objectDimensions.width *
              objectDimensions.height *
              objectDimensions.depth,
            1 / 3
          ) / 2;
    return {
      radius,
      width: radius * 2,
      height: radius * 2,
      depth: radius * 2,
    };
  }

  const radius =
    shapeDimensionA > 0 ? shapeDimensionA : Math.sqrt(width * height) / 2;
  const shapeDepth = shapeDimensionB > 0 ? shapeDimensionB : depth;

  return {
    radius,
    width: orientation === 'X' ? shapeDepth : radius * 2,
    height: orientation === 'Y' ? shapeDepth : radius * 2,
    depth: orientation === 'Z' ? shapeDepth : radius * 2,
  };
};

const getScaledRadius = ({
  radius,
  orientation,
  scale,
}: {|
  radius: number,
  orientation: Physics3DShapeOrientation,
  scale: Vector3Like,
|}) => {
  if (orientation === 'X')
    return (radius * (Math.abs(scale.y) + Math.abs(scale.z))) / 2;
  if (orientation === 'Y')
    return (radius * (Math.abs(scale.x) + Math.abs(scale.z))) / 2;
  return (radius * (Math.abs(scale.x) + Math.abs(scale.y))) / 2;
};

const getScaledDepth = ({
  depth,
  orientation,
  scale,
}: {|
  depth: number,
  orientation: Physics3DShapeOrientation,
  scale: Vector3Like,
|}) => {
  if (orientation === 'X') return depth * Math.abs(scale.x);
  if (orientation === 'Y') return depth * Math.abs(scale.y);
  return depth * Math.abs(scale.z);
};

export const getUpdatedShapeValuesFromTransform = ({
  shape,
  orientation,
  effectiveDimensions,
  position,
  scale,
}: {|
  shape: Physics3DShape,
  orientation: Physics3DShapeOrientation,
  effectiveDimensions: EffectiveShapeDimensions,
  position: Vector3Like,
  scale: Vector3Like,
|}): {|
  shapeDimensionA: number,
  shapeDimensionB: number,
  shapeDimensionC: number,
  shapeOffsetX: number,
  shapeOffsetY: number,
  shapeOffsetZ: number,
|} => {
  const commonValues = {
    shapeOffsetX: position.x,
    shapeOffsetY: position.y,
    shapeOffsetZ: position.z,
  };

  if (shape === 'Box' || shape === 'Triangle') {
    return {
      shapeDimensionA: effectiveDimensions.width * Math.abs(scale.x),
      shapeDimensionB: effectiveDimensions.height * Math.abs(scale.y),
      shapeDimensionC: effectiveDimensions.depth * Math.abs(scale.z),
      ...commonValues,
    };
  }

  if (shape === 'Sphere') {
    return {
      shapeDimensionA:
        effectiveDimensions.radius *
        Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)),
      shapeDimensionB: 0,
      shapeDimensionC: 0,
      ...commonValues,
    };
  }

  return {
    shapeDimensionA: getScaledRadius({
      radius: effectiveDimensions.radius,
      orientation,
      scale,
    }),
    shapeDimensionB: getScaledDepth({
      depth:
        orientation === 'X'
          ? effectiveDimensions.width
          : orientation === 'Y'
          ? effectiveDimensions.height
          : effectiveDimensions.depth,
      orientation,
      scale,
    }),
    shapeDimensionC: 0,
    ...commonValues,
  };
};
