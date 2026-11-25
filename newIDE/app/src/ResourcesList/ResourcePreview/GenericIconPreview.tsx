import * as React from 'react';
import CheckeredBackground from '../CheckeredBackground';

const styles: Record<string, React.CSSProperties> = {
  previewContainer: {
    position: 'relative',
    display: 'flex',
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    height: 200,
  },
  iconContainer: {
    display: 'flex',
    flex: 1,
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  icon: { width: 60, height: 60 },
};

type Props = {
  renderIcon: (arg0: { style: React.CSSProperties }) => React.ReactNode;
};

/**
 * Display a generic container to display an icon.
 */
const GenericIconPreview = ({ renderIcon }: Props): React.ReactElement<any> => (
  <div style={styles.previewContainer}>
    <CheckeredBackground />
    <div style={styles.iconContainer}>{renderIcon({ style: styles.icon })}</div>
  </div>
);

export default GenericIconPreview;
