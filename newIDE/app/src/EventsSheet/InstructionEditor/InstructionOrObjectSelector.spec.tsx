import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import { type I18n as I18nType } from '@lingui/core';
import InstructionOrObjectSelector, {
  type InstructionOrObjectSelectorInterface,
} from './InstructionOrObjectSelector';
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
  AutoSizer: ({
    children,
  }: {
    children: (props: { height: number }) => React.ReactNode;
  }) => children({ height: 400 }),
}));
jest.mock(
  '../../ResourcesList/ResourcePreview/Resource3DPreviewContext',
  () => ({
    useOnResource3DPreviewRendered: () => {},
  })
);

type MockTreeItem = {
  content: {
    getId: () => string;
    getName: () => React.ReactNode;
    getInstructionMetadata?: () => unknown;
  };
  children?: Array<MockTreeItem>;
};

it('enumerates once while typing and rebuilds once on an explicit refresh', () => {
  const project = (
    global.gd as libGDevelop
  ).ProjectHelper.createNewGDJSProject();
  const layout = project.insertNewLayout('Scene', 0);
  layout.getObjects().insertNewObject(project, 'Sprite', 'Player', 0);
  const scope = { project, layout };
  const containers = new ProjectScopedContainersAccessor(scope);
  const i18n = {
    _: (message: { id?: string } | string) =>
      typeof message === 'string' ? message : message.id || '',
  } as unknown as I18nType;
  const instruction = {
    type: 'Keyboard',
    displayedName: 'Keyboard',
    fullGroupName: 'Input',
    description: '',
    scope: { extension: { name: 'Input' } },
    isRelevantForLayoutEvents: true,
  };
  (enumerateFreeInstructions as jest.Mock).mockReturnValue([]);
  (enumerateAllInstructions as jest.Mock).mockReturnValue([instruction]);
  const ref = React.createRef<InstructionOrObjectSelectorInterface>();
  const notify = jest.fn();
  const treeRef: {
    current: {
      root: {
        findByType: (type: React.ElementType) => any;
        findAllByType: (type: React.ElementType) => Array<any>;
      };
      unmount: () => void;
    } | null;
  } = { current: null };
  try {
    act(() => {
      treeRef.current = renderer.create(
        <InstructionOrObjectSelector
          ref={ref}
          project={project}
          scope={scope}
          projectScopedContainersAccessor={containers}
          i18n={i18n}
          currentTab="objects"
          onChangeTab={jest.fn()}
          isCondition
          chosenInstructionType={null}
          onChooseInstruction={jest.fn()}
          chosenObjectName={null}
          onChooseObject={jest.fn()}
          onSearchStartOrReset={notify}
          onOpenExtensionStore={jest.fn()}
        />
      );
    });
    const renderedTree = treeRef.current;
    if (!renderedTree) throw new Error('Expected rendered tree to be created');
    const input = () => renderedTree.root.findByType(SearchBar).props;
    const matchingNames = () => {
      const results = (
        renderedTree.root.findAllByType(ReadOnlyTreeView)[0].props
          .items as Array<MockTreeItem>
      ).find((item) => item.content.getId() === 'instructions');
      return results && results.children
        ? results.children
            .filter((item) => item.content.getInstructionMetadata)
            .map((item) => item.content.getName())
        : [];
    };
    act(() => input().onChange('key'));
    act(() => input().onChange('keyboard'));
    expect(enumerateAllInstructions).toHaveBeenCalledTimes(1);
    expect(enumerateFreeInstructions).toHaveBeenCalledTimes(1);
    expect(matchingNames()).toEqual(['Keyboard']);
    (enumerateAllInstructions as jest.Mock).mockReturnValue([
      { ...instruction, displayedName: 'Keyboard shortcut' },
    ]);
    const selector = ref.current;
    if (!selector) throw new Error('Expected selector ref to be mounted');
    act(() => selector.reEnumerateInstructions(i18n));
    expect(input().value).toBe('keyboard');
    expect(matchingNames()).toEqual(['Keyboard shortcut']);
    expect(enumerateAllInstructions).toHaveBeenCalledTimes(2);
    expect(enumerateFreeInstructions).toHaveBeenCalledTimes(2);
    act(() => input().onChange(''));
    expect(notify).toHaveBeenCalledTimes(2);
  } finally {
    const renderedTree = treeRef.current;
    if (renderedTree) {
      act(() => renderedTree.unmount());
    }
    project.delete();
  }
});
