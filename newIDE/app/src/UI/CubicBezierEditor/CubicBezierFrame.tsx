import * as React from 'react';
import GDevelopThemeContext from '../Theme/GDevelopThemeContext';

export const framePadding = 8;
const frameBorderWidth = 1;

/** Outer size of a frame whose content has the given size. */
export const getFramedSize = (contentSize: number): number =>
  contentSize + framePadding * 2 + frameBorderWidth * 2;

type Props = {
  children: React.ReactNode;
  style?: React.CSSProperties;
};

/** A bordered panel of the cubic-bezier editor dialog. */
const CubicBezierFrame = React.forwardRef<HTMLDivElement, Props>(
  ({ children, style }, ref) => {
    const gdevelopTheme = React.useContext(GDevelopThemeContext);
    return (
      <div
        ref={ref}
        style={{
          border: `${frameBorderWidth}px solid ${gdevelopTheme.dialog.separator}`,
          borderRadius: 8,
          padding: framePadding,
          boxSizing: 'border-box',
          backgroundColor: gdevelopTheme.paper.backgroundColor.medium,
          ...style,
        }}
      >
        {children}
      </div>
    );
  }
);

export default CubicBezierFrame;
