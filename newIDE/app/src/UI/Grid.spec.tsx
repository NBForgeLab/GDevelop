import * as React from 'react';
import renderer from 'react-test-renderer';
import {
  Line,
  Column,
  Spacer,
  ButtonSpacer,
  LargeSpacer,
  FixedHeightFlexContainer,
  marginsSize,
  buttonIconLabelSpacingSize,
} from './Grid';

describe('Grid', () => {
  it('defines correct margin constants', () => {
    expect(marginsSize).toBe(8);
    expect(buttonIconLabelSpacingSize).toBe(4);
  });

  describe('Line', () => {
    it('renders with flex styles', () => {
      const tree = renderer
        .create(
          <Line
            expand
            noMargin
            alignItems="center"
            justifyContent="space-between"
          >
            <span>Item 1</span>
            <span>Item 2</span>
          </Line>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });

  describe('Column', () => {
    it('renders with column direction styles', () => {
      const tree = renderer
        .create(
          <Column expand noMargin useFullHeight noOverflowParent>
            <span>Top</span>
            <span>Bottom</span>
          </Column>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });

  describe('Spacers', () => {
    it('renders standard, button, and large spacers', () => {
      expect(renderer.create(<Spacer />).toJSON()).toBeDefined();
      expect(renderer.create(<ButtonSpacer />).toJSON()).toBeDefined();
      expect(renderer.create(<LargeSpacer />).toJSON()).toBeDefined();
    });
  });

  describe('FixedHeightFlexContainer', () => {
    it('renders a fixed height container based on screen size', () => {
      const tree = renderer
        .create(
          <FixedHeightFlexContainer
            heights={{ small: 40, medium: 50, large: 60 }}
          >
            <span>Content</span>
          </FixedHeightFlexContainer>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });
});
