import * as React from 'react';

const styles = {
  row: {
    display: 'flex',
  },
  cell: {
    display: 'flex',
    alignItems: 'center',
    paddingLeft: 4,
    paddingRight: 4,
  },
};

type TreeTableRowProps = {
  id?: string;
  children: React.ReactNode;
  /* Allow to specify a different alignment than the default (centered). */
  alignItems?: 'flex-start' | null;
};

export const TreeTableRow = (
  props: TreeTableRowProps
): React.ReactElement<any> => {
  return (
    <div
      id={props.id}
      style={{
        ...styles.row,
        alignItems: props.alignItems || undefined,
      }}
    >
      {props.children}
    </div>
  );
};

type TreeTableCellProps = {
  style?: React.CSSProperties;
  expand?: boolean;
  children?: React.ReactNode;
};

export const TreeTableCell = (
  props: TreeTableCellProps
): React.ReactElement<any> => (
  <div
    style={{
      ...styles.cell,
      flex: props.expand ? 1 : undefined,
      ...props.style,
    }}
  >
    {props.children}
  </div>
);
