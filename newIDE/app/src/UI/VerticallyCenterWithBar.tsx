import * as React from 'react';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';

const styles = {
  container: {
    display: 'flex' as const,
    alignSelf: 'stretch' as const,
    flexDirection: 'column' as const,
    justifyContent: 'stretch' as const,
    alignItems: 'center' as const,
  },
  verticalBar: {
    flex: 1,
  },
  childrenContainer: {
    flex: 0,
  },
};

export interface VerticallyCenterWithBarProps {
  children: React.ReactNode;
}

const VerticallyCenterWithBar: React.FC<VerticallyCenterWithBarProps> = (
  props: VerticallyCenterWithBarProps
) => {
  const gdevelopTheme: any = React.useContext(GDevelopThemeContext);

  return (
    <div style={styles.container}>
      <div
        style={{
          ...styles.verticalBar,
          borderLeft: `1px solid ${gdevelopTheme.palette.secondary}`,
        }}
      />
      <div style={styles.childrenContainer}>{props.children}</div>
      <div
        style={{
          ...styles.verticalBar,
          borderLeft: `1px solid ${gdevelopTheme.palette.secondary}`,
        }}
      />
    </div>
  );
};

export default VerticallyCenterWithBar;
