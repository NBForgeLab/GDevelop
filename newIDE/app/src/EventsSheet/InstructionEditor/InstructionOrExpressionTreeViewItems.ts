import * as React from 'react';
import { type HTMLDataset } from '../../Utils/HTMLDataset';
import { type EnumeratedInstructionMetadata } from '../../InstructionOrExpression/EnumeratedInstructionOrExpressionMetadata';
import { type InstructionOrExpressionTreeNode } from '../../InstructionOrExpression/CreateTree';

export const getInstructionGroupId = (
  groupName: string,
  parentId?: string | null
): string => `${parentId ? `${parentId}-` : ''}instruction-group-${groupName}`;

export interface TreeViewItemContent {
  applySearch: boolean;
  getName(): string | React.ReactNode;
  getDescription(): string | null;
  getId(): string;
  getHtmlId(index: number): string | null | undefined;
  getDataSet(): HTMLDataset | null | undefined;
  getThumbnail(): string | null | undefined;
}

export interface TreeViewItem {
  isRoot?: boolean;
  displayAsPrimaryButton?: boolean;
  openWithSingleClick?: boolean;
  readonly content: TreeViewItemContent;
  getChildren(): Array<TreeViewItem> | null | undefined;
}

export class LeafTreeViewItem implements TreeViewItem {
  content: TreeViewItemContent;
  displayAsPrimaryButton: boolean;

  constructor(content: TreeViewItemContent, displayAsPrimaryButton?: boolean) {
    this.content = content;
    this.displayAsPrimaryButton = !!displayAsPrimaryButton;
  }

  getChildren(): Array<TreeViewItem> | null | undefined {
    return null;
  }
}

type FreeInstructionProps = {
  getGroupIconSrc: (arg0: string) => string;
  parentGroupIconSrc?: string;
  parentId?: string;
};

export const createFreeInstructionTreeViewItem = ({
  instructionOrGroup,
  freeInstructionProps,
}: {
  instructionOrGroup: InstructionOrExpressionTreeNode;
  freeInstructionProps: FreeInstructionProps;
}): TreeViewItem[] => {
  return Object.entries(instructionOrGroup).map(
    ([categoryName, subInstructionOrGroup]) => {
      // In theory, we should have a way to distinguish
      // between instruction (leaf nodes) and group (nodes). We use
      // the "type" properties, but this will fail if a group is called "type"
      // (hence the flow errors, which are valid warnings)
      if (typeof subInstructionOrGroup.type === 'string') {
        // see above
        const instructionMetadata: EnumeratedInstructionMetadata =
          subInstructionOrGroup;
        return new LeafTreeViewItem(
          new InstructionTreeViewItemContent(instructionMetadata)
        );
      }
      // see above
      const groupOfInstructionInformation: InstructionOrExpressionTreeNode =
        subInstructionOrGroup;
      const parentGroupIconSrc =
        freeInstructionProps.getGroupIconSrc(categoryName) ||
        freeInstructionProps.parentGroupIconSrc;
      const subFreeInstructionProps = {
        ...freeInstructionProps,
        parentGroupIconSrc,
      };
      const content = new InstructionGroupTreeViewItemContent(
        categoryName,
        subFreeInstructionProps
      );

      const childFreeInstructionProps = {
        ...subFreeInstructionProps,
        parentId: content.getId(),
      };

      return new InstructionGroupTreeViewItem(
        content,
        createFreeInstructionTreeViewItem({
          instructionOrGroup: groupOfInstructionInformation,
          freeInstructionProps: childFreeInstructionProps,
        })
      );
    }
  );
};

export class InstructionCategoryTreeViewItem implements TreeViewItem {
  content: TreeViewItemContent;
  children: TreeViewItem[];
  isRoot = true;

  constructor(content: TreeViewItemContent, children: TreeViewItem[]) {
    this.content = content;
    this.children = children;
  }

  getChildren(): Array<TreeViewItem> | null | undefined {
    return this.children;
  }
}
export class InstructionGroupTreeViewItem implements TreeViewItem {
  content: TreeViewItemContent;
  children: TreeViewItem[];
  isRoot = false;
  openWithSingleClick = true;

  constructor(content: TreeViewItemContent, children: TreeViewItem[]) {
    this.content = content;
    this.children = children;
  }

  getChildren(): Array<TreeViewItem> | null | undefined {
    return this.children;
  }
}

export class InstructionGroupTreeViewItemContent
  implements TreeViewItemContent
{
  name: string;
  props: FreeInstructionProps;
  applySearch = false;

  constructor(name: string, props: FreeInstructionProps) {
    this.name = name;
    this.props = props;
  }

  getName(): string {
    return this.name;
  }
  getDescription(): string | null {
    return null;
  }

  getId(): string {
    return getInstructionGroupId(this.name, this.props.parentId);
  }

  getHtmlId(): string | null {
    return null;
  }
  getDataSet(): HTMLDataset {
    return {
      group: this.name,
    };
  }
  getThumbnail(): string | undefined {
    return !this.props.parentId
      ? 'NONE'
      : this.props.getGroupIconSrc(this.name) || this.props.parentGroupIconSrc;
  }
}

export class InstructionTreeViewItemContent implements TreeViewItemContent {
  instructionMetadata: EnumeratedInstructionMetadata;
  applySearch = false;
  constructor(instructionMetadata: EnumeratedInstructionMetadata) {
    this.instructionMetadata = instructionMetadata;
  }
  getInstructionMetadata(): EnumeratedInstructionMetadata {
    return this.instructionMetadata;
  }
  getName(): string {
    return this.instructionMetadata.displayedName;
  }
  getDescription(): string | null {
    return null;
  }

  getId(): string {
    return `instruction-item-${this.instructionMetadata.type.replace(
      /:/g,
      '-'
    )}`;
  }
  getHtmlId(): string {
    return this.getId();
  }
  getDataSet(): HTMLDataset {
    return {
      instructionType: this.instructionMetadata.type.replace(/:/g, '-'),
      object: this.instructionMetadata.scope.objectMetadata
        ? this.instructionMetadata.scope.objectMetadata.name.replace(
            /:/g,
            '-'
          ) + '-'
        : undefined,
    };
  }
  getThumbnail(): string {
    return this.instructionMetadata.iconFilename;
  }
}

export class MoreResultsTreeViewItemContent implements TreeViewItemContent {
  applySearch = false;
  name: React.ReactNode;
  onClick: () => void;

  constructor(name: React.ReactNode, onClick: () => void) {
    this.name = name;
    this.onClick = onClick;
  }

  getName(): React.ReactNode {
    return this.name;
  }
  getDescription(): string | null {
    return null;
  }

  getId(): string {
    return `more-instructions`;
  }
  getHtmlId(): string | null {
    return null;
  }
  getDataSet(): HTMLDataset {
    return {};
  }
  getThumbnail(): string {
    return 'res/share-external_black.svg';
  }
}
