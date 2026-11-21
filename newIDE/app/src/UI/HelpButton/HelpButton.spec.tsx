import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import HelpButton from './index';
import TextButton from '../TextButton';
import HelpIcon from '../HelpIcon';
import Window from '../../Utils/Window';
import * as ResponsiveWindowMeasurer from '../Responsive/ResponsiveWindowMeasurer';

describe('HelpButton', () => {
  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it('renders the button linking to a GDevelop documentation help page', () => {
    const tree = renderer
      .create(<HelpButton helpPagePath="/objects/tiled_sprite" />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders nothing if the helpPagePath is not a valid URL or path', () => {
    const tree = renderer
      .create(<HelpButton helpPagePath="htp://test.com" />)
      .toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('renders nothing if the helpPagePath is empty', () => {
    const tree = renderer.create(<HelpButton helpPagePath="" />).toJSON();
    expect(tree).toMatchSnapshot();
  });

  it('opens external URL when clicked in desktop view', () => {
    const openSpy = jest
      .spyOn(Window, 'openExternalURL')
      .mockImplementation(() => {});

    const component = renderer.create(
      <HelpButton helpPagePath="/interface/profile" anchor="login" />
    );
    const textButton = component.root.findByType(TextButton);

    act(() => {
      textButton.props.onClick();
    });

    expect(openSpy).toHaveBeenCalledWith(
      expect.stringContaining('/interface/profile')
    );
    expect(openSpy).toHaveBeenCalledWith(expect.stringContaining('#login'));
  });

  it('renders HelpIcon on mobile screens', () => {
    jest
      .spyOn(ResponsiveWindowMeasurer, 'useResponsiveWindowSize')
      .mockReturnValue({
        windowSize: 'small',
        isMobile: true,
        isMediumScreen: false,
        isLandscape: false,
      });

    const component = renderer.create(
      <HelpButton helpPagePath="/objects/tiled_sprite" />
    );
    const helpIcon = component.root.findByType(HelpIcon);
    expect(helpIcon.props.size).toBe('small');
    expect(helpIcon.props.helpPagePath).toBe('/objects/tiled_sprite');
  });

  it('renders custom label when provided in desktop view', () => {
    const component = renderer.create(
      <HelpButton helpPagePath="/objects/tiled_sprite" label="Documentation" />
    );
    const textButton = component.root.findByType(TextButton);
    expect(textButton.props.label).toBe('Documentation');
  });
});
