import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import FlatButtonWithSplitMenu from './FlatButtonWithSplitMenu';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import SvgIcon from '@material-ui/core/SvgIcon';
import ElementWithMenu from './Menu/ElementWithMenu';

describe('FlatButtonWithSplitMenu', () => {
  it('renders ButtonGroup with main button and split dropdown button', () => {
    const onClick = jest.fn();
    const buildMenuTemplate = jest.fn(() => []);
    const component = renderer.create(
      <FlatButtonWithSplitMenu
        id="main-flat-split-btn"
        splitMenuButtonId="dropdown-arrow-btn"
        label="Flat Split Action"
        onClick={onClick}
        buildMenuTemplate={buildMenuTemplate}
      />
    );

    const buttonGroup = component.root.findByType(ButtonGroup);
    expect(buttonGroup.props.variant).toBe('outlined');
    expect(buttonGroup.props.color).toBe('default');
    expect(buttonGroup.props.size).toBe('small');

    const buttons = component.root.findAllByType(Button);
    expect(buttons).toHaveLength(2);

    const [mainButton, splitButton] = buttons;
    expect(mainButton.props.id).toBe('main-flat-split-btn');
    expect(splitButton.props.id).toBe('dropdown-arrow-btn');

    act(() => {
      mainButton.props.onClick();
    });
    expect(onClick).toHaveBeenCalledTimes(1);

    expect(splitButton.findByType(SvgIcon)).toBeDefined();

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    expect(elementWithMenu.props.buildMenuTemplate).toBe(buildMenuTemplate);
  });

  it('renders primary color when primary prop is true', () => {
    const component = renderer.create(
      <FlatButtonWithSplitMenu
        label="Primary"
        primary
        buildMenuTemplate={() => []}
      />
    );

    const buttonGroup = component.root.findByType(ButtonGroup);
    expect(buttonGroup.props.color).toBe('secondary');
  });

  it('renders icon with spacer when icon and label are both present', () => {
    const icon = <span id="flat-split-icon">✦</span>;
    const component = renderer.create(
      <FlatButtonWithSplitMenu
        label="With Icon"
        icon={icon}
        buildMenuTemplate={() => []}
      />
    );

    expect(component.root.findByProps({ id: 'flat-split-icon' })).toBeDefined();
  });

  it('passes disabled, fullWidth, and style to ButtonGroup', () => {
    const customStyle = { margin: 12 };
    const component = renderer.create(
      <FlatButtonWithSplitMenu
        label="Options"
        disabled
        fullWidth
        style={customStyle}
        buildMenuTemplate={() => []}
      />
    );

    const buttonGroup = component.root.findByType(ButtonGroup);
    expect(buttonGroup.props.disabled).toBe(true);
    expect(buttonGroup.props.fullWidth).toBe(true);
    expect(buttonGroup.props.style).toEqual(customStyle);
  });

  it('sets an onClick handler on the dropdown button that throws if invoked directly', () => {
    const component = renderer.create(
      <FlatButtonWithSplitMenu
        label="Test Click"
        buildMenuTemplate={() => []}
      />
    );

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    expect(() => {
      elementWithMenu.props.element.props.onClick();
    }).toThrow('This FlatButtonWithSplitMenu onClick should never be called');
  });

  it('executes buildMenuTemplate returning template items', () => {
    const clickHandler = jest.fn();
    const buildMenuTemplate = (i18n: any) => [
      { label: i18n._('Option X'), click: clickHandler },
      { label: 'Option Y' },
    ];
    const component = renderer.create(
      <FlatButtonWithSplitMenu
        label="Flat Menu"
        buildMenuTemplate={buildMenuTemplate}
      />
    );

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    const mockI18n = { _: (text: string) => `Translated: ${text}` };
    const template = elementWithMenu.props.buildMenuTemplate(mockI18n);
    expect(template).toHaveLength(2);
    expect(template[0].label).toBe('Translated: Option X');
    template[0].click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });
});
