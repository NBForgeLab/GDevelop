import * as React from 'react';
import renderer from 'react-test-renderer';
import AlertMessage from './AlertMessage';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';

describe('AlertMessage', () => {
  const muiTheme = createMuiTheme();
  const mockGDevelopTheme = {
    message: {
      info: '#2196f3',
      warning: '#ff9800',
      error: '#f44336',
      valid: '#4caf50',
    },
    paper: {
      backgroundColor: {
        dark: '#111111',
        medium: '#222222',
        light: '#ffffff',
      },
    },
  } as any;

  const renderWithProviders = (element: React.ReactElement) =>
    renderer.create(
      <ThemeProvider theme={muiTheme}>
        <GDevelopThemeContext.Provider value={mockGDevelopTheme}>
          {element}
        </GDevelopThemeContext.Provider>
      </ThemeProvider>
    );

  it('renders info alert message by default', () => {
    const tree = renderWithProviders(
      <AlertMessage kind="info">This is an info alert</AlertMessage>
    ).toJSON();
    expect(tree).toBeDefined();
  });

  it('renders warning alert message', () => {
    const tree = renderWithProviders(
      <AlertMessage kind="warning">This is a warning</AlertMessage>
    ).toJSON();
    expect(tree).toBeDefined();
  });

  it('renders error alert message', () => {
    const tree = renderWithProviders(
      <AlertMessage kind="error">This is an error</AlertMessage>
    ).toJSON();
    expect(tree).toBeDefined();
  });

  it('renders with hide button when onHide is provided', () => {
    const onHide = jest.fn();
    const tree = renderWithProviders(
      <AlertMessage kind="info" onHide={onHide}>
        Dismissable message
      </AlertMessage>
    ).toJSON();
    expect(tree).toBeDefined();
  });

  it('renders contentOnly when specified', () => {
    const tree = renderWithProviders(
      <AlertMessage contentOnly>Raw text</AlertMessage>
    ).toJSON();
    expect(tree).toBeDefined();
  });
});
