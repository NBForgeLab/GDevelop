import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import Chip, { ChipInterface } from './Chip';
import MuiChip from '@material-ui/core/Chip';
import { ThemeProvider } from '@material-ui/styles';
import { createMuiTheme } from '@material-ui/core/styles';

describe('Chip', () => {
  const muiTheme = createMuiTheme({
    palette: {
      text: {
        primary: '#111111',
        secondary: '#666666',
      },
    },
  });

  it('renders with label and default styling', () => {
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip label="Platformer" />
      </ThemeProvider>
    );

    const muiChip = component.root.findByType(MuiChip);
    expect(muiChip.props.label).toBe('Platformer');
  });

  it('supports textColor primary and secondary', () => {
    const componentPrimary = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip label="Primary text" textColor="primary" />
      </ThemeProvider>
    );
    const muiChipPrimary = componentPrimary.root.findByType(MuiChip);
    expect(muiChipPrimary.props.style.color).toBe('#111111');

    const componentSecondary = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip label="Secondary text" textColor="secondary" />
      </ThemeProvider>
    );
    const muiChipSecondary = componentSecondary.root.findByType(MuiChip);
    expect(muiChipSecondary.props.style.color).toBe('#666666');
  });

  it('triggers onClick and onDelete callbacks', () => {
    const onClick = jest.fn();
    const onDelete = jest.fn();
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip label="Interactive" onClick={onClick} onDelete={onDelete} />
      </ThemeProvider>
    );

    const muiChip = component.root.findByType(MuiChip);
    act(() => {
      muiChip.props.onClick();
    });
    expect(onClick).toHaveBeenCalledTimes(1);

    act(() => {
      muiChip.props.onDelete();
    });
    expect(onDelete).toHaveBeenCalledTimes(1);
  });

  it('sets notranslate class when disableAutoTranslate is true', () => {
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip label="Code" disableAutoTranslate />
      </ThemeProvider>
    );

    const muiChip = component.root.findByType(MuiChip);
    expect(muiChip.props.className).toBe('notranslate');
  });

  it('exposes focus method via ref and calls it safely', () => {
    const ref = React.createRef<ChipInterface>();
    renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip label="Focusable" ref={ref} />
      </ThemeProvider>
    );

    expect(ref.current).toBeDefined();
    expect(typeof ref.current?.focus).toBe('function');
    // Ensure calling focus() doesn't throw even when DOM element is not attached
    expect(() => ref.current?.focus()).not.toThrow();
  });

  it('triggers onFocus and onBlur callbacks', () => {
    const onFocus = jest.fn();
    const onBlur = jest.fn();
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip label="Events" onFocus={onFocus} onBlur={onBlur} />
      </ThemeProvider>
    );

    const muiChip = component.root.findByType(MuiChip);
    act(() => {
      muiChip.props.onFocus();
    });
    expect(onFocus).toHaveBeenCalledTimes(1);

    act(() => {
      muiChip.props.onBlur();
    });
    expect(onBlur).toHaveBeenCalledTimes(1);
  });

  it('passes icon, size, and variant props to MuiChip', () => {
    const Icon = <span id="icon" />;
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip
          label="Detailed"
          icon={Icon}
          size="small"
          variant="outlined"
          color="secondary"
        />
      </ThemeProvider>
    );

    const muiChip = component.root.findByType(MuiChip);
    expect(muiChip.props.icon).toBe(Icon);
    expect(muiChip.props.size).toBe('small');
    expect(muiChip.props.variant).toBe('outlined');
    expect(muiChip.props.color).toBe('secondary');
  });

  it('passes avatar prop to MuiChip', () => {
    const Avatar = <span id="avatar" />;
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip label="Avatar Chip" avatar={Avatar} />
      </ThemeProvider>
    );

    const muiChip = component.root.findByType(MuiChip);
    expect(muiChip.props.avatar).toBe(Avatar);
  });

  it('merges custom style with textColor properly', () => {
    const component = renderer.create(
      <ThemeProvider theme={muiTheme}>
        <Chip
          label="Styled"
          textColor="primary"
          style={{ margin: 8, padding: 4 }}
        />
      </ThemeProvider>
    );

    const muiChip = component.root.findByType(MuiChip);
    expect(muiChip.props.style).toEqual({
      margin: 8,
      padding: 4,
      color: '#111111',
    });
  });
});
