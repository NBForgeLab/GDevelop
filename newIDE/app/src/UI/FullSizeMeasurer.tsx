import * as React from 'react';
import Measure from 'react-measure';

const styles = {
  flexContainer: {
    display: 'flex' as const,
    flex: 1,
    position: 'relative' as const,
  },
};

export interface FullSizeMeasurerDimensions {
  width: number;
  height: number;
}

export interface FullSizeMeasurerProps {
  children: (dimensions: FullSizeMeasurerDimensions) => React.ReactNode;
}

/**
 * Take a component and pass the maximum size that the component can take
 * as width and height props.
 */
export const FullSizeMeasurer: React.FC<FullSizeMeasurerProps> = ({
  children,
}: FullSizeMeasurerProps) => (
  <Measure bounds>
    {({ contentRect, measureRef }: any) => (
      <div style={styles.flexContainer} ref={measureRef}>
        {!!contentRect &&
          !!contentRect.bounds &&
          children({
            width: contentRect.bounds.width,
            height: contentRect.bounds.height,
          })}
      </div>
    )}
  </Measure>
);
