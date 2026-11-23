import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import useAlertDialog from '../UI/Alert/useAlertDialog';
import {
  useSerializableObjectCancelableEditor,
  useSerializableObjectsCancelableEditor,
} from './SerializableObjectCancelableEditor';

jest.mock('../UI/Alert/useAlertDialog');

const mockUseAlertDialog = useAlertDialog as jest.Mock;

function mountHook<T>(useEditor: () => T) {
  let editor: T | undefined;
  function Dialog() {
    editor = useEditor();
    return null;
  }
  let tree: any;
  act(() => {
    tree = renderer.create(<Dialog />);
  });
  if (!editor) {
    throw new Error('Expected hook to mount.');
  }
  return { editor, unmount: () => act(() => tree.unmount()) };
}

const useSingleEditor = (
  objects: Map<string, gdVariable>,
  onCancel: () => void
) =>
  useSerializableObjectCancelableEditor({
    serializableObject: objects.get('first'),
    onCancel,
  });
const useMultipleEditor = (
  objects: Map<string, gdVariable>,
  onCancel: () => void
) =>
  useSerializableObjectsCancelableEditor({
    serializableObjects: objects,
    onCancel,
  });

describe.each([
  ['single', useSingleEditor],
  ['multiple', useMultipleEditor],
])('%s cancelable editor', (_, useEditor) => {
  it('restores the original value only after confirmation', async () => {
    const showConfirmation = jest
      .fn()
      .mockResolvedValueOnce(false)
      .mockResolvedValueOnce(true);
    mockUseAlertDialog.mockReturnValue({ showConfirmation });
    const variable = new ((global as any).gd as libGDevelop).Variable();
    variable.setString('original');
    const objects = new Map([['first', variable]]);
    const onCancel = jest.fn();
    const { editor, unmount } = mountHook(() => useEditor(objects, onCancel));
    try {
      variable.setString('edited');
      editor.notifyOfChange();
      await editor.onCancelChanges();
      expect(variable.getString()).toBe('edited');
      expect(onCancel).not.toHaveBeenCalled();
      await editor.onCancelChanges();
      expect(variable.getString()).toBe('original');
      expect(onCancel).toHaveBeenCalledTimes(1);
    } finally {
      unmount();
      variable.delete();
    }
  });

  it('ignores confirmation that arrives after the dialog has closed', async () => {
    let confirm: ((value: boolean) => void) | undefined;
    mockUseAlertDialog.mockReturnValue({
      showConfirmation: () =>
        new Promise((resolve) => {
          confirm = resolve;
        }),
    });
    const variable = new ((global as any).gd as libGDevelop).Variable();
    const objects = new Map([['first', variable]]);
    const onCancel = jest.fn();
    const restore = jest
      .spyOn(variable, 'unserializeFrom')
      .mockImplementation(() => {});
    try {
      const { editor, unmount } = mountHook(() => useEditor(objects, onCancel));
      editor.notifyOfChange();
      const pending = editor.onCancelChanges();
      unmount();
      if (!confirm) {
        throw new Error('Expected confirmation callback.');
      }
      confirm(true);
      await pending;
      expect(restore).not.toHaveBeenCalled();
      expect(onCancel).not.toHaveBeenCalled();
    } finally {
      variable.delete();
    }
  });

  it('releases partially built snapshots when serialization fails', () => {
    mockUseAlertDialog.mockReturnValue({});
    const first = new ((global as any).gd as libGDevelop).Variable();
    const second = new ((global as any).gd as libGDevelop).Variable();
    const elements: Array<gdSerializerElement> = [];
    jest.spyOn(first, 'serializeTo').mockImplementation((element) => {
      elements.push(element);
      if (useEditor === useSingleEditor) throw new Error('Cannot snapshot');
    });
    jest.spyOn(second, 'serializeTo').mockImplementation((element) => {
      elements.push(element);
      throw new Error('Cannot snapshot');
    });
    const objects = new Map([
      ['first', first],
      ['second', second],
    ]);
    try {
      expect(() => mountHook(() => useEditor(objects, jest.fn()))).toThrow(
        'Cannot snapshot'
      );
      expect(elements.map((element) => element.ptr)).toEqual(
        useEditor === useSingleEditor ? [0] : [0, 0]
      );
    } finally {
      elements.forEach((element) => {
        if (element.ptr) element.delete();
      });
      first.delete();
      second.delete();
    }
  });
});
