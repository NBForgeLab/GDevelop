// @flow
import {
  createTriangularPrismVertices,
  getEffectiveShapeDimensions,
  getPhysics3DPreviewCameraFrameKey,
  getModel3DDefaultTransformFromProperties,
  getModel3DPointForLocation,
  getRuntimeObjectDimensions,
  getUpdatedShapeValuesFromTransform,
} from './Physics3DShapeEditorHelpers';

const makeProperties = (values: { [string]: string }): any => ({
  has: (name: string) => values[name] !== undefined,
  get: (name: string) => ({
    getValue: () => values[name] || '',
  }),
});

const expectDimensionsToBeCloseTo = (
  actual: {|
    radius: number,
    width: number,
    height: number,
    depth: number,
  |},
  expected: {|
    radius: number,
    width: number,
    height: number,
    depth: number,
  |}
) => {
  expect(actual.radius).toBeCloseTo(expected.radius, 10);
  expect(actual.width).toBeCloseTo(expected.width, 10);
  expect(actual.height).toBeCloseTo(expected.height, 10);
  expect(actual.depth).toBeCloseTo(expected.depth, 10);
};

const defaultModelDefaultTransform = {
  rotationX: 90,
  rotationY: 0,
  rotationZ: -90,
  keepAspectRatio: true,
  originLocation: 'ModelOrigin',
  centerLocation: 'ObjectCenter',
};

const getFrameKey = (overrides: any = {}) =>
  getPhysics3DPreviewCameraFrameKey({
    modelResourceName:
      overrides.modelResourceName !== undefined
        ? overrides.modelResourceName
        : 'Fence Middle.glb',
    objectDimensions: overrides.objectDimensions || {
      width: 100,
      height: 50,
      depth: 20,
    },
    modelDefaultTransform: {
      ...defaultModelDefaultTransform,
      ...(overrides.modelDefaultTransform || {}),
    },
  });

