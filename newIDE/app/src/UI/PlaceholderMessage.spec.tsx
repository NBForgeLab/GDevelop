import * as React from 'react';
import renderer from 'react-test-renderer';
import PlaceholderMessage from './PlaceholderMessage';
import Paper from './Paper';

describe('PlaceholderMessage', () => {
  it('renders children inside Paper with dark background', () => {
    const component = renderer.create(
      <PlaceholderMessage>
        <span>Message content</span>
      </PlaceholderMessage>
    );

    const paper = component.root.findByType(Paper);
    expect(paper.props.background).toBe('dark');
    expect(paper.props.elevation).toBe(3);
    expect(
      component.root.findByProps({ children: 'Message content' })
    ).toBeDefined();
  });

  it('renders with zIndex when showOnTop is true', () => {
    const component = renderer.create(
      <PlaceholderMessage showOnTop>
        <span>On top content</span>
      </PlaceholderMessage>
    );

    const rootDiv = component.toJSON() as any;
    expect(rootDiv.props.style.zIndex).toBe(9999);
  });

  it('does not set zIndex when showOnTop is false or omitted', () => {
    const component = renderer.create(
      <PlaceholderMessage>
        <span>Standard content</span>
      </PlaceholderMessage>
    );

    const rootDiv = component.toJSON() as any;
    expect(rootDiv.props.style.zIndex).toBeUndefined();
  });

  it('attaches data attributes via HTMLDataset', () => {
    const component = renderer.create(
      <PlaceholderMessage
        data={{ testId: 'error-placeholder', active: 'true' }}
      >
        <span>With dataset</span>
      </PlaceholderMessage>
    );

    const rootDiv = component.toJSON() as any;
    expect(rootDiv.props['data-test-id']).toBe('error-placeholder');
    expect(rootDiv.props['data-active']).toBe('true');
  });
});
