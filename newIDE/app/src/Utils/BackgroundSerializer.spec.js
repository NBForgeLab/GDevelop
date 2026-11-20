// @flow
import {
  serializeToJSONInBackground,
  serializeToJSObjectInBackground,
} from './BackgroundSerializer';

const gd: libGDevelop = global.gd;

describe('BackgroundSerializer', () => {
  it('disposes the owned snapshot if copying into JavaScript fails', async () => {
    const project = gd.ProjectHelper.createNewGDJSProject();
    // Keep the original implementation to delegate to it from the mock.
    const create = gd.createOwnedBinarySnapshot;
    const free = jest.spyOn(gd.BinarySerializer, 'freeBinarySnapshot');
    const factory = jest
      .spyOn(gd, 'createOwnedBinarySnapshot')
      .mockImplementation(element => {
        const snapshot = create(element);
        // Spy on the method instead of overwriting it: the snapshot handle is
        // typed as read-only, and its disposal protocol must be preserved.
        jest.spyOn(snapshot, 'copyBytes').mockImplementation(() => {
          throw new Error('Copy failed');
        });
        return snapshot;
      });
    try {
      await expect(serializeToJSONInBackground(project)).rejects.toThrow(
        'Copy failed'
      );
      expect(free).toHaveBeenCalledTimes(1);
    } finally {
      factory.mockRestore();
      free.mockRestore();
      project.delete();
    }
  });

  it('releases the root element when the target fails to serialize', async () => {
    const project = gd.ProjectHelper.createNewGDJSProject();
    let element: ?gdSerializerElement = null;
    jest.spyOn(project, 'serializeTo').mockImplementation(output => {
      element = output;
      throw new Error('Interrupted save');
    });
    try {
      await expect(serializeToJSONInBackground(project)).rejects.toThrow(
        'Interrupted save'
      );
      expect(element ? element.ptr : undefined).toBe(0);
    } finally {
      if (element && element.ptr) element.delete();
      project.delete();
    }
  });

  it('releases the native binary snapshot if reading its size fails', async () => {
    const project = gd.ProjectHelper.createNewGDJSProject();
    const createSnapshot = jest.spyOn(
      gd.BinarySerializer,
      'createBinarySnapshot'
    );
    const freeSnapshot = jest.spyOn(gd.BinarySerializer, 'freeBinarySnapshot');
    const getSize = jest
      .spyOn(gd.BinarySerializer, 'getLastBinarySnapshotSize')
      .mockImplementation(() => {
        throw new Error('Snapshot unavailable');
      });
    try {
      await expect(serializeToJSONInBackground(project)).rejects.toThrow(
        'Snapshot unavailable'
      );
      expect(freeSnapshot).toHaveBeenCalledWith(
        createSnapshot.mock.results[0].value
      );
    } finally {
      if (!freeSnapshot.mock.calls.length && createSnapshot.mock.results.length)
        gd.BinarySerializer.freeBinarySnapshot(
          createSnapshot.mock.results[0].value
        );
      getSize.mockRestore();
      freeSnapshot.mockRestore();
      createSnapshot.mockRestore();
      project.delete();
    }
  });

  it('serializes a project to JSON via the worker factory', async () => {
    const project = gd.ProjectHelper.createNewGDJSProject();
    project.setName('TestBackgroundJsonProject');
    try {
      const json = await serializeToJSONInBackground(project);
      const parsed = JSON.parse(json);
      expect(parsed.properties.name).toBe('TestBackgroundJsonProject');
    } finally {
      project.delete();
    }
  });

  it('serializes a project to a JS object across tests even with resetMocks enabled', async () => {
    const project = gd.ProjectHelper.createNewGDJSProject();
    project.setName('TestBackgroundObjectProject');
    try {
      const serialized = await serializeToJSObjectInBackground(project);
      expect(serialized.properties.name).toBe('TestBackgroundObjectProject');
    } finally {
      project.delete();
    }
  });
});
