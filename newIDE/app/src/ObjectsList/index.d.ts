import * as React from 'react';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';
import { type EventsScope } from '../InstructionOrExpression/EventsScope';

export declare const objectWithContextReactDndType: 'GD_OBJECT_WITH_CONTEXT';

export declare const getLabelsForObjectsAndGroupsLists: (
  scope: EventsScope
) => {
  localScopeObjectsTitle: MessageDescriptor;
  higherScopeObjectsTitle: MessageDescriptor | null;
  localScopeGroupsTitle: MessageDescriptor | null;
  higherScopeGroupsTitle: MessageDescriptor | null;
};

export declare const getTreeViewItemIdFromObjectFolderOrObject: (
  objectFolderOrObject: gdObjectFolderOrObject
) => string;

export interface TreeViewItemContent {
  getName(): string | React.ReactNode;
  getId(): string;
  getHtmlId(index: number): string | null | undefined;
  [key: string]: any;
}

export type ObjectsListInterface = {
  forceUpdateList: () => void;
  openNewObjectDialog: () => void;
  closeNewObjectDialog: () => void;
};

declare const ObjectsListWithErrorBoundary: React.ComponentType<any>;

export default ObjectsListWithErrorBoundary;
