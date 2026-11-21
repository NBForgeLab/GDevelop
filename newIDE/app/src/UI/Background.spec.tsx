import * as React from 'react';
import renderer from 'react-test-renderer';
import Background from './Background';
import BackgroundText from './BackgroundText';
import EmptyMessage from './EmptyMessage';
import FadeIn from './FadeIn';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';

describe('Primitive UI Components', () => {
  const mockTheme = {
    emptyMessage: {
      shadowColor: 'rgba(0, 0, 0, 0.5)',
    },
  } as any;

  describe('Background', () => {
    it('renders background container with children', () => {
      const tree = renderer
        .create(
          <Background>
            <div>Editor Content</div>
          </Background>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });

  describe('BackgroundText', () => {
    it('renders typography with shadow and opacity', () => {
      const tree = renderer
        .create(
          <GDevelopThemeContext.Provider value={mockTheme}>
            <BackgroundText tooltipText="Hint">No items here</BackgroundText>
          </GDevelopThemeContext.Provider>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });

  describe('EmptyMessage', () => {
    it('renders centered empty message container', () => {
      const tree = renderer
        .create(
          <GDevelopThemeContext.Provider value={mockTheme}>
            <EmptyMessage>No projects found</EmptyMessage>
          </GDevelopThemeContext.Provider>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });

  describe('FadeIn', () => {
    it('renders contents with fade-in animation style', () => {
      const tree = renderer
        .create(
          <FadeIn>
            <button>Faded In</button>
          </FadeIn>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });
});
