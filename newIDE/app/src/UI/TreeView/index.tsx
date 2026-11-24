import * as React from 'react';
import { FixedSizeList } from 'react-window';
import memoizeOne from 'memoize-one';
import classes from './TreeView.module.css';
import ContextMenu, { type ContextMenuInterface } from '../Menu/ContextMenu';
import { useResponsiveWindowSize } from '../Responsive/ResponsiveWindowMeasurer';
import TreeViewRow, { TREE_VIEW_ROW_HEIGHT } from './TreeViewRow';
import {
  makeDragSourceAndDropTarget,
  type DraggedItem,
} from '../DragAndDrop/DragSourceAndDropTarget';
import {
  type ConnectDragPreview,
  type ConnectDragSource,
  type ConnectDropTarget,
  type DropTargetMonitor,
} from 'react-dnd';
import { makeDropTarget } from '../DragAndDrop/DropTarget';
import { useAutoScrollDuringAnyDrag } from '../DragAndDrop/UseAutoScrollDuringDrag';
import { useIsDragging } from '../DragAndDrop/UseIsDragging';
import DropIndicator from '../SortableVirtualizedItemList/DropIndicator';
import { type HTMLDataset } from '../../Utils/HTMLDataset';
import useForceUpdate from '../../Utils/UseForceUpdate';
import { type MessageDescriptor } from '../../Utils/i18n/MessageDescriptor.flow';
import {
  type StickyRow,
  STICKY_ROWS_DEFAULT_MAX_COUNT,
  computeParentIndexes,
  computeStickyRows,
  areStickyRowsEqual,
  getStickyAncestorsHeight,
  findSurfaceBackgroundColor,
} from './StickyRows';
import GDevelopThemeContext from '../Theme/GDevelopThemeContext';
import { useTreeViewSelection } from './UseTreeViewSelection';

export const navigationKeys = [
  'ArrowDown',
  'ArrowUp',
  'ArrowRight',
  'ArrowLeft',
  'Enter',
];

export type ItemBaseAttributes = {
  readonly isRoot?: boolean;
  readonly isPlaceholder?: boolean;
};

export type MenuButton = {
  id?: string;
  icon: React.ReactNode;
  label: MessageDescriptor;
  click: (() => void | Promise<void>) | null | undefined;
  enabled?: boolean;
  primary?: boolean;
  showPrimaryLabel?: boolean;
};

type TreeViewDragSourceAndDropTargetComponent = (props: {
  children: (arg0: {
    connectDragSource: ConnectDragSource;
    connectDropTarget: ConnectDropTarget;
    connectDragPreview: ConnectDragPreview;
    isOver: boolean;
    isOverLazy: boolean;
    canDrop: boolean;
    isReadyToDrag: boolean;
  }) => React.ReactNode | null | undefined;
  beginDrag: () => DraggedItem | Record<string, never>;
  canDrag?: (item: DraggedItem | Record<string, never>) => boolean;
  canDrop: (item: DraggedItem | Record<string, never>) => boolean;
  drop: () => void;
  endDrag?: () => void;
  hover?: (monitor: DropTargetMonitor) => void;
}) => React.ReactNode;

export type FlattenedNode<Item> = {
  id: string;
  name: string | React.ReactNode;
  rightComponent: React.ReactNode | null | undefined;
  rightButton: MenuButton | null | undefined | Array<MenuButton>;
  shouldHideMenuIcon: boolean | null;
  hasChildren: boolean;
  canHaveChildren: boolean;
  extraClass: string;
  depth: number;
  dataset?: HTMLDataset | null;
  collapsed: boolean;
  selected: boolean;
  disableCollapse: boolean;
  thumbnailSrc?: string | null;
  item: Item;
};

export type SelectArgs<Item> = {
  node: FlattenedNode<Item>;
  exclusive?: boolean;
  extendFromAnchor?: boolean;
};

export type OnSelectFn<Item> = (selectArgs: SelectArgs<Item>) => void;

export type ItemData<Item> = {
  onOpen: (flattenedNode: FlattenedNode<Item>) => void;
  onClick: (flattenedNode: FlattenedNode<Item>) => void;
  onSelect: OnSelectFn<Item>;
  onBlurField: () => void;
  flattenedData: FlattenedNode<Item>[];
  onEndRenaming: (item: Item, newName: string) => void;
  onContextMenu: (arg0: {
    item: Item;
    index: number;
    x: number;
    y: number;
  }) => void;
  renamedItemId: string | null | undefined;
  canDrop?:
    | ((item: Item, where: 'before' | 'inside' | 'after') => boolean)
    | null;
  onDrop: (
    item: Item,
    where: 'before' | 'inside' | 'after'
  ) => void | Promise<void>;
  onEditItem?: (item: Item) => void;
  isMobile: boolean;
  DragSourceAndDropTarget: TreeViewDragSourceAndDropTargetComponent;
  getItemHtmlId?: (item: Item, index: number) => string | null | undefined;
  forceDefaultDraggingPreview?: boolean;
  shouldSelectUponContextMenuOpening?: boolean;
  multiSelect: boolean;
};

