import * as React from 'react';

const style = {
  display: 'flex',
};

type Props = {
  children: React.ReactNode;
  height: number | string;
  width?: number | string;
  alignItems?: 'center';
  justifyContent?: 'center';
};

const FixedHeightFlexContainer = ({
  children,
  height,
  width,
  alignItems,
  justifyContent,
}: Props): React.ReactElement<any> => (
  <div style={{ ...style, height, width, alignItems, justifyContent }}>
    {children}
  </div>
);

export default FixedHeightFlexContainer;
