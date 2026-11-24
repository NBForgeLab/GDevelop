import * as React from 'react';
import {
  DropTarget,
  type DropTargetMonitor,
  type DropTargetConnector,
  type ConnectDropTarget,
} from 'react-dnd';

type Props<DraggedItemType> = {
  children: (arg0: {
    connectDropTarget: ConnectDropTarget;
    isOver: boolean;
    isOverLazy: boolean;
    canDrop: boolean;
  }) => React.ReactNode | null | undefined;
  canDrop: (item: DraggedItemType) => boolean;
  hover?: (monitor: DropTargetMonitor) => void;
  drop: (monitor: DropTargetMonitor) => void;
};

export type DropTargetComponent<DraggedItemType> = (
  props: Props<DraggedItemType>
) => React.ReactNode;

type DropTargetProps = {
  connectDropTarget: ConnectDropTarget;
  isOver: boolean;
  isOverLazy: boolean;
  canDrop: boolean;
};

export const makeDropTarget = <DraggedItemType extends unknown>(
  reactDndType: string
): DropTargetComponent<DraggedItemType> => {
  const targetSpec = {
    canDrop(props: Props<DraggedItemType>, monitor: DropTargetMonitor) {
      const item = monitor.getItem() as DraggedItemType | null;
      return !!(item && props.canDrop(item));
    },
    hover(props: Props<DraggedItemType>, monitor: DropTargetMonitor) {
      if (props.hover) props.hover(monitor);
    },
    drop(props: Props<DraggedItemType>, monitor: DropTargetMonitor) {
      if (monitor.didDrop()) {
        return; // Drop already handled by another target
      }
      props.drop(monitor);
    },
  };

  function targetCollect(
    connect: DropTargetConnector,
    monitor: DropTargetMonitor
  ): DropTargetProps {
    return {
      connectDropTarget: connect.dropTarget(),
      isOver: monitor.isOver({ shallow: true }),
      isOverLazy: monitor.isOver({ shallow: false }),
      canDrop: monitor.canDrop(),
    };
  }

  const InnerDropTarget = DropTarget(
    reactDndType,
    targetSpec,
    targetCollect
  )(({ children, connectDropTarget, isOver, isOverLazy, canDrop }: any) => {
    return children({
      connectDropTarget,
      isOver,
      isOverLazy,
      canDrop,
    });
  });

  return (props: Props<DraggedItemType>) => <InnerDropTarget {...props} />;
};
