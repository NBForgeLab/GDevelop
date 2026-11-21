import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import InlineCheckbox from './InlineCheckbox';
import Checkbox from '@material-ui/core/Checkbox';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormHelperText from '@material-ui/core/FormHelperText';
import Tooltip from '@material-ui/core/Tooltip';

describe('InlineCheckbox', () => {
  it('renders a bare checkbox without label', () => {
    const tree = renderer.create(<InlineCheckbox checked={false} />).toJSON();
    expect(tree).toBeDefined();
  });

  it('renders a checked checkbox', () => {
    const tree = renderer.create(<InlineCheckbox checked={true} />).toJSON();
    expect(tree).toBeDefined();
  });

  it('renders with label and helper text', () => {
    const component = renderer.create(
      <InlineCheckbox
        checked={true}
        label="Enable feature"
        tooltipOrHelperText="This is helper text"
      />
    );
    const formControlLabel = component.root.findByType(FormControlLabel);
    expect(formControlLabel.props.label).toBe('Enable feature');
    const helperText = component.root.findByType(FormHelperText);
    expect(helperText.props.children).toBe('This is helper text');
  });

  it('renders with tooltip when no label is provided and not disabled', () => {
    const component = renderer.create(
      <InlineCheckbox
        checked={false}
        tooltipOrHelperText="Hover tooltip text"
      />
    );
    const tooltip = component.root.findByType(Tooltip);
    expect(tooltip.props.title).toBe('Hover tooltip text');
  });

  it('triggers onCheck with event and checked state', () => {
    const onCheck = jest.fn();
    const component = renderer.create(
      <InlineCheckbox checked={false} onCheck={onCheck} />
    );
    const checkbox = component.root.findByType(Checkbox);

    act(() => {
      checkbox.props.onChange({ target: { checked: true } });
    });

    expect(onCheck).toHaveBeenCalledWith({ target: { checked: true } }, true);
  });

  it('supports small padding size', () => {
    const component = renderer.create(
      <InlineCheckbox checked={true} paddingSize="small" />
    );
    const checkbox = component.root.findByType(Checkbox);
    expect(checkbox.props.classes).toBeDefined();
  });

  it('renders indeterminate state', () => {
    const component = renderer.create(
      <InlineCheckbox checked={false} indeterminate={true} />
    );
    const checkbox = component.root.findByType(Checkbox);
    expect(checkbox.props.indeterminate).toBe(true);
  });

  it('does not render tooltip when disabled', () => {
    const component = renderer.create(
      <InlineCheckbox
        checked={false}
        disabled={true}
        tooltipOrHelperText="Disabled tooltip"
      />
    );
    expect(component.root.findAllByType(Tooltip)).toHaveLength(0);
    const checkbox = component.root.findByType(Checkbox);
    expect(checkbox.props.disabled).toBe(true);
  });

  it('passes id, name, and custom icons to Checkbox', () => {
    const CustomIcon = <span id="custom-unchecked" />;
    const CustomCheckedIcon = <span id="custom-checked" />;
    const component = renderer.create(
      <InlineCheckbox
        id="checkbox-id"
        name="checkbox-name"
        checked={true}
        uncheckedIcon={CustomIcon}
        checkedIcon={CustomCheckedIcon}
      />
    );
    const checkbox = component.root.findByType(Checkbox);
    expect(checkbox.props.id).toBe('checkbox-id');
    expect(checkbox.props.name).toBe('checkbox-name');
    expect(checkbox.props.icon).toBe(CustomIcon);
    expect(checkbox.props.checkedIcon).toBe(CustomCheckedIcon);
  });

  it('does not throw when onChange fires without onCheck handler', () => {
    const component = renderer.create(<InlineCheckbox checked={false} />);
    const checkbox = component.root.findByType(Checkbox);
    expect(checkbox.props.onChange).toBeUndefined();
  });
});
