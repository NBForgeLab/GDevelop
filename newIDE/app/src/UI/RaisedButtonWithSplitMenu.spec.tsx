import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import RaisedButtonWithSplitMenu from './RaisedButtonWithSplitMenu';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import SvgIcon from '@material-ui/core/SvgIcon';
import ElementWithMenu from './Menu/ElementWithMenu';

describe('RaisedButtonWithSplitMenu', () => {
  it('renders ButtonGroup with main button and split dropdown button', () => {
    const onClick = jest.fn();
    const buildMenuTemplate = jest.fn(() => []);
    const component = renderer.create(
      <RaisedButtonWithSplitMenu
        id="main-split-btn"
        splitMenuButtonId="split-arrow-btn"
        label="Split Action"
        primary
        onClick={onClick}
        buildMenuTemplate={buildMenuTemplate}
      />
    );

    const buttonGroup = component.root.findByType(ButtonGroup);
    expect(buttonGroup.props.variant).toBe('contained');
    expect(buttonGroup.props.color).toBe('primary');
    expect(buttonGroup.props.size).toBe('small');

    const buttons = component.root.findAllByType(Button);
    expect(buttons).toHaveLength(2);

    const [mainButton, splitButton] = buttons;
    expect(mainButton.props.id).toBe('main-split-btn');
    expect(splitButton.props.id).toBe('split-arrow-btn');

    act(() => {
      mainButton.props.onClick();
    });
    expect(onClick).toHaveBeenCalledTimes(1);

    expect(splitButton.findByType(SvgIcon)).toBeDefined();

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    expect(elementWithMenu.props.buildMenuTemplate).toBe(buildMenuTemplate);
  });

  it('renders icon with spacer when icon and label are both present', () => {
    const icon = <span id="split-icon">✦</span>;
    const component = renderer.create(
      <RaisedButtonWithSplitMenu
        label="With Icon"
        icon={icon}
        buildMenuTemplate={() => []}
      />
    );

    expect(component.root.findByProps({ id: 'split-icon' })).toBeDefined();
  });

  it('passes disabled, fullWidth, and style to ButtonGroup', () => {
    const customStyle = { margin: 8 };
    const component = renderer.create(
      <RaisedButtonWithSplitMenu
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
      <RaisedButtonWithSplitMenu
        label="Test Click"
        buildMenuTemplate={() => []}
      />
    );

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    expect(() => {
      elementWithMenu.props.element.props.onClick();
    }).toThrow('This RaisedButtonWithSplitMenu onClick should never be called');
  });

  it('executes buildMenuTemplate returning template items', () => {
    const clickHandler = jest.fn();
    const buildMenuTemplate = (i18n: any) => [
      { label: i18n._('Option 1'), click: clickHandler },
      { label: 'Option 2' },
    ];
    const component = renderer.create(
      <RaisedButtonWithSplitMenu
        label="Menu Split"
        buildMenuTemplate={buildMenuTemplate}
      />
    );

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    const mockI18n = { _: (text: string) => `Translated: ${text}` };
    const template = elementWithMenu.props.buildMenuTemplate(mockI18n);
    expect(template).toHaveLength(2);
    expect(template[0].label).toBe('Translated: Option 1');
    template[0].click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });
});
