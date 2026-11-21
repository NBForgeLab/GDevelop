import { dataObjectToProps } from './HTMLDataset';

describe('HTMLDataset', () => {
  it('returns undefined when object is null or undefined', () => {
    expect(dataObjectToProps(null)).toBeUndefined();
    expect(dataObjectToProps(undefined)).toBeUndefined();
  });

  it('converts camelCase keys to data-kebab-case props', () => {
    const dataset = {
      testId: 'my-element',
      customAction: 'open',
    };
    expect(dataObjectToProps(dataset)).toEqual({
      'data-test-id': 'my-element',
      'data-custom-action': 'open',
    });
  });

  it('omits keys with null or undefined or empty values', () => {
    const dataset = {
      testId: 'my-element',
      emptyVal: '',
      nullVal: null,
      undefVal: undefined,
    };
    expect(dataObjectToProps(dataset)).toEqual({
      'data-test-id': 'my-element',
    });
  });
});
