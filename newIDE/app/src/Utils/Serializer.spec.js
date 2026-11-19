// @flow
import {
  serializeToJSObject,
  serializeToJSON,
  serializeToObjectAsset,
  unserializeFromJSObject,
} from './Serializer';

describe('temporary serializer elements', () => {
  it.each([
    ['serializeToJSObject', target => serializeToJSObject(target)],
    ['serializeToJSON', target => serializeToJSON(target)],
    ['unserializeFromJSObject', target => unserializeFromJSObject(target, {})],
  ])('%s releases the element when the target throws', (_, run) => {
    let element;
    const error = new Error('Serialization interrupted');
    const fail = temporary => {
      element = temporary;
      throw error;
    };
    try {
      expect(() => run({ serializeTo: fail, unserializeFrom: fail })).toThrow(
        error
      );
      expect(element.ptr).toBe(0);
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
    let element;
    let resourceNames;
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
      expect(element.ptr).toBe(0);
      expect(resourceNames.ptr).toBe(0);
    } finally {
      serializeTo.mockRestore();
      if (element && element.ptr) element.delete();
      if (resourceNames && resourceNames.ptr) resourceNames.delete();
      dependencies.delete();
      project.delete();
    }
  });
});
