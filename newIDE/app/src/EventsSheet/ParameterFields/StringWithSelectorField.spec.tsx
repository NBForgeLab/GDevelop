import * as React from 'react';
import { act } from 'react-dom/test-utils';
import renderer from 'react-test-renderer';
import StringWithSelectorField, {
  getSelectedChoice,
  type StringWithSelectorFieldProps,
} from './StringWithSelectorField';
import { makeTestProject } from '../../fixtures/TestProject';

const gd: libGDevelop = global.gd;

jest.mock('./GenericExpressionField', () => ({
  __esModule: true,
  default: () => null,
}));
jest.mock('../../UI/SelectField', () => {
  const React = require('react');
  return {
    __esModule: true,
    default: React.forwardRef(() => null),
  };
});

let cachedDefaultProps: Omit<
  StringWithSelectorFieldProps,
  'value' | 'onChange'
> | null = null;

const getDefaultFieldProps = (): Omit<
  StringWithSelectorFieldProps,
  'value' | 'onChange'
> => {
  if (!cachedDefaultProps) {
    const {
      project,
      emptyObjectsContainer,
      emptySceneProjectScopedContainersAccessor,
    } = makeTestProject(gd);
    cachedDefaultProps = {
      project,
      scope: { project },
      globalObjectsContainer: emptyObjectsContainer,
      objectsContainer: emptyObjectsContainer,
      projectScopedContainersAccessor:
        emptySceneProjectScopedContainersAccessor,
    };
  }
  return cachedDefaultProps;
};

const renderEmptyField = (
  onChange: (arg0: string) => void,
  extraProps: Partial<StringWithSelectorFieldProps> = {}
) => {
  act(() => {
    renderer.create(
      <StringWithSelectorField
        {...getDefaultFieldProps()}
        value=""
        onChange={onChange}
        choices={['PopupOpen', 'linear']}
        {...extraProps}
      />
    );
  });
};

describe('StringWithSelectorField', () => {
  it('sets an empty value to the first choice', () => {
    const onChange: (arg0: string) => void = jest.fn();
    renderEmptyField(onChange);
    expect(onChange).toHaveBeenCalledWith('"PopupOpen"');
  });

  it('sets an empty value to the default choice when given', () => {
    const onChange: (arg0: string) => void = jest.fn();
    renderEmptyField(onChange, { defaultChoice: 'linear' });
    expect(onChange).toHaveBeenCalledWith('"linear"');
  });
});

describe('getSelectedChoice', () => {
  it('finds the choice matching a quoted value', () => {
    expect(getSelectedChoice('"linear"', ['linear', 'easeInQuad'])).toBe(
      'linear'
    );
    expect(getSelectedChoice('linear', ['linear', 'easeInQuad'])).toBe(null);
  });

  it('keeps a custom cubic-bezier literal that was added to the choices', () => {
    expect(
      getSelectedChoice('"cubic-bezier(.91,.17,.08,.88)"', [
        'linear',
        'cubic-bezier(.91,.17,.08,.88)',
      ])
    ).toBe('cubic-bezier(.91,.17,.08,.88)');
  });
});
