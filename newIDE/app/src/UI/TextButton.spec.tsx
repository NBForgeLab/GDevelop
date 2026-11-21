import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import TextButton from './TextButton';
import Button from '@material-ui/core/Button';

describe('TextButton', () => {
  it('renders a text button with label', () => {
    const component = renderer.create(<TextButton label="Click Me" />);
    const button = component.root.findByType(Button);
    expect(button.props.variant).toBe('text');
    expect(button.props.color).toBe('default');
    const labelSpan = component.root
      .findAllByType('span')
      .find((span: any) => span.props.children === 'Click Me');
    expect(labelSpan).toBeDefined();
  });

  it('renders primary and secondary button', () => {
    const primaryComponent = renderer.create(
      <TextButton label="Primary" primary />
    );
    expect(primaryComponent.root.findByType(Button).props.color).toBe(
      'primary'
    );

    const secondaryComponent = renderer.create(
      <TextButton label="Secondary" secondary />
    );
    expect(secondaryComponent.root.findByType(Button).props.color).toBe(
      'secondary'
    );
  });

  it('renders with icon and rightIcon and spacers', () => {
    const leftIcon = <span id="left-icon">L</span>;
    const rightIcon = <span id="right-icon">R</span>;
    const component = renderer.create(
      <TextButton label="Icons" icon={leftIcon} rightIcon={rightIcon} />
    );
    expect(component.root.findByProps({ id: 'left-icon' })).toBeDefined();
    expect(component.root.findByProps({ id: 'right-icon' })).toBeDefined();
    const spacers = component.root.findAll(
      (node: any) =>
        node.props && node.props.style && node.props.style.width === 4
    );
    expect(spacers).toHaveLength(2);
  });

  it('renders icon only without spacers when no label', () => {
    const icon = <span id="solo-icon">S</span>;
    const component = renderer.create(<TextButton icon={icon} />);
    expect(component.root.findByProps({ id: 'solo-icon' })).toBeDefined();
    const spacers = component.root.findAll(
      (node: any) =>
        node.props && node.props.style && node.props.style.width === 4
    );
    expect(spacers).toHaveLength(0);
  });

  it('renders icon and rightIcon with single spacer between them when no label', () => {
    const leftIcon = <span id="left-icon">L</span>;
    const rightIcon = <span id="right-icon">R</span>;
    const component = renderer.create(
      <TextButton icon={leftIcon} rightIcon={rightIcon} />
    );
    expect(component.root.findByProps({ id: 'left-icon' })).toBeDefined();
    expect(component.root.findByProps({ id: 'right-icon' })).toBeDefined();
    const spacers = component.root.findAll(
      (node: any) =>
        node.props && node.props.style && node.props.style.width === 4
    );
    expect(spacers).toHaveLength(1);
  });

  it('handles onClick callback', () => {
    const onClick = jest.fn();
    const component = renderer.create(
      <TextButton label="Action" onClick={onClick} />
    );
    const button = component.root.findByType(Button);

    act(() => {
      button.props.onClick({ type: 'click' });
    });

    expect(onClick).toHaveBeenCalledWith({ type: 'click' });
  });

  it('handles allowBrowserAutoTranslate', () => {
    const defaultComponent = renderer.create(<TextButton label="Default" />);
    expect(
      defaultComponent.root.findByType(Button).props.translate
    ).toBeUndefined();

    const noTranslateComponent = renderer.create(
      <TextButton label="No Translate" allowBrowserAutoTranslate={false} />
    );
    expect(noTranslateComponent.root.findByType(Button).props.translate).toBe(
      'no'
    );
  });

  it('supports disabled, keyboardFocused, fullWidth, id, and target', () => {
    const component = renderer.create(
      <TextButton
        label="Options"
        disabled
        keyboardFocused
        fullWidth
        id="test-btn"
        target="_blank"
        href="https://gdevelop.io"
      />
    );
    const button = component.root.findByType(Button);
    expect(button.props.disabled).toBe(true);
    expect(button.props.autoFocus).toBe(true);
    expect(button.props.fullWidth).toBe(true);
    expect(button.props.id).toBe('test-btn');
    expect(button.props.target).toBe('_blank');
    expect(button.props.href).toBe('https://gdevelop.io');
  });

  it('forwards ref without error', () => {
    const ref = React.createRef<HTMLButtonElement>();
    expect(() => {
      renderer.create(<TextButton label="With Ref" ref={ref} />);
    }).not.toThrow();
  });
});
