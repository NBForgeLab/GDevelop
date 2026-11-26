import * as React from 'react';
import { act, create } from 'react-test-renderer';
import Context, {
  UnsavedChangesContextProvider,
} from './UnsavedChangesContext';

it('only notifies consumers when the dirty flag changes', () => {
  const values: Array<React.ContextType<typeof Context>> = [];
  const Consumer = React.memo(() => {
    values.push(React.useContext(Context));
    return null;
  });
  const render = () => (
    <UnsavedChangesContextProvider>
      <Consumer />
    </UnsavedChangesContextProvider>
  );
  const tree = create(render());
  try {
    tree.update(render());
    expect(values).toHaveLength(1);
    act(() => values[0].triggerUnsavedChanges());
    act(() => values[0].triggerUnsavedChanges());
    expect(values.map((value) => value.hasUnsavedChanges)).toEqual([
      false,
      true,
    ]);
    expect(values[0].getChangesCount()).toBe(2);
    act(() => values[0].sealUnsavedChanges());
    expect(values.map((value) => value.hasUnsavedChanges)).toEqual([
      false,
      true,
      false,
    ]);
  } finally {
    tree.unmount();
  }
});
