import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import DismissableAlertMessage from './DismissableAlertMessage';
import AlertMessage from './AlertMessage';
import PreferencesContext from '../MainFrame/Preferences/PreferencesContext';
import AlertContext from './Alert/AlertContext';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';

describe('DismissableAlertMessage', () => {
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

  const createMockPreferences = (
    hiddenAlertMessages: Record<string, boolean> = {},
    showAlertMessage = jest.fn()
  ) =>
    ({
      values: {
        hiddenAlertMessages,
      },
      showAlertMessage,
    } as any);

  it('renders alert message when not marked as hidden', () => {
    const preferences = createMockPreferences();
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <GDevelopThemeContext.Provider value={mockGDevelopTheme}>
          <PreferencesContext.Provider value={preferences}>
            <DismissableAlertMessage kind="info" identifier="default-additional-work">
              Test message
            </DismissableAlertMessage>
          </PreferencesContext.Provider>
        </GDevelopThemeContext.Provider>
      </ThemeProvider>
    );

    expect(component.toJSON()).toBeDefined();
    expect(component.root.findByProps({ children: 'Test message' })).toBeDefined();
  });

  it('renders null when message is marked as hidden', () => {
    const preferences = createMockPreferences({
      'default-additional-work': true,
    });
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <GDevelopThemeContext.Provider value={mockGDevelopTheme}>
          <PreferencesContext.Provider value={preferences}>
            <DismissableAlertMessage kind="info" identifier="default-additional-work">
              Test message
            </DismissableAlertMessage>
          </PreferencesContext.Provider>
        </GDevelopThemeContext.Provider>
      </ThemeProvider>
    );

    expect(component.toJSON()).toBeNull();
  });

  it('renders message when hiddenAlertMessages is missing or empty', () => {
    const preferences = { values: {} } as any;
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <GDevelopThemeContext.Provider value={mockGDevelopTheme}>
          <PreferencesContext.Provider value={preferences}>
            <DismissableAlertMessage kind="info" identifier="default-additional-work">
              Fallback message
            </DismissableAlertMessage>
          </PreferencesContext.Provider>
        </GDevelopThemeContext.Provider>
      </ThemeProvider>
    );

    expect(component.toJSON()).toBeDefined();
    expect(component.root.findByProps({ children: 'Fallback message' })).toBeDefined();
  });

  it('calls showAlertMessage with false when confirmation is accepted', async () => {
    const showAlertMessage = jest.fn();
    const preferences = createMockPreferences({}, showAlertMessage);
    const showConfirmDialog = jest.fn(({ callback }) => callback(true));
    const mockAlertContext = {
      showAlertDialog: jest.fn(),
      showConfirmDialog,
      showConfirmDeleteDialog: jest.fn(),
      showYesNoCancelDialog: jest.fn(),
    };

    let component: any;
    await act(async () => {
      component = renderer.create(
        <ThemeProvider theme={muiTheme}>
          <GDevelopThemeContext.Provider value={mockGDevelopTheme}>
            <AlertContext.Provider value={mockAlertContext}>
              <PreferencesContext.Provider value={preferences}>
                <DismissableAlertMessage kind="warning" identifier="default-additional-work">
                  Warning hint
                </DismissableAlertMessage>
              </PreferencesContext.Provider>
            </AlertContext.Provider>
          </GDevelopThemeContext.Provider>
        </ThemeProvider>
      );
    });

    const alertMessage = component!.root.findByType(AlertMessage);
    await act(async () => {
      await alertMessage.props.onHide();
    });

    expect(showConfirmDialog).toHaveBeenCalled();
    expect(showAlertMessage).toHaveBeenCalledWith('default-additional-work', false);
  });

  it('does not call showAlertMessage when confirmation is declined', async () => {
    const showAlertMessage = jest.fn();
    const preferences = createMockPreferences({}, showAlertMessage);
    const showConfirmDialog = jest.fn(({ callback }) => callback(false));
    const mockAlertContext = {
      showAlertDialog: jest.fn(),
      showConfirmDialog,
      showConfirmDeleteDialog: jest.fn(),
      showYesNoCancelDialog: jest.fn(),
    };

    let component: any;
    await act(async () => {
      component = renderer.create(
        <ThemeProvider theme={muiTheme}>
          <GDevelopThemeContext.Provider value={mockGDevelopTheme}>
            <AlertContext.Provider value={mockAlertContext}>
              <PreferencesContext.Provider value={preferences}>
                <DismissableAlertMessage kind="info" identifier="default-additional-work">
                  Info hint
                </DismissableAlertMessage>
              </PreferencesContext.Provider>
            </AlertContext.Provider>
          </GDevelopThemeContext.Provider>
        </ThemeProvider>
      );
    });

    const alertMessage = component!.root.findByType(AlertMessage);
    await act(async () => {
      await alertMessage.props.onHide();
    });

    expect(showConfirmDialog).toHaveBeenCalled();
    expect(showAlertMessage).not.toHaveBeenCalled();
  });
});
