import * as React from 'react';
import CircularProgress from './CircularProgress';

const styles = {
  progress: { marginLeft: 8, verticalAlign: 'middle' },
};

const RightLoader = ({
  children,
  isLoading,
}: {
  children: React.ReactNode;
  isLoading: boolean | null | undefined;
}): React.ReactElement => (
  <span>
    {children}
    {isLoading && <CircularProgress size={20} style={styles.progress} />}
  </span>
);

export default RightLoader;
