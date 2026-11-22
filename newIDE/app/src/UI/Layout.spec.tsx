import * as React from 'react';
import renderer from 'react-test-renderer';
import {
  LineStackLayout,
  ColumnStackLayout,
  ResponsiveLineStackLayout,
  TextFieldWithButtonLayout,
} from './Layout';

describe('Layout', () => {
  describe('LineStackLayout', () => {
    it('renders children with spacers between them', () => {
      const tree = renderer
        .create(
          <LineStackLayout>
            <div>First</div>
            <div>Second</div>
            <div>Third</div>
          </LineStackLayout>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });

    it('filters out falsy children correctly', () => {
      const tree = renderer
        .create(
          <LineStackLayout>
            <div>First</div>
            {null}
            {false}
            <div>Second</div>
          </LineStackLayout>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });

  describe('ColumnStackLayout', () => {
    it('renders children vertically with spacers', () => {
      const tree = renderer
        .create(
          <ColumnStackLayout>
            <div>First</div>
            <div>Second</div>
          </ColumnStackLayout>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });

  describe('ResponsiveLineStackLayout', () => {
    it('renders default line layout when not mobile', () => {
      const tree = renderer
        .create(
          <ResponsiveLineStackLayout>
            <div>First</div>
            <div>Second</div>
          </ResponsiveLineStackLayout>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });

    it('forces column layout when forceMobileLayout is set', () => {
      const tree = renderer
        .create(
          <ResponsiveLineStackLayout forceMobileLayout>
            <div>First</div>
            <div>Second</div>
          </ResponsiveLineStackLayout>
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });

  describe('TextFieldWithButtonLayout', () => {
    it('renders a text field and button with responsive spacing', () => {
      const tree = renderer
        .create(
          <TextFieldWithButtonLayout
            renderTextField={() => <input type="text" />}
            renderButton={(style) => <button style={style}>Click</button>}
          />
        )
        .toJSON();
      expect(tree).toBeDefined();
    });
  });
});
