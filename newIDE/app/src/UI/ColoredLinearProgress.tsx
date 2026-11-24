import * as React from 'react';

import MuiLinearProgress from '@material-ui/core/LinearProgress';
import { makeStyles } from '@material-ui/core';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';

const styles: {
  linearProgress: React.CSSProperties;
} = {
  linearProgress: { flex: 1 },
};

type Props = {
  expand?: boolean;
  value?: number | null;
};

function ColoredLinearProgress(props: Props): React.ReactNode {
  const gdevelopTheme = React.useContext(GDevelopThemeContext);
  const classes = makeStyles({
    root: {
      height: 10,
      borderRadius: 5,
    },
    colorPrimary: {
      backgroundColor: gdevelopTheme.paper.backgroundColor.medium,
    },
    bar: {
      borderRadius: 5,
      backgroundColor:
        props.value === 100
          ? gdevelopTheme.linearProgress.color.complete
          : gdevelopTheme.linearProgress.color.incomplete,
    },
  })();

  return (
    <MuiLinearProgress
      classes={classes}
      style={styles.linearProgress}
      variant="determinate"
      value={props.value ?? undefined}
    />
  );
}

export default ColoredLinearProgress;
