import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import RaisedButton from './RaisedButton';
import Button from '@material-ui/core/Button';

describe('RaisedButton', () => {
  it('renders a button with label', () => {
    const component = renderer.create(<RaisedButton label="Raised Click" />);
    const button = component.root.findByType(Button);
    expect(button.props.variant).toBe('contained');
    expect(button.props.color).toBe('default');
    const labelSpan = component.root
      .findAllByType('span')
      .find((span: any) => span.props.children === 'Raised Click');
    expect(labelSpan).toBeDefined();
  });

  it('renders primary button', () => {
    const component = renderer.create(<RaisedButton label="Primary" primary />);
    const button = component.root.findByType(Button);
    expect(button.props.color).toBe('primary');
  });

  it('renders icon-only button with minWidth 0', () => {
    const icon = <span id="star-icon">★</span>;
    const component = renderer.create(<RaisedButton icon={icon} />);
    const button = component.root.findByType(Button);
    expect(button.props.style?.minWidth).toBe(0);
    expect(component.root.findByProps({ id: 'star-icon' })).toBeDefined();
  });

  it('renders with icon and rightIcon', () => {
    const icon = <span id="left-icon">L</span>;
    const rightIcon = <span id="right-icon">R</span>;
    const component = renderer.create(
      <RaisedButton label="Two Icons" icon={icon} rightIcon={rightIcon} />
    );
    expect(component.root.findByProps({ id: 'left-icon' })).toBeDefined();
    expect(component.root.findByProps({ id: 'right-icon' })).toBeDefined();
  });

  it('handles onClick callback', () => {
    const onClick = jest.fn();
    const component = renderer.create(
      <RaisedButton label="Action" onClick={onClick} />
    );
    const button = component.root.findByType(Button);

    act(() => {
      button.props.onClick({ type: 'click' });
    });

    expect(onClick).toHaveBeenCalledWith({ type: 'click' });
  });

  it('applies color variants correctly', () => {
    const colors = ['success', 'danger', 'premium', 'ai'] as const;
    colors.forEach((color) => {
      const component = renderer.create(
        <RaisedButton label={color} color={color} />
      );
      const button = component.root.findByType(Button);
      expect(button.props.className).toBeDefined();
    });
  });

  it('combines custom className with color variant classes without clobbering', () => {
    const component = renderer.create(
      <RaisedButton label="Success" color="success" className="custom-class" />
    );
    const button = component.root.findByType(Button);
    expect(button.props.className).toContain('custom-class');
    expect(button.props.className).toContain('buttonSuccess');
  });

  it('supports link attributes (href, target, rel)', () => {
    const component = renderer.create(
      <RaisedButton
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

  it('supports disabled, keyboardFocused, fullWidth, and size', () => {
    const component = renderer.create(
      <RaisedButton
        label="Options"
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
  });

  it('forwards ref without error', () => {
    const ref = React.createRef<HTMLButtonElement>();
    expect(() => {
      renderer.create(<RaisedButton label="With Ref" ref={ref} />);
    }).not.toThrow();
  });
});
