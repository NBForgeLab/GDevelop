// @flow
import {
  getEffectiveShapeDimensions,
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
  });
});
