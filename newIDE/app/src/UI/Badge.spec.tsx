import * as React from 'react';
import renderer from 'react-test-renderer';
import Badge from './Badge';
import MuiBadge from '@material-ui/core/Badge';

describe('Badge', () => {
  it('renders children with badge content', () => {
    const component = renderer.create(
      <Badge badgeContent={4} color="primary">
        <span>Inbox</span>
      </Badge>
    );

    const muiBadge = component.root.findByType(MuiBadge);
    expect(muiBadge.props.badgeContent).toBe(4);
    expect(muiBadge.props.color).toBe('primary');
    expect(component.root.findByProps({ children: 'Inbox' })).toBeDefined();
  });

  it('renders dot variant', () => {
    const component = renderer.create(
      <Badge variant="dot" color="secondary">
        <span>Notifications</span>
      </Badge>
    );

    const muiBadge = component.root.findByType(MuiBadge);
    expect(muiBadge.props.variant).toBe('dot');
  });

  it('applies custom forcedColor style', () => {
    const component = renderer.create(
      <Badge forcedColor="#ff5722">
        <span>Custom</span>
      </Badge>
    );

    const muiBadge = component.root.findByType(MuiBadge);
    expect(muiBadge.props.classes).toBeDefined();
    expect(muiBadge.props.classes.badge).toBeDefined();
  });

  it('supports invisible prop', () => {
    const component = renderer.create(
      <Badge invisible badgeContent={0}>
        <span>Hidden</span>
      </Badge>
    );

    const muiBadge = component.root.findByType(MuiBadge);
    expect(muiBadge.props.invisible).toBe(true);
  });

  it('supports overlap="circle"', () => {
    const component = renderer.create(
      <Badge overlap="circle" variant="dot">
        <span>Avatar</span>
      </Badge>
    );

    const muiBadge = component.root.findByType(MuiBadge);
    expect(muiBadge.props.overlap).toBe('circle');
    expect(muiBadge.props.variant).toBe('dot');
  });

  it('supports color="error" and color="default"', () => {
    const componentError = renderer.create(
      <Badge color="error" badgeContent={99}>
        <span>Alert</span>
      </Badge>
    );
    expect(componentError.root.findByType(MuiBadge).props.color).toBe('error');

    const componentDefault = renderer.create(
      <Badge color="default" badgeContent={1}>
        <span>Item</span>
      </Badge>
    );
    expect(componentDefault.root.findByType(MuiBadge).props.color).toBe('default');
  });

  it('updates styling when forcedColor dynamically updates', () => {
    const component = renderer.create(
      <Badge forcedColor="#111111">
        <span>Dynamic</span>
      </Badge>
    );
    const initialClasses = component.root.findByType(MuiBadge).props.classes;
    expect(initialClasses.badge).toBeDefined();

    component.update(
      <Badge forcedColor="#222222">
        <span>Dynamic</span>
      </Badge>
    );
    const updatedClasses = component.root.findByType(MuiBadge).props.classes;
    expect(updatedClasses.badge).toBeDefined();
  });
});
