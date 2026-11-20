// @flow
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
    let element: ?gdSerializerElement = null;
    const error = new Error('Serialization interrupted');
    const fail = (temporary: gdSerializerElement) => {
      element = temporary;
      throw error;
    };
    try {
      expect(() => run({ serializeTo: fail, unserializeFrom: fail })).toThrow(
        error
      );
      expect(element ? element.ptr : undefined).toBe(0);
    } finally {
      if (element && element.ptr) element.delete();
    }
  });

  it('releases both temporary resources when object asset serialization throws', () => {
    const gd: libGDevelop = global.gd;
    const project = gd.ProjectHelper.createNewGDJSProject();
    const object = project
      .getObjects()
      .insertNewObject(project, 'Sprite', 'Sprite', 0);
    const dependencies = new gd.ExtensionDependencyCache();
    let element: ?gdSerializerElement = null;
    let resourceNames: ?gdVectorString = null;
    const error = new Error('Asset serialization interrupted');
    const serializeTo = jest
      .spyOn(global.gd.ObjectAssetSerializer, 'serializeTo')
      .mockImplementation((project, object, name, output, names) => {
        element = output;
        resourceNames = names;
        throw error;
      });
    try {
      expect(() =>
        serializeToObjectAsset(project, object, 'Sprite', [], dependencies)
      ).toThrow(error);
      expect(element ? element.ptr : undefined).toBe(0);
      expect(resourceNames ? resourceNames.ptr : undefined).toBe(0);
    } finally {
      serializeTo.mockRestore();
      if (element && element.ptr) element.delete();
      if (resourceNames && resourceNames.ptr) resourceNames.delete();
      dependencies.delete();
      project.delete();
    }
  });
});
