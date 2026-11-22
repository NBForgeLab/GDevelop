import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import IconButton from './IconButton';
import MUIIconButton from '@material-ui/core/IconButton';
import Tooltip from '@material-ui/core/Tooltip';
import { I18nProvider } from '@lingui/react';

describe('IconButton', () => {
  it('renders a button with child icon', () => {
    const component = renderer.create(
      <IconButton>
        <span id="test-icon">icon</span>
      </IconButton>
    );
    const muiButton = component.root.findByType(MUIIconButton);
    expect(muiButton.props.color).toBe('secondary');
    expect(component.root.findByProps({ id: 'test-icon' })).toBeDefined();
  });

  it('renders selected state with inherit color', () => {
    const component = renderer.create(
      <IconButton selected>
        <span>icon</span>
      </IconButton>
    );
    const muiButton = component.root.findByType(MUIIconButton);
    expect(muiButton.props.color).toBe('inherit');
  });

  it('handles onClick callback', () => {
    const onClick = jest.fn();
    const component = renderer.create(
      <IconButton onClick={onClick}>
        <span>icon</span>
      </IconButton>
    );
    const muiButton = component.root.findByType(MUIIconButton);

    act(() => {
      muiButton.props.onClick({ type: 'click' });
    });

    expect(onClick).toHaveBeenCalledWith({ type: 'click' });
  });

  it('handles onContextMenu callback', () => {
    const onContextMenu = jest.fn();
    const component = renderer.create(
      <IconButton onContextMenu={onContextMenu}>
        <span>icon</span>
      </IconButton>
    );
    const muiButton = component.root.findByType(MUIIconButton);

    act(() => {
      muiButton.props.onContextMenu({ type: 'contextmenu' });
    });

    expect(onContextMenu).toHaveBeenCalledWith({ type: 'contextmenu' });
  });

  it('renders with tooltip and adapted accelerator string when provided', () => {
    const component = renderer.create(
      <I18nProvider language="en" catalogs={{ en: { messages: {} } }}>
        <IconButton tooltip="Close" acceleratorString="CmdOrCtrl+W">
          <span>icon</span>
        </IconButton>
      </I18nProvider>
    );
    const tooltip = component.root.findByType(Tooltip);
    expect(tooltip).toBeDefined();
    expect(tooltip.props.placement).toBe('bottom');
    expect(tooltip.props.title).toContain('Close');
    expect(tooltip.props.title).toMatch(/\((Ctrl|Cmd)\+W\)/);
  });

  it('renders with tooltip descriptor object and falls back safely without provider', () => {
    const component = renderer.create(
      <IconButton tooltip={{ id: 'Save', default: 'Save File' }}>
        <span>icon</span>
      </IconButton>
    );
    const tooltip = component.root.findByType(Tooltip);
    expect(tooltip.props.title).toBe('Save File');
  });

  it('does not render tooltip when disabled', () => {
    const component = renderer.create(
      <IconButton disabled tooltip="Disabled tooltip">
        <span>icon</span>
      </IconButton>
    );
    expect(component.root.findAllByType(Tooltip)).toHaveLength(0);
    const muiButton = component.root.findByType(MUIIconButton);
    expect(muiButton.props.disabled).toBe(true);
  });

  it('forwards ref without error', () => {
    const ref = React.createRef<HTMLButtonElement>();
    expect(() => {
      renderer.create(
        <IconButton ref={ref}>
          <span>icon</span>
        </IconButton>
      );
    }).not.toThrow();
  });
});
