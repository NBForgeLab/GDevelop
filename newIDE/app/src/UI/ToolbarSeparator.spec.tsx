import * as React from 'react';
import renderer from 'react-test-renderer';
import ToolbarSeparator from './ToolbarSeparator';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';

describe('ToolbarSeparator', () => {
  it('renders a vertical separator using the theme color', () => {
    const mockTheme = {
      toolbar: {
        separatorColor: '#cccccc',
      },
    } as any;

    const tree = renderer
      .create(
        <GDevelopThemeContext.Provider value={mockTheme}>
          <ToolbarSeparator />
        </GDevelopThemeContext.Provider>
      )
      .toJSON();

    expect(tree).toBeDefined();
  });
});
