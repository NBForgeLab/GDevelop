import * as React from 'react';
import { List } from 'react-virtualized';
import ItemRow, { type ItemSelectionEvent } from './ItemRow';
import { AddListItem } from '../ListCommonItem';
import { listItemWith32PxIconHeight, listItemWithoutIconHeight } from '../List';
import {
  makeDragSourceAndDropTarget,
  type DraggedItem,
} from '../DragAndDrop/DragSourceAndDropTarget';
import DropIndicator from './DropIndicator';
import { ResponsiveWindowMeasurer } from '../Responsive/ResponsiveWindowMeasurer';
import { ScreenTypeMeasurer } from '../Responsive/ScreenTypeMeasurer';
import { type HTMLDataset } from '../../Utils/HTMLDataset';

const OVERSCAN_CELLS_COUNT = 20;

type Props<Item> = {
  height: number;
  width: number;
  fullList: Array<Item>;
  selectedItems: Array<Item>;
  onAddNewItem?: () => void;
  addNewItemLabel?: React.ReactNode | string;
  addNewItemId?: string;
  onRename: (item: Item, arg1: string) => void;
  renderItemLabel?: (item: Item) => React.ReactNode;
  getItemName: (item: Item) => string;
  getItemThumbnail?: (item: Item) => string;
  getItemId?: (item: Item, index: number) => string;
  getItemData?: (item: Item, index: number) => HTMLDataset;
  isItemBold?: (item: Item) => boolean;
  onItemSelected: (
    arg0: Item | null | undefined,
    event?: ItemSelectionEvent
  ) => void;
  onEditItem?: (item: Item) => void;
  renamedItem: Item | null | undefined;
  erroredItems?: {
    [key: string]: '' | 'error' | 'warning';
  };
  buildMenuTemplate: (item: Item, index: number) => any;
  onMoveSelectionToItem: (destinationItem: Item) => void;
  canMoveSelectionToItem?: ((destinationItem: Item) => boolean) | null;
  reactDndType: string;
};

export default class SortableVirtualizedItemList<Item> extends React.Component<
  Props<Item>
