import * as React from 'react';
import SceneEditor from './index';
import { hasMixedValues } from '../PropertiesEditor';
import { prepareInstancesEditorSettings } from '../InstancesEditor/InstancesEditorSettings';
import { type PreviewDebuggerServer } from '../ExportAndShare/PreviewLauncher.flow';
import { type SceneEditorsDisplayInterface } from './EditorsDisplay.flow';
import { type PrimitiveValueField } from '../PropertiesEditor/PropertiesEditorSchema';

jest.mock('../ObjectEditor/ObjectsEditorService', () => ({}));
jest.mock('../UI/EditorMosaic', () => () => null);
jest.mock('../ObjectEditor/ObjectEditorDialog', () => () => null);
jest.mock('three/src/math/MathUtils', () => ({ generateUUID: () => 'uuid' }));
jest.mock('../ObjectsRendering/PixiResourcesLoader', () => ({}));
jest.mock('../ObjectsRendering/ObjectsRenderingService', () => ({}));
jest.mock('./MosaicEditorsDisplay', () => () => null);
jest.mock('./SwipeableDrawerEditorsDisplay', () => () => null);

it('refreshes instance panels and serializes each edit once across previews', () => {
  const project = (
    (global as any).gd as libGDevelop
  ).ProjectHelper.createNewGDJSProject();
  const layout = project.insertNewLayout('Scene', 0);
  const instances = layout.getInitialInstances();
  const instance = instances.insertNewInitialInstance();
  const preview = {
    getExistingEmbeddedGameFrameDebuggerIds: jest.fn().mockReturnValue([]),
    sendMessage: jest.fn(),
  };
  try {
    const editor = new SceneEditor({
      initialInstances: instances,
      getInitialInstancesEditorSettings: () =>
        prepareInstancesEditorSettings({}, 1920),
      previewDebuggerServer: preview as unknown as PreviewDebuggerServer,
    } as unknown as React.ComponentProps<typeof SceneEditor>);
    const editorDisplay = {
      forceUpdateInstancesList: jest.fn(),
      forceUpdatePropertiesEditor: jest.fn(),
    };
    editor.editorDisplay =
      editorDisplay as unknown as SceneEditorsDisplayInterface;
    const renderScene = jest
      .spyOn(editor, 'forceUpdate')
      .mockImplementation(() => {});
    const serialize = jest.spyOn(instance, 'serializeTo');
    editor._onInstancesModified([instance]);
    expect(serialize).not.toHaveBeenCalled();
    preview.getExistingEmbeddedGameFrameDebuggerIds.mockReturnValue([
      'one',
      'two',
    ]);
    instance.setX(42);
    editor._onInstancesModified([instance]);
    expect(serialize).toHaveBeenCalledTimes(1);
    expect(
      preview.sendMessage.mock.calls.map(([id, message]) => [
        id,
        message.payload.instances[0].x,
      ])
    ).toEqual([
      ['one', 42],
      ['two', 42],
    ]);
    expect(renderScene).not.toHaveBeenCalled();
    expect(editorDisplay.forceUpdateInstancesList).toHaveBeenCalledTimes(2);
    expect(editorDisplay.forceUpdatePropertiesEditor).toHaveBeenCalledTimes(2);
  } finally {
    project.delete();
  }
});

it('avoids a redundant property read for a single instance and detects mixed selections', () => {
  const field: PrimitiveValueField = {
    name: 'x',
    valueType: 'number',
    getValue: jest.fn((instance) => instance.x),
    setValue: jest.fn(),
  };
  const first = { x: 42 };
  expect(hasMixedValues({ instances: [first], field })).toBe(false);
  expect(field.getValue).not.toHaveBeenCalled();
  expect(hasMixedValues({ instances: [first, { x: 42 }], field })).toBe(false);
  expect(hasMixedValues({ instances: [first, { x: 43 }], field })).toBe(true);
});