const getItemProps = memoizeOne(
  <Item extends unknown>(
    flattenedData: FlattenedNode<Item>[],
    onOpen: (flattenedNode: FlattenedNode<Item>) => void,
    onClick: (flattenedNode: FlattenedNode<Item>) => void,
    onSelect: OnSelectFn<Item>,
    onBlurField: () => void,
    onEndRenaming: (item: Item, newName: string) => void,
    renamedItemId: string | null | undefined,
    onContextMenu: (arg0: {
      item: Item;
      index: number;
      x: number;
      y: number;
    }) => void,
    canDrop:
      | ((item: Item, where: 'before' | 'inside' | 'after') => boolean)
      | null
      | undefined,
    onDrop: (
      item: Item,
      where: 'before' | 'inside' | 'after'
    ) => void | Promise<void>,
    onEditItem: ((item: Item) => void) | undefined,
    isMobile: boolean,
    DragSourceAndDropTarget: TreeViewDragSourceAndDropTargetComponent,
    getItemHtmlId:
      | ((item: Item, index: number) => string | null | undefined)
      | undefined,
    forceDefaultDraggingPreview: boolean | undefined,
    shouldSelectUponContextMenuOpening: boolean | undefined,
    multiSelect: boolean
  ): ItemData<Item> => ({
    onOpen,
    onClick,
    onSelect,
    onBlurField,
    flattenedData,
    onEndRenaming,
    renamedItemId,
    onContextMenu,
    canDrop,
    onDrop,
    onEditItem,
    isMobile,
    DragSourceAndDropTarget,
    getItemHtmlId,
    forceDefaultDraggingPreview,
    shouldSelectUponContextMenuOpening,
    multiSelect,
  })
);

export type TreeViewInterface<Item> = {
  forceUpdateList: () => void;
  scrollToItem: (item: Item, placement?: 'smart' | 'start') => void;
  scrollToItemFromId: (itemId: string, placement?: 'smart' | 'start') => void;
  renameItem: (item: Item) => void;
  renameItemFromId: (itemId: string) => void;
  openItems: (arg0: string[]) => void;
  closeItems: (arg0: string[]) => void;
  animateItem: (item: Item) => void;
  animateItemFromId: (itemId: string) => void;
  areItemsOpen: (arg0: Array<Item>) => boolean[];
  areItemsOpenFromId: (arg0: Array<string>) => boolean[];
};

type Props<Item> = {
  height: number;
  width?: number;
  items: Item[];
  getItemName: (item: Item) => string | React.ReactNode;
  getItemId: (item: Item) => string;
  getItemHtmlId?: (item: Item, index: number) => string | null | undefined;
  getItemChildren: (item: Item) => Item[] | null | undefined;
  getItemThumbnail?: (item: Item) => string | null | undefined;
  getItemDataset?: (item: Item) => HTMLDataset | null | undefined;
  onEditItem?: (item: Item) => void;
  buildMenuTemplate: (item: Item, index: number) => any;
  getItemRightButton?: (
    item: Item
  ) => MenuButton | null | undefined | Array<MenuButton>;
  renderRightComponent?: (item: Item) => React.ReactNode | null | undefined;
  /**
   * Callback called when a folder is collapsed (folded).
   */
  onCollapseItem?: (Item: Item) => void;
  searchText?: string;
  selectedItems: ReadonlyArray<Item>;
  onClickItem?: (item: Item) => void;
  // `removedItems` lists the items explicitly deselected by the gesture
  // (Ctrl/Cmd+click toggle-off), so callers can drop related items too.
  onSelectItems: (arg0: Item[], removedItems?: Array<Item>) => void;
  multiSelect: boolean;
  onRenameItem: (item: Item, newName: string) => void;
  onMoveSelectionToItem: (
    destinationItem: Item,
    where: 'before' | 'inside' | 'after'
  ) => void | Promise<void>;
  canMoveSelectionToItem?:
    | ((destinationItem: Item, where: 'before' | 'inside' | 'after') => boolean)
    | null;
  reactDndType: string;
  forceAllOpened?: boolean;
  initiallyOpenedNodeIds?: string[];
  arrowKeyNavigationProps?: {
    onGetItemInside: (item: Item) => Item | null | undefined;
    onGetItemOutside: (item: Item) => Item | null | undefined;
  };
  forceDefaultDraggingPreview?: boolean;
  shouldSelectUponContextMenuOpening?: boolean;
  shouldHideMenuIcon?: (item: Item) => boolean;
  /**
   * If true, the ancestors (folders, root sections) of the first visible item
   * are kept displayed as sticky rows at the top of the list when scrolling.
   */
  enableStickyAncestors?: boolean;
};

