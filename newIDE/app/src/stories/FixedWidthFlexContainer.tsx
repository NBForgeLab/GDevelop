import * as React from 'react';

const style = {
  display: 'flex',
};

type Props = {
  children: React.ReactNode;
  width: number | string;
  alignItems?: 'center';
  justifyContent?: 'center';
};

const FixedWidthFlexContainer = ({
  children,
  width,
  alignItems,
  justifyContent,
}: Props): React.ReactElement<any> => (
  <div style={{ ...style, width, alignItems, justifyContent }}>{children}</div>
);

export default FixedWidthFlexContainer;
