import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import FlatButton from './FlatButton';
import Button from '@material-ui/core/Button';

describe('FlatButton', () => {
  it('renders a button with label', () => {
    const component = renderer.create(<FlatButton label="Click Me" />);
    const button = component.root.findByType(Button);
    expect(button.props.variant).toBe('outlined');
    expect(button.props.color).toBe('default');
    const labelSpan = component.root
      .findAllByType('span')
      .find((span: any) => span.props.children === 'Click Me');
    expect(labelSpan).toBeDefined();
  });

  it('renders primary button', () => {
    const component = renderer.create(<FlatButton label="Primary" primary />);
    const button = component.root.findByType(Button);
    expect(button.props.color).toBe('secondary');
  });

  it('renders with left and right icons and spacers', () => {
    const leftIcon = <span id="left-icon">L</span>;
    const rightIcon = <span id="right-icon">R</span>;
    const component = renderer.create(
      <FlatButton label="Icons" leftIcon={leftIcon} rightIcon={rightIcon} />
    );
    expect(component.root.findByProps({ id: 'left-icon' })).toBeDefined();
    expect(component.root.findByProps({ id: 'right-icon' })).toBeDefined();
    const tree = component.toJSON();
    expect(tree).toBeDefined();
  });

  it('handles onClick callback', () => {
    const onClick = jest.fn();
    const component = renderer.create(
      <FlatButton label="Action" onClick={onClick} />
    );
    const button = component.root.findByType(Button);

    act(() => {
      button.props.onClick({ type: 'click' });
    });

    expect(onClick).toHaveBeenCalledWith({ type: 'click' });
  });

  it('applies color variants and classes correctly', () => {
    const colors = ['primary', 'success', 'danger', 'premium', 'ai'] as const;
    colors.forEach(color => {
      const component = renderer.create(
        <FlatButton label={color} color={color} />
      );
      const div = component.root.findByType('div');
      expect(div.props.className).toContain('coloredButtonContainer');
    });
  });

  it('supports disabled, keyboardFocused, fullWidth, and size', () => {
    const component = renderer.create(
      <FlatButton
        label="Full Options"
        disabled
        keyboardFocused
        fullWidth
        size="large"
      />
    );
    const button = component.root.findByType(Button);
    expect(button.props.disabled).toBe(true);
    expect(button.props.autoFocus).toBe(true);
    expect(button.props.size).toBe('large');
    expect(button.props.fullWidth).toBe(true);
    const div = component.root.findByType('div');
    expect(div.props.className).toContain('fullWidthButtonContainer');
  });

  it('supports link attributes (href, target, rel)', () => {
    const component = renderer.create(
      <FlatButton
        label="Link"
        href="https://gdevelop.io"
        target="_blank"
        rel="noopener noreferrer"
      />
    );
    const button = component.root.findByType(Button);
    expect(button.props.href).toBe('https://gdevelop.io');
    expect(button.props.target).toBe('_blank');
    expect(button.props.rel).toBe('noopener noreferrer');
  });

  it('forwards ref without error', () => {
    const ref = React.createRef<HTMLButtonElement>();
    expect(() => {
      renderer.create(<FlatButton label="With Ref" ref={ref} />);
    }).not.toThrow();
  });
});
