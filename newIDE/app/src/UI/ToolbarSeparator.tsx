import * as React from 'react';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';

const ToolbarSeparator: React.FC<{}> = () => {
  const theme: any = React.useContext(GDevelopThemeContext);
  return (
    <span
      style={{
        height: 32,
        marginLeft: 3,
        marginRight: 3,
        borderLeftStyle: 'solid',
        borderLeftWidth: 1,
        borderColor: theme.toolbar.separatorColor,
      }}
    />
  );
};

export default ToolbarSeparator;