type DropPosition = 'before' | 'inside' | 'after';

/**
 * Where an item dropped in the empty space below the last row goes: after the
 * last top level item (top level being the children of the root items, if
 * any), or inside the last root item if it has nothing displayed.
 */
const getEndOfListDropTarget = <Item extends ItemBaseAttributes>(
  flattenedData: FlattenedNode<Item>[]
):
  | {
      node: FlattenedNode<Item>;
      where: DropPosition;
    }
  | null
  | undefined => {
  if (flattenedData.length === 0) return null;
  let index = flattenedData.length - 1;
  let node = flattenedData[index];
  if (node.item.isRoot) return { node, where: 'inside' };
  while (node.depth > 0) {
    let parentIndex = index - 1;
    while (parentIndex >= 0 && flattenedData[parentIndex].depth >= node.depth) {
      parentIndex--;
    }
    if (parentIndex < 0 || flattenedData[parentIndex].item.isRoot) break;
    index = parentIndex;
    node = flattenedData[index];
  }
  return { node, where: 'after' };
};

// Space added below the last row while dragging, so that an item can be
// dropped at the end of a list filling its whole height.
const END_OF_LIST_DROP_ZONE_HEIGHT = TREE_VIEW_ROW_HEIGHT;

type FixedSizeListInstance = {
  scrollTo: (scrollOffset: number) => void;
  scrollToItem: (index: number, align?: string) => void;
};

