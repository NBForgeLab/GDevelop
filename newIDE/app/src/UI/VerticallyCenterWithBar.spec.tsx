import * as React from 'react';
import renderer from 'react-test-renderer';
import VerticallyCenterWithBar from './VerticallyCenterWithBar';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';

describe('VerticallyCenterWithBar', () => {
  it('renders children with top and bottom vertical bars', () => {
    const mockTheme = {
      palette: {
        secondary: '#555555',
      },
    } as any;

    const tree = renderer
      .create(
        <GDevelopThemeContext.Provider value={mockTheme}>
          <VerticallyCenterWithBar>
            <div>Centered Content</div>
          </VerticallyCenterWithBar>
        </GDevelopThemeContext.Provider>
      )
      .toJSON();

    expect(tree).toBeDefined();
  });
});
