import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import TwoStatesButton, { TwoStatesButtonInterface } from './TwoStatesButton';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';

describe('TwoStatesButton', () => {
  const leftButton = {
    value: 'left',
    label: 'Left Option',
    id: 'left-btn-id',
  };
  const rightButton = {
    value: 'right',
    label: 'Right Option',
    id: 'right-btn-id',
  };

  it('renders both buttons with correct state when left is active', () => {
    const onChange = jest.fn();
    const component = renderer.create(
      <TwoStatesButton
        leftButton={leftButton}
        rightButton={rightButton}
        value="left"
        onChange={onChange}
      />
    );

    const buttonGroup = component.root.findByType(ButtonGroup);
    expect(buttonGroup.props.size).toBe('small');
    expect(buttonGroup.props.disableElevation).toBe(true);

    const buttons = component.root.findAllByType(Button);
    expect(buttons).toHaveLength(2);

    const [leftBtn, rightBtn] = buttons;
    expect(leftBtn.props.id).toBe('left-btn-id');
    expect(leftBtn.props.variant).toBe('contained');
    expect(leftBtn.props.color).toBe('secondary');
    expect(leftBtn.props['data-effective']).toBe('true');

    expect(rightBtn.props.id).toBe('right-btn-id');
    expect(rightBtn.props.variant).toBe('outlined');
    expect(rightBtn.props.color).toBe('default');
    expect(rightBtn.props['data-effective']).toBeUndefined();
  });

  it('renders both buttons with correct state when right is active', () => {
    const onChange = jest.fn();
    const component = renderer.create(
      <TwoStatesButton
        leftButton={leftButton}
        rightButton={rightButton}
        value="right"
        onChange={onChange}
      />
    );

    const [leftBtn, rightBtn] = component.root.findAllByType(Button);
    expect(leftBtn.props.variant).toBe('outlined');
    expect(leftBtn.props.color).toBe('default');
    expect(leftBtn.props['data-effective']).toBeUndefined();

    expect(rightBtn.props.variant).toBe('contained');
    expect(rightBtn.props.color).toBe('secondary');
    expect(rightBtn.props['data-effective']).toBe('true');
  });

  it('calls onChange when buttons are clicked', () => {
    const onChange = jest.fn();
    const component = renderer.create(
      <TwoStatesButton
        leftButton={leftButton}
        rightButton={rightButton}
        value="left"
        onChange={onChange}
      />
    );

    const [leftBtn, rightBtn] = component.root.findAllByType(Button);

    act(() => {
      leftBtn.props.onClick();
    });
    expect(onChange).toHaveBeenCalledWith('left');

    act(() => {
      rightBtn.props.onClick();
    });
    expect(onChange).toHaveBeenCalledWith('right');
  });

  it('renders icons with spacers when present', () => {
    const leftIcon = <span id="l-icon">L</span>;
    const rightIcon = <span id="r-icon">R</span>;
    const component = renderer.create(
      <TwoStatesButton
        leftButton={{ ...leftButton, icon: leftIcon }}
        rightButton={{ ...rightButton, icon: rightIcon }}
        value="left"
        onChange={jest.fn()}
      />
    );

    expect(component.root.findByProps({ id: 'l-icon' })).toBeDefined();
    expect(component.root.findByProps({ id: 'r-icon' })).toBeDefined();
  });

  it('passes disabled prop to ButtonGroup', () => {
    const component = renderer.create(
      <TwoStatesButton
        leftButton={leftButton}
        rightButton={rightButton}
        value="left"
        disabled
        onChange={jest.fn()}
      />
    );

    const buttonGroup = component.root.findByType(ButtonGroup);
    expect(buttonGroup.props.disabled).toBe(true);
  });

  it('provides focusLeftButton imperative handle', () => {
    const ref = React.createRef<TwoStatesButtonInterface>();
    renderer.create(
      <TwoStatesButton
        leftButton={leftButton}
        rightButton={rightButton}
        value="left"
        onChange={jest.fn()}
        ref={ref}
      />
    );

    expect(ref.current).toBeDefined();
    if (!ref.current) throw new Error('ref is null');
    expect(typeof ref.current.focusLeftButton).toBe('function');
    // Calling focusLeftButton should not throw
    expect(() => {
      if (ref.current) ref.current.focusLeftButton();
    }).not.toThrow();
  });

  it('preserves focusLeftButton callback identity across re-renders', () => {
    const ref = React.createRef<TwoStatesButtonInterface>();
    const component = renderer.create(
      <TwoStatesButton
        leftButton={leftButton}
        rightButton={rightButton}
        value="left"
        onChange={jest.fn()}
        ref={ref}
      />
    );

    if (!ref.current) throw new Error('ref is null');
    const initialFocusFn = ref.current.focusLeftButton;
    expect(initialFocusFn).toBeDefined();

    component.update(
      <TwoStatesButton
        leftButton={leftButton}
        rightButton={rightButton}
        value="right"
        onChange={jest.fn()}
        ref={ref}
      />
    );

    expect(ref.current).toBeDefined();
    if (!ref.current) throw new Error('ref is null');
    expect(ref.current.focusLeftButton).toBe(initialFocusFn);
  });
});