const InnerTreeView = <Item extends ItemBaseAttributes>(
  {
    height,
    width,
    items,
    searchText,
    getItemName,
    getItemId,
    getItemHtmlId,
    getItemChildren,
    getItemThumbnail,
    getItemDataset,
    onEditItem,
    buildMenuTemplate,
    getItemRightButton,
    renderRightComponent,
    selectedItems,
    onClickItem,
    onSelectItems,
    multiSelect,
    onRenameItem,
    onCollapseItem,
    onMoveSelectionToItem,
    canMoveSelectionToItem,
    reactDndType,
    forceAllOpened,
    initiallyOpenedNodeIds,
    arrowKeyNavigationProps,
    forceDefaultDraggingPreview,
    shouldSelectUponContextMenuOpening,
    shouldHideMenuIcon,
    enableStickyAncestors,
  }: Props<Item>,
  ref: React.ForwardedRef<TreeViewInterface<Item>>
) => {
  const selectedNodeIds = selectedItems.map(getItemId);
  const [openedNodeIds, setOpenedNodeIds] = React.useState<string[]>(
    initiallyOpenedNodeIds || []
  );
  const [renamedItemId, setRenamedItemId] = React.useState<
    string | null | undefined
  >(null);
  const contextMenuRef = React.useRef<ContextMenuInterface | null>(null);
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const listRef = React.useRef<FixedSizeListInstance | null>(null);
  const [openedDuringSearchNodeIds, setOpenedDuringSearchNodeIds] =
    React.useState<string[]>([]);
  const { isMobile } = useResponsiveWindowSize();
  const forceUpdate = useForceUpdate();
  const [animatedItemId, setAnimatedItemId] = React.useState<string>('');

  const isSearching = !!searchText;
  const flattenNode = React.useCallback(
    (
      item: Item,
      depth: number,
      searchText: string | null | undefined,
      forceOpen: boolean
    ): FlattenedNode<Item>[] => {
      const id = getItemId(item);
      const children = getItemChildren(item);
      const canHaveChildren = Array.isArray(children);
      const collapsed = !forceAllOpened && !openedNodeIds.includes(id);
      const openedDuringSearch = openedDuringSearchNodeIds.includes(id);
      let flattenedChildren: Array<FlattenedNode<Item>> = [];
      /*
       * Compute children nodes flattening if:
       * - node has children;
       * and if either one of these conditions are true:
       * - the nodes are force-opened (props)
       * - the node is opened (not collapsed)
       * - the user is searching
       * - the user opened the node during the search
       */
      if (
        children &&
        (forceAllOpened || !collapsed || !!searchText || openedDuringSearch)
      ) {
        flattenedChildren = children
          .map((child) =>
            flattenNode(child, depth + 1, searchText, openedDuringSearch)
          )
          .flat();
      }

      const name = getItemName(item);
      const rightComponent = renderRightComponent && renderRightComponent(item);
      const rightButton = getItemRightButton && getItemRightButton(item);
      const dataset = getItemDataset ? getItemDataset(item) : undefined;
      const extraClass =
        animatedItemId && id === animatedItemId ? classes.animate : '';

      /*
       * Append node to result if either:
       * - the user is not searching
       * - the nodes are force-opened (props)
       * - the node is force-opened (if user opened the node during the search)
       * - the node name matches the search
       * - the node contains children that should be displayed
       */
      if (
        !searchText ||
        forceAllOpened ||
        forceOpen ||
        (typeof name === 'string' && name.toLowerCase().includes(searchText)) ||
        flattenedChildren.length > 0
      ) {
        const thumbnailSrc = getItemThumbnail ? getItemThumbnail(item) : null;
        const selected = selectedNodeIds.includes(id);
        return [
          {
            id,
            name,
            rightComponent,
            rightButton,
            shouldHideMenuIcon: shouldHideMenuIcon
              ? shouldHideMenuIcon(item)
              : null,
            hasChildren: !!children && children.length > 0,
            canHaveChildren,
            depth,
            selected,
            thumbnailSrc,
            dataset,
            item,
            extraClass,
            /*
             * If the user is searching, the node should be opened if either:
             * - it has children that should be displayed
             * - the user opened it
             */
            collapsed: !!searchText
              ? flattenedChildren.length === 0 || !openedDuringSearch
              : collapsed,
            /*
             * Disable opening of the node if:
             * - the user is searching
             * - the node has children to be displayed but it's not because the user opened it
             */
            disableCollapse:
              !!searchText &&
              flattenedChildren.length > 0 &&
              !openedDuringSearch,
          },
          ...flattenedChildren,
        ];
      }
      return [];
    },
    [
      getItemId,
      getItemChildren,
      forceAllOpened,
      openedNodeIds,
      openedDuringSearchNodeIds,
      getItemName,
      renderRightComponent,
      getItemRightButton,
      getItemDataset,
      animatedItemId,
      getItemThumbnail,
      selectedNodeIds,
      shouldHideMenuIcon,
    ]
  );

  const flattenOpened = React.useCallback(
    (
      items: Item[],
      searchText: string | null | undefined
    ): FlattenedNode<Item>[] => {
      return items
        .map((item) => flattenNode(item, 0, searchText, false))
        .flat();
    },
    [flattenNode]
  );

  const onOpen = React.useCallback(
    (node: FlattenedNode<Item>) => {
      if (isSearching) {
        if (node.collapsed) {
          setOpenedDuringSearchNodeIds([...openedDuringSearchNodeIds, node.id]);
        } else {
          if (!forceAllOpened)
            setOpenedDuringSearchNodeIds(
              openedDuringSearchNodeIds.filter((id) => id !== node.id)
            );
        }
      } else {
        if (node.collapsed) {
          setOpenedNodeIds([...openedNodeIds, node.id]);
        } else {
          if (!forceAllOpened) {
            if (onCollapseItem) onCollapseItem(node.item);
            setOpenedNodeIds(openedNodeIds.filter((id) => id !== node.id));
          }
        }
      }
    },
    [
      openedDuringSearchNodeIds,
      openedNodeIds,
      isSearching,
      forceAllOpened,
      onCollapseItem,
    ]
  );

  const flattenedData = React.useMemo(
    () => flattenOpened(items, searchText ? searchText.toLowerCase() : null),
    [flattenOpened, items, searchText]
  );

  const { onSelect, navigationFocusIdRef } = useTreeViewSelection({
    multiSelect,
    selectedItems,
    flattenedData,
    onSelectItems,
    getItemId,
  });

  const onClick = React.useCallback(
    (node: FlattenedNode<Item>) => {
      if (onClickItem) {
        onClickItem(node.item);
      }
    },
    [onClickItem]
  );

  const onEndRenaming = (item: Item, newName: string) => {
    const trimmedNewName = newName.trim();
    setRenamedItemId(null);
    if (!trimmedNewName) return;
    if (getItemName(item) === trimmedNewName) return;
    onRenameItem(item, trimmedNewName);
  };

  const parentIndexes = React.useMemo(
    () => (enableStickyAncestors ? computeParentIndexes(flattenedData) : []),
    [enableStickyAncestors, flattenedData]
  );
  const [stickyRows, setStickyRows] = React.useState<StickyRow[]>([]);
  const gdevelopTheme = React.useContext(GDevelopThemeContext);
  const [surfaceBackgroundColor, setSurfaceBackgroundColor] = React.useState<
    string | null
  >(null);
  const hasStickyRows = stickyRows.length > 0;
  // The sticky rows must be opaque, matching the surface (panel, dialog...)
  // the tree view is displayed on: measure it when they appear (and re-measure
  // if the theme changes).
  React.useLayoutEffect(() => {
    if (!enableStickyAncestors || !hasStickyRows) return;
    const backgroundColor = findSurfaceBackgroundColor(containerRef.current);
    setSurfaceBackgroundColor((existingBackgroundColor) =>
      existingBackgroundColor === backgroundColor
        ? existingBackgroundColor
        : backgroundColor
    );
  }, [enableStickyAncestors, hasStickyRows, gdevelopTheme]);
  const scrollOffsetRef = React.useRef<number>(0);
  const listOuterRef = React.useRef<HTMLDivElement | null>(null);

  useAutoScrollDuringAnyDrag(() => listOuterRef.current);

  // Only consider the items of this tree view (not the ones dragged from
  // other components).
  const isDraggingItem = useIsDragging(reactDndType);
  const isDraggingItemRef = React.useRef(false);
  isDraggingItemRef.current = isDraggingItem;
  // Stable component (rows would be unmounted otherwise) reading the drag
  // state from a ref.
  const listInnerElementType = React.useMemo(
    () =>
      React.forwardRef<
        HTMLDivElement,
        {
          style: React.CSSProperties;
        }
      >(({ style, ...otherProps }, ref) => (
        <div
          ref={ref}
          style={{
            ...style,
            height:
              parseFloat(String(style.height || 0)) +
              (isDraggingItemRef.current ? END_OF_LIST_DROP_ZONE_HEIGHT : 0),
            // react-window disables pointer events while scrolling: rows
            // must stay drop targets while the list auto scrolls during a drag.
            pointerEvents: isDraggingItemRef.current
              ? undefined
              : style.pointerEvents,
          }}
          {...otherProps}
        />
      )),
    []
  );

  const endOfListDropTarget = React.useMemo(
    () => getEndOfListDropTarget(flattenedData),
    [flattenedData]
  );
  const EndOfListDropTarget = React.useMemo(
    () => makeDropTarget<Item>(reactDndType),
    [reactDndType]
  );

  const updateStickyRows = React.useCallback(() => {
    if (!enableStickyAncestors) return;
    const newStickyRows = computeStickyRows({
      flattenedData,
      parentIndexes,
      scrollOffset: scrollOffsetRef.current,
      listHeight: height,
      maxCount: STICKY_ROWS_DEFAULT_MAX_COUNT,
      getRowTop: (index) => index * TREE_VIEW_ROW_HEIGHT,
      getRowHeight: () => TREE_VIEW_ROW_HEIGHT,
      getRowIndexAt: (offset) => Math.floor(offset / TREE_VIEW_ROW_HEIGHT),
    });
    setStickyRows((stickyRows) =>
      areStickyRowsEqual(stickyRows, newStickyRows) ? stickyRows : newStickyRows
    );
  }, [enableStickyAncestors, flattenedData, parentIndexes, height]);

  // useLayoutEffect so that, when the tree changes (folder collapsed,
  // search...), the sticky rows are recomputed before the browser paints:
  // they hold indexes in flattenedData that could be stale.
  React.useLayoutEffect(() => {
    updateStickyRows();
  }, [updateStickyRows]);

  const onScroll = React.useCallback(
    ({ scrollOffset }: { scrollOffset: number }) => {
      scrollOffsetRef.current = scrollOffset;
      if (enableStickyAncestors) updateStickyRows();
    },
    [enableStickyAncestors, updateStickyRows]
  );

  const onClickStickyRow = React.useCallback(
    (rowRank: number, flattenedDataIndex: number) => {
      const list = listRef.current;
      if (!list) return;
      // Reveal the item: scroll so that the actual row lands exactly below
      // its own sticky ancestors (at which point it is no longer sticky itself).
      list.scrollTo(
        Math.max(
          0,
          flattenedDataIndex * TREE_VIEW_ROW_HEIGHT -
            rowRank * TREE_VIEW_ROW_HEIGHT
        )
      );
    },
    []
  );

  const scrollToItemFromId = React.useCallback(
    (itemId: string, placement: 'smart' | 'start' = 'smart') => {
      const list = listRef.current;
      if (list) {
        // Browse flattenedData in reverse order since scrollToItem is mainly used
        // to scroll to newly added object that is appended at the end of the list.
        let index = -1;
        for (let i = flattenedData.length - 1; i >= 0; i--) {
          if (flattenedData[i].id === itemId) {
            index = i;
            break;
          }
        }
        if (index >= 0) {
          if (!enableStickyAncestors) {
            list.scrollToItem(index, placement);
            return;
          }
          // Scroll so that the item is not covered by its sticky ancestors.
          const stickyRowsHeight = getStickyAncestorsHeight({
            parentIndexes,
            index,
            maxCount: STICKY_ROWS_DEFAULT_MAX_COUNT,
            listHeight: height,
            getRowHeight: () => TREE_VIEW_ROW_HEIGHT,
          });
          const itemTop = index * TREE_VIEW_ROW_HEIGHT;
          const scrollOffset = scrollOffsetRef.current;
          if (
            placement === 'start' ||
            itemTop < scrollOffset + stickyRowsHeight
          ) {
            list.scrollTo(Math.max(0, itemTop - stickyRowsHeight));
          } else if (itemTop + TREE_VIEW_ROW_HEIGHT > scrollOffset + height) {
            list.scrollTo(itemTop + TREE_VIEW_ROW_HEIGHT - height);
          }
          // Otherwise, the item is already entirely visible below the
          // sticky rows: don't scroll.
        }
      }
    },
    [flattenedData, enableStickyAncestors, parentIndexes, height]
  );

  const scrollToItem = React.useCallback(
    (item: Item, placement: 'smart' | 'start' = 'smart') =>
      scrollToItemFromId(getItemId(item), placement),
    [getItemId, scrollToItemFromId]
  );

  const renameItem = React.useCallback(
    (item: Item) => {
      setRenamedItemId(getItemId(item));
    },
    [getItemId]
  );

  const renameItemFromId = React.useCallback((itemId: string) => {
    setRenamedItemId(itemId);
  }, []);

  const openItems = React.useCallback(
    (itemIds: string[]) => {
      const notAlreadyOpenedNodeIds = itemIds.filter(
        (itemId) => !openedNodeIds.includes(itemId)
      );
      if (notAlreadyOpenedNodeIds.length > 0)
        setOpenedNodeIds([...openedNodeIds, ...notAlreadyOpenedNodeIds]);
    },
    [openedNodeIds]
  );

  const closeItems = React.useCallback(
    (itemIds: string[]) => {
      const newOpenedNodesIds = openedNodeIds.filter(
        (openedNodeId) => !itemIds.includes(openedNodeId)
      );
      setOpenedNodeIds(newOpenedNodesIds);
    },
    [openedNodeIds]
  );

  const animateItem = React.useCallback(
    (item: Item) => {
      setAnimatedItemId(getItemId(item));
    },
    [getItemId]
  );

  const animateItemFromId = React.useCallback((itemId: string) => {
    setAnimatedItemId(itemId);
  }, []);

  const areItemsOpen = React.useCallback(
    (items: Item[]) => {
      const itemIds = items.map(getItemId);
      const openedNodeIdsSet = new Set(openedNodeIds);
      return itemIds.map((id) => openedNodeIdsSet.has(id));
    },
    [openedNodeIds, getItemId]
  );

  const areItemsOpenFromId = React.useCallback(
    (itemIds: Array<string>) => {
      const openedNodeIdsSet = new Set(openedNodeIds);
      return itemIds.map((id) => openedNodeIdsSet.has(id));
    },
    [openedNodeIds]
  );

  React.useEffect(() => {
    if (animatedItemId) {
      const timeoutId = setTimeout(
        // Animated item must be reset to remove the extra class to the node.
        // Otherwise, if it has to be animated once again, the class is already here
        // and the animation won't play.
        () => setAnimatedItemId(''),
        // Corresponds to the duration of the CSS animation.
        400
      );
      return () => clearTimeout(timeoutId);
    }
    return undefined;
  }, [animatedItemId]);

  React.useImperativeHandle(ref, () => ({
    forceUpdateList: forceUpdate,
    scrollToItem,
    scrollToItemFromId,
    renameItem,
    renameItemFromId,
    openItems,
    closeItems,
    animateItem,
    animateItemFromId,
    areItemsOpen,
    areItemsOpenFromId,
  }));

  const DragSourceAndDropTarget = React.useMemo(
    () =>
      makeDragSourceAndDropTarget<DraggedItem | Record<string, never>>(
        reactDndType,
        {
          touchDragStart: 'afterHold',
        }
      ),
    [reactDndType]
  );

  const openContextMenu = React.useCallback(
    ({
      x,
      y,
      item,
      index,
    }: {
      item: Item;
      index: number;
      x: number;
      y: number;
    }) => {
      if (contextMenuRef.current) {
        contextMenuRef.current.open(x, y, { item, index });
      }
    },
    []
  );

  const onBlurField = React.useCallback(() => {
    if (containerRef.current) {
      containerRef.current.focus();
    }
  }, []);

  const itemData: ItemData<Item> = getItemProps<Item>(
    flattenedData,
    onOpen,
    onClick,
    onSelect,
    onBlurField,
    onEndRenaming,
    renamedItemId,
    openContextMenu,
    canMoveSelectionToItem,
    onMoveSelectionToItem,
    onEditItem,
    isMobile,
    DragSourceAndDropTarget,
    getItemHtmlId,
    forceDefaultDraggingPreview,
    shouldSelectUponContextMenuOpening,
    multiSelect
  );

  // Reset opened nodes during search when user stops searching
  // or when the search text changes.
  React.useEffect(() => {
    if (!searchText || searchText.length > 0) {
      setOpenedDuringSearchNodeIds([]);
    }
  }, [searchText]);

  const onKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (!navigationKeys.includes(event.key)) return;
      let newFocusedItem;
      const focusedId =
        navigationFocusIdRef.current ||
        (selectedItems[0] ? getItemId(selectedItems[0]) : null);
      let itemIndexInFlattenedData = focusedId
        ? flattenedData.findIndex((node) => node.id === focusedId)
        : -1;
      const item =
        itemIndexInFlattenedData !== -1
          ? flattenedData[itemIndexInFlattenedData].item
          : selectedItems[0];

      if (itemIndexInFlattenedData === -1) {
        // If no row is selected, start from the first row that is selectable.
        let i = 0;
        let newFocusedNode: FlattenedNode<Item> | null | undefined =
          flattenedData[i];
        while (
          newFocusedNode &&
          (newFocusedNode.item.isRoot || newFocusedNode.item.isPlaceholder)
        ) {
          i += 1;
          if (i > flattenedData.length - 1) {
            newFocusedNode = null;
          }
          newFocusedNode = flattenedData[i];
        }
        if (newFocusedNode) {
          newFocusedItem = newFocusedNode.item;
        }
      } else if (event.key === 'ArrowDown') {
        event.preventDefault();
        if (itemIndexInFlattenedData < flattenedData.length - 1) {
          let delta = 1;
          let newFocusedNode: FlattenedNode<Item> | null | undefined =
            flattenedData[itemIndexInFlattenedData + delta];
          while (
            newFocusedNode &&
            (newFocusedNode.item.isRoot || newFocusedNode.item.isPlaceholder)
          ) {
            if (itemIndexInFlattenedData + delta > flattenedData.length - 1) {
              newFocusedNode = null;
            }
            delta += 1;
            newFocusedNode = flattenedData[itemIndexInFlattenedData + delta];
          }
          if (newFocusedNode) {
            newFocusedItem = newFocusedNode.item;
          }
        }
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        if (itemIndexInFlattenedData > 0) {
          let delta = -1;
          let newFocusedNode: FlattenedNode<Item> | null | undefined =
            flattenedData[itemIndexInFlattenedData + delta];
          while (
            newFocusedNode &&
            (newFocusedNode.item.isRoot || newFocusedNode.item.isPlaceholder)
          ) {
            if (itemIndexInFlattenedData + delta < 0) {
              newFocusedNode = null;
            }
            delta -= 1;
            newFocusedNode = flattenedData[itemIndexInFlattenedData + delta];
          }
          if (newFocusedNode) {
            newFocusedItem = newFocusedNode.item;
          }
        }
      } else if (event.key === 'ArrowRight' && arrowKeyNavigationProps) {
        event.preventDefault();
        const node = flattenedData[itemIndexInFlattenedData];
        if (node.canHaveChildren && node.collapsed) {
          openItems([node.id]);
        } else {
          newFocusedItem = arrowKeyNavigationProps.onGetItemInside(item);
        }
      } else if (event.key === 'ArrowLeft' && arrowKeyNavigationProps) {
        event.preventDefault();
        const node = flattenedData[itemIndexInFlattenedData];
        if (node.canHaveChildren && !node.collapsed) {
          closeItems([node.id]);
        } else {
          newFocusedItem = arrowKeyNavigationProps.onGetItemOutside(item);
        }
      } else if (event.key === 'Enter') {
        event.preventDefault();
        const focusedNode = flattenedData[itemIndexInFlattenedData];
        if (onClickItem) {
          onClickItem(focusedNode.item);
        }
      }
      if (newFocusedItem) {
        scrollToItem(newFocusedItem);
        const newFocusedItemId = getItemId(newFocusedItem);
        const newFocusedNode = flattenedData.find(
          (flattenedNode) => flattenedNode.id === newFocusedItemId
        );
        if (!newFocusedNode) return;
        if (
          multiSelect &&
          event.shiftKey &&
          (event.key === 'ArrowDown' || event.key === 'ArrowUp')
        ) {
          onSelect({ node: newFocusedNode, extendFromAnchor: true });
        } else {
          // Route through onSelect so that selectionAnchorIdRef and
          // shiftSelectionBaseRef stay consistent with the new selection.
          onSelect({ node: newFocusedNode, exclusive: true });
        }
      }
    },
    [
      selectedItems,
      arrowKeyNavigationProps,
      flattenedData,
      getItemId,
      multiSelect,
      onSelect,
      openItems,
      closeItems,
      onClickItem,
      scrollToItem,
      navigationFocusIdRef,
    ]
  );

  const renderList = () => (
    <>
      <FixedSizeList
        height={height}
        itemCount={flattenedData.length}
        itemSize={TREE_VIEW_ROW_HEIGHT}
        width={typeof width === 'number' ? width : '100%'}
        itemKey={(index: number) => flattenedData[index].id}
        // Flow does not seem to accept the generic used in FixedSizeList
        // can itself use a generic.
        itemData={itemData}
        ref={listRef}
        outerRef={listOuterRef}
        onScroll={onScroll}
        innerElementType={listInnerElementType}
        // Keep overscanCount relatively high so that:
        // - during in-app tutorials we make sure the tooltip displayer finds
        //   the elements to highlight
        // - on mobile it avoids jumping screens. This can happen when an item
        //   name is edited, the keyboard opens and reduces the window height
        //   making the item disappear (because of virtualization).
        overscanCount={20}
      >
        {TreeViewRow}
      </FixedSizeList>
      {enableStickyAncestors && stickyRows.length > 0 && (
        <div
          className={classes.stickyRowsContainer}
          style={{
            height:
              stickyRows[stickyRows.length - 1].top +
              stickyRows[stickyRows.length - 1].height,
            // Do not cover the scrollbar of the list, if any.
            right: listOuterRef.current
              ? listOuterRef.current.offsetWidth -
                listOuterRef.current.clientWidth
              : 0,
          }}
        >
          {stickyRows
            .map((stickyRow, rowRank) => {
              const node = flattenedData[stickyRow.index];
              // The sticky rows can reference rows that no longer exist
              // during the render following a change of the tree - they
              // are recomputed in a layout effect, before painting.
              if (!node) return null;
              return (
                <div
                  key={node.id}
                  className={classes.stickyRow}
                  style={{
                    top: stickyRow.top,
                    height: stickyRow.height,
                    backgroundColor: surfaceBackgroundColor || undefined,
                  }}
                  onClick={() => onClickStickyRow(rowRank, stickyRow.index)}
                >
                  <TreeViewRow
                    index={stickyRow.index}
                    style={{ height: TREE_VIEW_ROW_HEIGHT }}
                    // Flow does not seem to accept the generic used in
                    // FixedSizeList can itself use a generic.
                    data={{
                      ...itemData,
                      // When collapsing from a sticky row, also reveal the
                      // actual row so the user does not lose their position.
                      onOpen: (node: FlattenedNode<Item>) => {
                        onOpen(node);
                        onClickStickyRow(rowRank, stickyRow.index);
                      },
                    }}
                    isSticky
                  />
                </div>
              );
            })
            // Render in reverse DOM order so that, during the "push"
            // transition, the deepest row slides under its ancestors.
            .reverse()}
        </div>
      )}
    </>
  );

  return (
    <>
      <EndOfListDropTarget
        canDrop={() =>
          !!endOfListDropTarget &&
          (canMoveSelectionToItem
            ? canMoveSelectionToItem(
                endOfListDropTarget.node.item,
                endOfListDropTarget.where
              )
            : true)
        }
        drop={(monitor) => {
          // Only handle drops in the empty space below the rows: when a row
          // refuses the drop (an item dropped on itself...), the drop must
          // not fall through to the end of the list.
          if (!monitor.isOver({ shallow: true })) return;
          if (endOfListDropTarget)
            onMoveSelectionToItem(
              endOfListDropTarget.node.item,
              endOfListDropTarget.where
            );
        }}
      >
        {({ connectDropTarget, isOver, canDrop }) =>
          connectDropTarget(
            <div
              tabIndex={0}
              className={classes.treeView}
              onKeyDown={onKeyDown}
              ref={containerRef}
            >
              {renderList()}
              {/* The pointer is in the empty space below the last row. */}
              {isOver &&
                endOfListDropTarget &&
                endOfListDropTarget.where === 'after' && (
                  <div
                    className={classes.endOfListDropIndicator}
                    style={{
                      top:
                        Math.min(
                          flattenedData.length * TREE_VIEW_ROW_HEIGHT -
                            scrollOffsetRef.current,
                          height
                        ) - 1,
                      left:
                        endOfListDropTarget.node.depth * (isMobile ? 12 : 16),
                    }}
                  >
                    <DropIndicator canDrop={canDrop} />
                  </div>
                )}
            </div>
          )
        }
      </EndOfListDropTarget>
      <ContextMenu
        ref={contextMenuRef}
        buildMenuTemplate={(i18n, options) =>
          buildMenuTemplate(options.item, options.index)
        }
      />
    </>
  );
};

// Define the polymorphic component type that will be exported:
type TreeViewComponent = <Item extends ItemBaseAttributes>(
  arg0: Props<Item> & {
    readonly ref?: React.Ref<TreeViewInterface<Item>>;
  }
) => React.ReactNode;

const TreeView = React.forwardRef(
  InnerTreeView as React.ForwardRefRenderFunction<
    TreeViewInterface<any>,
    Props<any>
  >
) as unknown as TreeViewComponent;

// ✅ Properly-typed generic export:
export default TreeView;
