import {
  serializeToJSObject,
  serializeToJSON,
  serializeToObjectAsset,
  unserializeFromJSObject,
} from './Serializer';

describe('temporary serializer elements', () => {
  it.each([
    ['serializeToJSObject', (target: any) => serializeToJSObject(target)],
    ['serializeToJSON', (target: any) => serializeToJSON(target)],
    [
      'unserializeFromJSObject',
      (target: any) => unserializeFromJSObject(target, {}),
    ],
  ])('%s releases the element when the target throws', (_, run) => {
    const captured: { element: gdSerializerElement | null } = {
      element: null,
    };
    const error = new Error('Serialization interrupted');
    const fail = (temporary: gdSerializerElement) => {
      captured.element = temporary;
      throw error;
    };
    try {
      expect(() => run({ serializeTo: fail, unserializeFrom: fail })).toThrow(
        error
      );
      expect(captured.element ? captured.element.ptr : undefined).toBe(0);
    } finally {
      if (captured.element && captured.element.ptr) captured.element.delete();
    }
  });

  it('releases both temporary resources when object asset serialization throws', () => {
    const gd: libGDevelop = (global as any).gd;
    const project = gd.ProjectHelper.createNewGDJSProject();
    const object = project
      .getObjects()
      .insertNewObject(project, 'Sprite', 'Sprite', 0);
    const dependencies = new gd.ExtensionDependencyCache();
    const captured: {
      element: gdSerializerElement | null;
      resourceNames: gdVectorString | null;
    } = {
      element: null,
      resourceNames: null,
    };
    const error = new Error('Asset serialization interrupted');
    const serializeTo = jest
      .spyOn(
        ((global as any).gd as libGDevelop).ObjectAssetSerializer,
        'serializeTo'
      )
      .mockImplementation((project, object, name, output, names) => {
        captured.element = output;
        captured.resourceNames = names;
        throw error;
      });
    try {
      expect(() =>
        serializeToObjectAsset(project, object, 'Sprite', [], dependencies)
      ).toThrow(error);
      expect(captured.element ? captured.element.ptr : undefined).toBe(0);
      expect(
        captured.resourceNames ? captured.resourceNames.ptr : undefined
      ).toBe(0);
    } finally {
      serializeTo.mockRestore();
      if (captured.element && captured.element.ptr) captured.element.delete();
      if (captured.resourceNames && captured.resourceNames.ptr)
        captured.resourceNames.delete();
      dependencies.delete();
      project.delete();
    }
  });
});
