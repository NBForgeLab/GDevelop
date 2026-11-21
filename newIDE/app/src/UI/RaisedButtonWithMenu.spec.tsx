import * as React from 'react';
import renderer from 'react-test-renderer';
import RaisedButtonWithMenu from './RaisedButtonWithMenu';
import RaisedButton from './RaisedButton';
import ElementWithMenu from './Menu/ElementWithMenu';

describe('RaisedButtonWithMenu', () => {
  it('renders ElementWithMenu with wrapped RaisedButton', () => {
    const buildMenuTemplate = jest.fn(() => []);
    const component = renderer.create(
      <RaisedButtonWithMenu
        label="Menu Button"
        primary
        buildMenuTemplate={buildMenuTemplate}
      />
    );

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    expect(elementWithMenu.props.buildMenuTemplate).toBe(buildMenuTemplate);

    const raisedButton = component.root.findByType(RaisedButton);
    expect(raisedButton.props.label).toBe('Menu Button');
    expect(raisedButton.props.primary).toBe(true);
  });

  it('passes props like icon, disabled, and id to RaisedButton', () => {
    const icon = <span id="btn-icon">★</span>;
    const component = renderer.create(
      <RaisedButtonWithMenu
        label="Special Action"
        icon={icon}
        disabled
        id="action-btn"
        buildMenuTemplate={() => []}
      />
    );

    const raisedButton = component.root.findByType(RaisedButton);
    expect(raisedButton.props.icon).toBe(icon);
    expect(raisedButton.props.disabled).toBe(true);
    expect(raisedButton.props.id).toBe('action-btn');
  });

  it('sets an onClick handler on RaisedButton that throws if invoked directly', () => {
    const component = renderer.create(
      <RaisedButtonWithMenu label="Test Click" buildMenuTemplate={() => []} />
    );

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    expect(() => {
      elementWithMenu.props.element.props.onClick();
    }).toThrow('This RaisedButtonWithMenu onClick should never be called');
  });

  it('executes buildMenuTemplate returning template items', () => {
    const clickHandler = jest.fn();
    const buildMenuTemplate = (i18n: any) => [
      { label: i18n._('Option A'), click: clickHandler },
      { label: 'Option B' },
    ];
    const component = renderer.create(
      <RaisedButtonWithMenu
        label="With Menu"
        buildMenuTemplate={buildMenuTemplate}
      />
    );

    const elementWithMenu = component.root.findByType(ElementWithMenu);
    const mockI18n = { _: (text: string) => `Translated: ${text}` };
    const template = elementWithMenu.props.buildMenuTemplate(mockI18n);
    expect(template).toHaveLength(2);
    expect(template[0].label).toBe('Translated: Option A');
    template[0].click();
    expect(clickHandler).toHaveBeenCalledTimes(1);
  });
});