> {
  _list: List | null | undefined;
  DragSourceAndDropTarget = makeDragSourceAndDropTarget<DraggedItem>(
    this.props.reactDndType,
    { touchDragStart: 'afterHold' }
  );

  forceUpdateGrid() {
    if (this._list) this._list.forceUpdateGrid();
  }

  scrollToItem(item: Item) {
    const index = this.props.fullList.findIndex(
      (listItem) =>
        this.props.getItemName(listItem) === this.props.getItemName(item)
    );
    if (this._list && index !== -1) {
      this._list.scrollToRow(index);
    }
  }

  _renderItemRow(
    item: Item,
    index: number,
    isMobile: boolean
  ): React.ReactNode {
    const {
      selectedItems,
      getItemThumbnail,
      erroredItems,
      isItemBold,
      onEditItem,
      renamedItem,
      getItemName,
      getItemId,
      getItemData,
      renderItemLabel,
    } = this.props;

    const nameBeingEdited = renamedItem === item;
    const itemName = getItemName(item);

    const selected =
      selectedItems.findIndex((item) => getItemName(item) === itemName) !== -1;

    return (
      <ItemRow
        item={item}
        itemName={itemName}
        id={getItemId ? getItemId(item, index) : undefined}
        data={getItemData ? getItemData(item, index) : undefined}
        renderItemLabel={
          renderItemLabel ? () => renderItemLabel(item) : undefined
        }
        isBold={isItemBold ? isItemBold(item) : false}
        onRename={(newName) => this.props.onRename(item, newName)}
        editingName={nameBeingEdited}
        getThumbnail={
          getItemThumbnail ? () => getItemThumbnail(item) : undefined
        }
        selected={selected}
        onItemSelected={this.props.onItemSelected}
        errorStatus={erroredItems ? erroredItems[itemName] || '' : ''}
        buildMenuTemplate={() => this.props.buildMenuTemplate(item, index)}
        onEdit={onEditItem}
        hideMenuButton={isMobile}
      />
    );
  }

  render(): React.ReactNode {
    const {
      height,
      width,
      fullList,
      addNewItemLabel,
      addNewItemId,
      renamedItem,
      getItemThumbnail,
      getItemName,
      onAddNewItem,
      onMoveSelectionToItem,
      canMoveSelectionToItem,
      selectedItems,
    } = this.props;
    const { DragSourceAndDropTarget } = this;

    // Create an empty pixel image once to override the default drag preview of all items.
    const emptyImage = new Image();
    emptyImage.src =
      'data:image/gif;base64,R0lGODlhAQABAAD/ACwAAAAAAQABAAACADs=';

    return (
      <ResponsiveWindowMeasurer>
        {({ isMobile }) => (
          <ScreenTypeMeasurer>
            {(screenType) => (
              <List
                ref={(list: List | null) => {
                  this._list = list;
                }}
                // We override this function to avoid a bug in react-virtualized
                // where the overscanCellsCount is not taken into account after a scroll
                // see https://github.com/bvaughn/react-virtualized/issues/1582#issuecomment-785073746
                overscanIndicesGetter={({
                  cellCount,
                  startIndex,
                  stopIndex,
                }: {
                  cellCount: number;
                  overscanCellsCount: number;
                  startIndex: number;
                  stopIndex: number;
                }) => ({
                  overscanStartIndex: Math.max(
                    0,
                    startIndex - OVERSCAN_CELLS_COUNT
                  ),
                  overscanStopIndex: Math.min(
                    cellCount - 1,
                    stopIndex + OVERSCAN_CELLS_COUNT
                  ),
                })}
                height={height}
                rowCount={fullList.length + (onAddNewItem ? 1 : 0)}
                rowHeight={
                  getItemThumbnail
                    ? listItemWith32PxIconHeight
                    : listItemWithoutIconHeight
                }
                rowRenderer={({
                  index,
                  key,
                  style,
                }: {
                  index: number;
                  key: string;
                  style: React.CSSProperties;
                }) => {
                  if (index >= fullList.length) {
                    return (
                      <div style={style} key={key}>
                        <AddListItem
                          onClick={onAddNewItem}
                          primaryText={width < 200 ? '' : addNewItemLabel}
                          id={addNewItemId}
                        />
                      </div>
                    );
                  }

                  const item = fullList[index];
                  const nameBeingEdited = renamedItem === item;
                  const isSelected =
                    selectedItems.findIndex(
                      (selectedItem) =>
                        getItemName(selectedItem) === getItemName(item)
                    ) !== -1;
                  // If on a touch screen, we only allow dragging if the item is selected.
                  const canDrag =
                    !nameBeingEdited && (screenType !== 'touch' || isSelected);

                  return (
                    <div style={style} key={key}>
                      <DragSourceAndDropTarget
                        beginDrag={() => {
                          // This is a hack for touch screens. We need to prevent the react-dnd list from scrolling
                          // at the same time as the drag is happening.
                          // react-dnd does not work well with react-virtualized.
                          // Find the React-Virtualized list and prevent it from scrolling whilst dragging
                          // by setting the overflow to 'hidden' and then back to 'auto' when the drag is finished.
                          if (screenType === 'touch') {
                            if (this._list && this._list.props.style) {
                              this._list.props.style.overflow = 'hidden';
                            }
                          }

                          // Select the dragged item, unless it's already part of
                          // the selection (so that the whole selection is dragged).
                          if (!isSelected) this.props.onItemSelected(item);

                          // We return the item name and thumbnail to be used by the
                          // drag preview. We can't use the item itself because it's
                          // not serializable and breaks react-dnd.
                          const draggedItem: DraggedItem = {
                            name: getItemName(item),
                            thumbnail:
                              this.props.reactDndType ===
                                'GD_OBJECT_WITH_CONTEXT' && getItemThumbnail
                                ? getItemThumbnail(item)
                                : undefined,
                          };
                          return draggedItem;
                        }}
                        canDrag={() => canDrag}
                        canDrop={() =>
                          canMoveSelectionToItem
                            ? canMoveSelectionToItem(item)
                            : true
                        }
                        drop={() => {
                          onMoveSelectionToItem(item);
                        }}
                        endDrag={() => {
                          // Re-enable scrolling on touch screens.
                          if (screenType !== 'touch') return;
                          if (this._list && this._list.props.style) {
                            this._list.props.style.overflow = 'auto';
                            this.forceUpdate();
                          }
                        }}
                      >
                        {({
                          connectDragSource,
                          connectDropTarget,
                          connectDragPreview,
                          isOver,
                          canDrop,
                        }) => {
                          // Connect the drag preview with an empty image to override the default
                          // drag preview.
                          connectDragPreview(emptyImage);

                          // Add an extra div because connectDropTarget/connectDragSource can
                          // only be used on native elements
                          const dropTarget = connectDropTarget(
                            <div>
                              {isOver && <DropIndicator canDrop={canDrop} />}
                              {this._renderItemRow(item, index, isMobile)}
                            </div>
                          );

                          if (!dropTarget) return null;

                          return connectDragSource(dropTarget);
                        }}
                      </DragSourceAndDropTarget>
                    </div>
                  );
                }}
                width={width}
              />
            )}
          </ScreenTypeMeasurer>
        )}
      </ResponsiveWindowMeasurer>
    );
  }
}
