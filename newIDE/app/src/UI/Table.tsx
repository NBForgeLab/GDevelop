import * as React from 'react';
import MUITable from '@material-ui/core/Table';
import MUITableBody from '@material-ui/core/TableBody';
import MUITableCell from '@material-ui/core/TableCell';
import MUITableHead from '@material-ui/core/TableHead';
import MUITableRow from '@material-ui/core/TableRow';

type TableCellCommonProps = {
  // Content for the cell
  children?: React.ReactNode;
  style?: React.CSSProperties;
};

type TableProps = {
  // Should be TableHeader, TableBody or TableFooter
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/**
 * A Table based on Material-UI Table.
 * See https://material-ui.com/components/tables/
 */
export class Table extends React.Component<TableProps> {
  render(): any {
    return <MUITable size="small" {...this.props} />;
  }
}

type TableBodyProps = {
  // Should be TableRow
  children?: React.ReactNode;
};

/**
 * A TableBody based on Material-UI TableBody.
 */
export class TableBody extends React.Component<TableBodyProps> {
  render(): any {
    return <MUITableBody {...this.props} />;
  }
}

type TableHeaderProps = {
  // Should be a TableRow
  children: React.ReactNode;
};

/**
 * A TableHeader based on Material-UI TableHead.
 */
export class TableHeader extends React.Component<TableHeaderProps> {
  render(): any {
    return <MUITableHead {...this.props} />;
  }
}

type TableHeaderColumnProps = TableCellCommonProps & {
  padding?: 'none';
};

/**
 * A TableHeaderColumn based on Material-UI TableCell.
 */
export class TableHeaderColumn extends React.Component<TableHeaderColumnProps> {
  render(): any {
    return <MUITableCell {...this.props} />;
  }
}

type TableRowProps = {
  children: React.ReactNode;
  style?: React.CSSProperties;
  onPointerEnter?: () => void;
  onPointerLeave?: () => void;
  onClick?: () => void;
};

/**
 * A TableRow based on Material-UI TableRow.
 */
export class TableRow extends React.Component<TableRowProps> {
  render(): any {
    return <MUITableRow {...this.props} />;
  }
}

type TableRowColumnProps = TableCellCommonProps & {
  padding?: 'none';
};

/**
 * A TableRowColumn based on Material-UI TableRowColumn.
 */
export class TableRowColumn extends React.Component<TableRowColumnProps> {
  render(): any {
    return <MUITableCell {...this.props} />;
  }
}