describe('Physics3DShapeEditorHelpers', () => {
  it('reads the 3D model default transform from object properties', () => {
    expect(
      getModel3DDefaultTransformFromProperties(
        makeProperties({
          rotationX: '90',
          rotationY: '0',
          rotationZ: '-90',
          keepAspectRatio: 'true',
          originLocation: 'ModelOrigin',
          centerLocation: 'ObjectCenter',
        })
      )
    ).toStrictEqual({
      rotationX: 90,
      rotationY: 0,
      rotationZ: -90,
      keepAspectRatio: true,
      originLocation: 'ModelOrigin',
      centerLocation: 'ObjectCenter',
    });

    expect(
      getModel3DDefaultTransformFromProperties(makeProperties({}))
    ).toStrictEqual({
      rotationX: 90,
      rotationY: 0,
      rotationZ: 0,
      keepAspectRatio: true,
      originLocation: 'ModelOrigin',
      centerLocation: 'CenteredOnZ',
    });

    expect(
      getModel3DDefaultTransformFromProperties(
        makeProperties({
          rotationX: 'not-a-number',
          keepAspectRatio: 'false',
        })
      )
    ).toStrictEqual({
      rotationX: 90,
      rotationY: 0,
      rotationZ: 0,
      keepAspectRatio: false,
      originLocation: 'ModelOrigin',
      centerLocation: 'CenteredOnZ',
    });
  });

  it('uses the same model point presets as the 3D model runtime object', () => {
    expect(getModel3DPointForLocation('ModelOrigin')).toStrictEqual([
      null,
      null,
      null,
    ]);
    expect(getModel3DPointForLocation('CenteredOnZ')).toStrictEqual([
      null,
      null,
      0.5,
    ]);
    expect(getModel3DPointForLocation('ObjectCenter')).toStrictEqual([
      0.5,
      0.5,
      0.5,
    ]);
    expect(getModel3DPointForLocation('BottomCenterY')).toStrictEqual([
      0.5,
      1,
      0.5,
    ]);
    expect(getModel3DPointForLocation('BottomCenterZ')).toStrictEqual([
      0.5,
      0.5,
      0,
    ]);
    expect(getModel3DPointForLocation('TopLeft')).toStrictEqual([0, 0, 0]);
    expect(getModel3DPointForLocation('unknown')).toStrictEqual([
      null,
      null,
      null,
    ]);
  });

  it('matches Model3D runtime dimensions when aspect ratio is preserved', () => {
    expect(
      getRuntimeObjectDimensions({
        objectDimensions: { width: 100, height: 100, depth: 100 },
        modelSize: { width: 2, height: 4, depth: 1 },
        keepAspectRatio: true,
      })
    ).toStrictEqual({ width: 50, height: 100, depth: 25 });

    expect(
      getRuntimeObjectDimensions({
        objectDimensions: { width: 100, height: 100, depth: 100 },
        modelSize: { width: 2, height: 4, depth: 1 },
        keepAspectRatio: false,
      })
    ).toStrictEqual({ width: 100, height: 100, depth: 100 });

    expect(
      getRuntimeObjectDimensions({
        objectDimensions: { width: 100, height: 80, depth: 60 },
        modelSize: { width: -5, height: 10, depth: 20 },
        keepAspectRatio: true,
      })
    ).toStrictEqual({ width: 15, height: 30, depth: 60 });

    expect(
      getRuntimeObjectDimensions({
        objectDimensions: { width: 100, height: 80, depth: 60 },
        modelSize: { width: 0, height: 0, depth: 0 },
        keepAspectRatio: true,
      })
    ).toStrictEqual({ width: 100, height: 80, depth: 60 });
  });

  it('uses Physics3D runtime fallbacks for default shape dimensions', () => {
    expect(
      getEffectiveShapeDimensions({
        shape: 'Box',
        orientation: 'Z',
        shapeDimensionA: 0,
        shapeDimensionB: 0,
        shapeDimensionC: 0,
        objectDimensions: { width: 100, height: 50, depth: 20 },
      })
    ).toStrictEqual({ radius: 0, width: 100, height: 50, depth: 20 });

    expect(
      getEffectiveShapeDimensions({
        shape: 'Triangle',
        orientation: 'Z',
        shapeDimensionA: 0,
        shapeDimensionB: 0,
        shapeDimensionC: 0,
        objectDimensions: { width: 100, height: 50, depth: 20 },
      })
    ).toStrictEqual({ radius: 0, width: 100, height: 50, depth: 20 });

    expect(
      getEffectiveShapeDimensions({
        shape: 'Capsule',
        orientation: 'X',
        shapeDimensionA: 0,
        shapeDimensionB: 0,
        shapeDimensionC: 0,
        objectDimensions: { width: 100, height: 50, depth: 20 },
      })
    ).toStrictEqual({
      radius: Math.sqrt(20 * 50) / 2,
      width: 100,
      height: Math.sqrt(20 * 50),
      depth: Math.sqrt(20 * 50),
    });

    expect(
      getEffectiveShapeDimensions({
        shape: 'Sphere',
        orientation: 'Z',
        shapeDimensionA: 0,
        shapeDimensionB: 0,
        shapeDimensionC: 0,
        objectDimensions: { width: 100, height: 50, depth: 20 },
      })
    ).toStrictEqual({
      radius: Math.pow(100 * 50 * 20, 1 / 3) / 2,
      width: Math.pow(100 * 50 * 20, 1 / 3),
      height: Math.pow(100 * 50 * 20, 1 / 3),
      depth: Math.pow(100 * 50 * 20, 1 / 3),
    });

    expect(
      getEffectiveShapeDimensions({
        shape: 'Mesh',
        orientation: 'Z',
        shapeDimensionA: 0,
        shapeDimensionB: 0,
        shapeDimensionC: 0,
        objectDimensions: { width: 100, height: 50, depth: 20 },
      })
    ).toStrictEqual({
      radius: Math.pow(100 * 50 * 20, 1 / 3) / 2,
      width: Math.pow(100 * 50 * 20, 1 / 3),
      height: Math.pow(100 * 50 * 20, 1 / 3),
      depth: Math.pow(100 * 50 * 20, 1 / 3),
    });
  });

  it('resolves capsule and cylinder default dimensions for every orientation', () => {
    const objectDimensions = { width: 100, height: 50, depth: 20 };

    expectDimensionsToBeCloseTo(
      getEffectiveShapeDimensions({
        shape: 'Cylinder',
        orientation: 'X',
        shapeDimensionA: 0,
        shapeDimensionB: 0,
        shapeDimensionC: 0,
        objectDimensions,
      }),
      {
        radius: Math.sqrt(20 * 50) / 2,
        width: 100,
        height: Math.sqrt(20 * 50),
        depth: Math.sqrt(20 * 50),
      }
    );

    expectDimensionsToBeCloseTo(
      getEffectiveShapeDimensions({
        shape: 'Capsule',
        orientation: 'Y',
        shapeDimensionA: 0,
        shapeDimensionB: 0,
        shapeDimensionC: 0,
        objectDimensions,
      }),
      {
        radius: Math.sqrt(100 * 20) / 2,
        width: Math.sqrt(100 * 20),
        height: 50,
        depth: Math.sqrt(100 * 20),
      }
    );

    expectDimensionsToBeCloseTo(
      getEffectiveShapeDimensions({
        shape: 'Cylinder',
        orientation: 'Z',
        shapeDimensionA: 0,
        shapeDimensionB: 0,
        shapeDimensionC: 0,
        objectDimensions,
      }),
      {
        radius: Math.sqrt(100 * 50) / 2,
        width: Math.sqrt(100 * 50),
        height: Math.sqrt(100 * 50),
        depth: 20,
      }
    );
  });

  it('uses explicit shape dimensions when they are configured', () => {
    expect(
      getEffectiveShapeDimensions({
        shape: 'Box',
        orientation: 'Z',
        shapeDimensionA: 10,
        shapeDimensionB: 20,
        shapeDimensionC: 30,
        objectDimensions: { width: 100, height: 50, depth: 20 },
      })
    ).toStrictEqual({ radius: 0, width: 10, height: 20, depth: 30 });

    expect(
      getEffectiveShapeDimensions({
        shape: 'Capsule',
        orientation: 'X',
        shapeDimensionA: 7,
        shapeDimensionB: 60,
        shapeDimensionC: 123,
        objectDimensions: { width: 100, height: 50, depth: 20 },
      })
    ).toStrictEqual({ radius: 7, width: 60, height: 14, depth: 14 });

    expect(
      getEffectiveShapeDimensions({
        shape: 'Sphere',
        orientation: 'Z',
        shapeDimensionA: 12,
        shapeDimensionB: 99,
        shapeDimensionC: 99,
        objectDimensions: { width: 100, height: 50, depth: 20 },
      })
    ).toStrictEqual({ radius: 12, width: 24, height: 24, depth: 24 });
  });

  it('converts gizmo movement and scaling to Physics3D behavior properties', () => {
    expect(
      getUpdatedShapeValuesFromTransform({
        shape: 'Box',
        orientation: 'Z',
        effectiveDimensions: { radius: 0, width: 20, height: 30, depth: 40 },
        position: { x: 4, y: -8, z: 12 },
        scale: { x: 1.5, y: 2, z: 0.5 },
      })
    ).toStrictEqual({
      shapeDimensionA: 30,
      shapeDimensionB: 60,
      shapeDimensionC: 20,
      shapeOffsetX: 4,
      shapeOffsetY: -8,
      shapeOffsetZ: 12,
    });

    expect(
      getUpdatedShapeValuesFromTransform({
        shape: 'Triangle',
        orientation: 'Z',
        effectiveDimensions: { radius: 0, width: 20, height: 30, depth: 40 },
        position: { x: -4, y: 8, z: -12 },
        scale: { x: 0.5, y: 1.5, z: 2 },
      })
    ).toStrictEqual({
      shapeDimensionA: 10,
      shapeDimensionB: 45,
      shapeDimensionC: 80,
      shapeOffsetX: -4,
      shapeOffsetY: 8,
      shapeOffsetZ: -12,
    });

    expect(
      getUpdatedShapeValuesFromTransform({
        shape: 'Cylinder',
        orientation: 'Y',
        effectiveDimensions: { radius: 10, width: 20, height: 80, depth: 20 },
        position: { x: 1, y: 2, z: 3 },
        scale: { x: 1.2, y: 0.5, z: 0.8 },
      })
    ).toStrictEqual({
      shapeDimensionA: 10,
      shapeDimensionB: 40,
      shapeDimensionC: 0,
      shapeOffsetX: 1,
      shapeOffsetY: 2,
      shapeOffsetZ: 3,
    });

    expect(
      getUpdatedShapeValuesFromTransform({
        shape: 'Sphere',
        orientation: 'Z',
        effectiveDimensions: { radius: 10, width: 20, height: 20, depth: 20 },
        position: { x: 0, y: 0, z: 0 },
        scale: { x: -1.2, y: 0.5, z: 3 },
      })
    ).toStrictEqual({
      shapeDimensionA: 30,
      shapeDimensionB: 0,
      shapeDimensionC: 0,
      shapeOffsetX: 0,
      shapeOffsetY: 0,
      shapeOffsetZ: 0,
    });

    expect(
      getUpdatedShapeValuesFromTransform({
        shape: 'Capsule',
        orientation: 'X',
        effectiveDimensions: { radius: 10, width: 80, height: 20, depth: 20 },
        position: { x: 5, y: 6, z: 7 },
        scale: { x: 0.25, y: -2, z: 0.5 },
      })
    ).toStrictEqual({
      shapeDimensionA: 12.5,
      shapeDimensionB: 20,
      shapeDimensionC: 0,
      shapeOffsetX: 5,
      shapeOffsetY: 6,
      shapeOffsetZ: 7,
    });

    expect(
      getUpdatedShapeValuesFromTransform({
        shape: 'Cylinder',
        orientation: 'Z',
        effectiveDimensions: { radius: 10, width: 20, height: 20, depth: 80 },
        position: { x: -1, y: -2, z: -3 },
        scale: { x: 1.5, y: 0.5, z: -2 },
      })
    ).toStrictEqual({
      shapeDimensionA: 10,
      shapeDimensionB: 160,
      shapeDimensionC: 0,
      shapeOffsetX: -1,
      shapeOffsetY: -2,
      shapeOffsetZ: -3,
    });
  });

  it('creates the triangular prism vertex buffer used by the preview and debug overlay', () => {
    const vertices = createTriangularPrismVertices(10, 20, 30);
    expect(vertices.length).toBe(72);
    expect(Array.from(vertices.slice(0, 9))).toStrictEqual([
      -5,
      10,
      -15,
      0,
      -10,
      -15,
      5,
      10,
      -15,
    ]);
    expect(Array.from(vertices.slice(9, 18))).toStrictEqual([
      -5,
      10,
      15,
      5,
      10,
      15,
      0,
      -10,
      15,
    ]);
  });

  it('keeps the preview camera frame key tied only to model framing inputs', () => {
    const frameKey = getFrameKey();

    expect(getFrameKey()).toBe(frameKey);

    [
      { modelResourceName: 'Other.glb' },
      { objectDimensions: { width: 120, height: 50, depth: 20 } },
      { objectDimensions: { width: 100, height: 60, depth: 20 } },
      { objectDimensions: { width: 100, height: 50, depth: 30 } },
      { modelDefaultTransform: { rotationX: 45 } },
      { modelDefaultTransform: { rotationY: 10 } },
      { modelDefaultTransform: { rotationZ: 15 } },
      { modelDefaultTransform: { keepAspectRatio: false } },
      { modelDefaultTransform: { originLocation: 'TopLeft' } },
      { modelDefaultTransform: { centerLocation: 'BottomCenterZ' } },
    ].forEach(overrides => {
      expect(getFrameKey(overrides)).not.toBe(frameKey);
    });
  });
});
