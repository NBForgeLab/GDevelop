import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import { EmptyPlaceholder } from './EmptyPlaceholder';
import RaisedButton from './RaisedButton';
import FlatButton from './FlatButton';
import RaisedButtonWithSplitMenu from './RaisedButtonWithSplitMenu';
import TutorialButton from './TutorialButton';
import CircularProgress from './CircularProgress';
import HelpButton from './HelpButton';

describe('EmptyPlaceholder', () => {
  it('renders title, description and primary action button', () => {
    const onAction = jest.fn();
    const component = renderer.create(
      <EmptyPlaceholder
        title="No items found"
        description="Try creating a new item to get started."
        actionLabel="Create Item"
        onAction={onAction}
      />
    );

    const button = component.root.findByType(RaisedButton);
    expect(button.props.label).toBe('Create Item');

    act(() => {
      button.props.onClick();
    });
    expect(onAction).toHaveBeenCalledTimes(1);
  });

  it('renders secondary action button and handles clicks', () => {
    const onAction = jest.fn();
    const onSecondaryAction = jest.fn();
    const component = renderer.create(
      <EmptyPlaceholder
        title="No items"
        description="Add an item"
        actionLabel="Primary Action"
        onAction={onAction}
        secondaryActionLabel="Secondary Action"
        onSecondaryAction={onSecondaryAction}
      />
    );

    const flatButton = component.root.findByType(FlatButton);
    expect(flatButton.props.label).toBe('Secondary Action');

    act(() => {
      flatButton.props.onClick();
    });
    expect(onSecondaryAction).toHaveBeenCalledTimes(1);
  });

  it('renders split menu button when actionBuildSplitMenuTemplate is provided', () => {
    const onAction = jest.fn();
    const buildMenu = jest.fn(() => []);
    const component = renderer.create(
      <EmptyPlaceholder
        title="No behaviors"
        description="Add a behavior"
        actionLabel="Add behavior"
        onAction={onAction}
        actionBuildSplitMenuTemplate={buildMenu}
      />
    );

    const splitButton = component.root.findByType(RaisedButtonWithSplitMenu);
    expect(splitButton.props.label).toBe('Add behavior');
    expect(splitButton.props.buildMenuTemplate).toBe(buildMenu);
  });

  it('renders tutorial button when tutorialId is provided', () => {
    const component = renderer.create(
      <EmptyPlaceholder
        title="Explore"
        description="Learn more"
        actionLabel="Start"
        onAction={jest.fn()}
        tutorialId="tutorial-123"
      />
    );

    const tutorial = component.root.findByType(TutorialButton);
    expect(tutorial.props.tutorialId).toBe('tutorial-123');
  });

  it('renders help button when no tutorialId but helpPagePath is provided', () => {
    const component = renderer.create(
      <EmptyPlaceholder
        title="Documentation"
        description="Read docs"
        actionLabel="Action"
        onAction={jest.fn()}
        helpPagePath="/docs/path"
        helpPageAnchor="anchor"
      />
    );

    const help = component.root.findByType(HelpButton);
    expect(help.props.helpPagePath).toBe('/docs/path');
    expect(help.props.anchor).toBe('anchor');
  });

  it('disables buttons and shows CircularProgress when isLoading is true', () => {
    const component = renderer.create(
      <EmptyPlaceholder
        title="Loading"
        description="Please wait"
        actionLabel="Loading Action"
        onAction={jest.fn()}
        secondaryActionLabel="Cancel"
        onSecondaryAction={jest.fn()}
        isLoading={true}
      />
    );

    const raised = component.root.findByType(RaisedButton);
    expect(raised.props.disabled).toBe(true);

    const flat = component.root.findByType(FlatButton);
    expect(flat.props.disabled).toBe(true);

    const progress = component.root.findByType(CircularProgress);
    expect(progress.props.size).toBe(24);
  });

  it('renders custom actionIcon and actionButtonId', () => {
    const CustomIcon = <span id="custom-action-icon" />;
    const component = renderer.create(
      <EmptyPlaceholder
        title="Custom Icon"
        description="Testing custom icon"
        actionLabel="Custom Action"
        onAction={jest.fn()}
        actionIcon={CustomIcon}
        actionButtonId="custom-action-btn"
      />
    );

    const raised = component.root.findByType(RaisedButton);
    expect(raised.props.icon).toBe(CustomIcon);
    expect(raised.props.id).toBe('custom-action-btn');
  });

  it('renders custom secondaryActionIcon on FlatButton', () => {
    const CustomSecIcon = <span id="custom-sec-icon" />;
    const component = renderer.create(
      <EmptyPlaceholder
        title="Secondary Icon"
        description="Testing secondary icon"
        actionLabel="Action"
        onAction={jest.fn()}
        secondaryActionLabel="Back"
        secondaryActionIcon={CustomSecIcon}
        onSecondaryAction={jest.fn()}
      />
    );

    const flat = component.root.findByType(FlatButton);
    expect(flat.props.leftIcon).toBe(CustomSecIcon);
  });

  it('passes renderIfNotFound with help link to TutorialButton', () => {
    const component = renderer.create(
      <EmptyPlaceholder
        title="Tutorial & Docs"
        description="Both provided"
        actionLabel="Start"
        onAction={jest.fn()}
        tutorialId="tutorial-456"
        helpPagePath="/docs/fallback"
        helpPageAnchor="heading"
      />
    );

    const tutorial = component.root.findByType(TutorialButton);
    expect(tutorial.props.tutorialId).toBe('tutorial-456');

    const fallbackComponent = renderer.create(tutorial.props.renderIfNotFound);
    const help = fallbackComponent.root.findByType(HelpButton);
    expect(help.props.helpPagePath).toBe('/docs/fallback');
    expect(help.props.anchor).toBe('heading');
  });
});
