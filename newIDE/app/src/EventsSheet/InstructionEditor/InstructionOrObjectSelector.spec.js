import * as React from 'react';
import { act, create } from 'react-test-renderer';
import InstructionOrObjectSelector from './InstructionOrObjectSelector';
import { ProjectScopedContainersAccessor } from '../../InstructionOrExpression/EventsScope';
import {
  enumerateAllInstructions,
  enumerateFreeInstructions,
} from '../../InstructionOrExpression/EnumerateInstructions';
import SearchBar from '../../UI/SearchBar';
import ReadOnlyTreeView from '../../UI/TreeView/ReadOnlyTreeView';

jest.mock('../../InstructionOrExpression/EnumerateInstructions', () => ({
  enumerateAllInstructions: jest.fn(),
  enumerateFreeInstructions: jest.fn(),
}));
jest.mock('../../UI/SearchBar', () => 'search-bar');
jest.mock('../../UI/TreeView/ReadOnlyTreeView', () => 'read-only-tree');
jest.mock('../../ObjectsRendering/ObjectsRenderingService', () => ({
  getThumbnail: () => null,
}));
jest.mock('../../UI/Tabs', () => ({ Tabs: () => null }));
jest.mock('react-virtualized', () => ({
  ...jest.requireActual('react-virtualized'),
  AutoSizer: ({ children }) => children({ height: 400 }),
}));
jest.mock(
  '../../ResourcesList/ResourcePreview/Resource3DPreviewContext',
  () => ({
    useOnResource3DPreviewRendered: () => {},
  })
);

it('enumerates once while typing and rebuilds once on an explicit refresh', () => {
  const project = global.gd.ProjectHelper.createNewGDJSProject();
  const layout = project.insertNewLayout('Scene', 0);
  layout.getObjects().insertNewObject(project, 'Sprite', 'Player', 0);
  const scope = { project, layout };
  const containers = new ProjectScopedContainersAccessor(scope);
  const i18n = { _: message => message.id || message };
  const instruction = {
    type: 'Keyboard',
    displayedName: 'Keyboard',
    fullGroupName: 'Input',
    description: '',
    scope: { extension: { name: 'Input' } },
    isRelevantForLayoutEvents: true,
  };
  enumerateFreeInstructions.mockReturnValue([]);
  enumerateAllInstructions.mockReturnValue([instruction]);
  const ref = React.createRef();
  const notify = jest.fn();
  let tree;
  try {
    act(() => {
      tree = create(
        <InstructionOrObjectSelector
          ref={ref}
          project={project}
          scope={scope}
          projectScopedContainersAccessor={containers}
          i18n={i18n}
          currentTab="objects"
          isCondition
          onSearchStartOrReset={notify}
        />
      );
    });
    const input = () => tree.root.findByType(SearchBar).props;
    const matchingNames = () => {
      const results = tree.root
        .findAllByType(ReadOnlyTreeView)[0]
        .props.items.find(item => item.content.getId() === 'instructions');
      return results
        ? results.children
            .filter(item => item.content.getInstructionMetadata)
            .map(item => item.content.getName())
        : [];
    };
    act(() => input().onChange('key'));
    act(() => input().onChange('keyboard'));
    expect(enumerateAllInstructions).toHaveBeenCalledTimes(1);
    expect(enumerateFreeInstructions).toHaveBeenCalledTimes(1);
    expect(matchingNames()).toEqual(['Keyboard']);
    enumerateAllInstructions.mockReturnValue([
      { ...instruction, displayedName: 'Keyboard shortcut' },
    ]);
    act(() => ref.current.reEnumerateInstructions(i18n));
    expect(input().value).toBe('keyboard');
    expect(matchingNames()).toEqual(['Keyboard shortcut']);
    expect(enumerateAllInstructions).toHaveBeenCalledTimes(2);
    expect(enumerateFreeInstructions).toHaveBeenCalledTimes(2);
    act(() => input().onChange(''));
    expect(notify).toHaveBeenCalledTimes(2);
  } finally {
    if (tree) act(() => tree.unmount());
    project.delete();
  }
});
