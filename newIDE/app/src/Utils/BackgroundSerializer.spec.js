// @flow
import {
  serializeToJSONInBackground,
  serializeToJSObjectInBackground,
} from './BackgroundSerializer';

const gd: libGDevelop = global.gd;

describe('BackgroundSerializer', () => {
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
