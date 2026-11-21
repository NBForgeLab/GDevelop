import { shortenString, toKebabCase } from './StringHelpers';

describe('StringHelpers', () => {
  describe('shortenString', () => {
    test('does not shorten strings shorter than or equal to maxLength', () => {
      expect(shortenString('', 5)).toBe('');
      expect(shortenString('abc', 5)).toBe('abc');
      expect(shortenString('hello', 5)).toBe('hello');
    });

    test('shortens strings longer than maxLength by adding ellipsis', () => {
      expect(shortenString('hello world', 5)).toBe('hello...');
      expect(shortenString('GDevelop', 1)).toBe('G...');
    });
  });

  describe('toKebabCase', () => {
    test('handles empty string', () => {
      expect(toKebabCase('')).toBe('');
    });

    test('converts camelCase to kebab-case', () => {
      expect(toKebabCase('camelCase')).toBe('camel-case');
      expect(toKebabCase('myVariableName')).toBe('my-variable-name');
    });

    test('converts PascalCase to kebab-case', () => {
      expect(toKebabCase('CustomSvgIcons')).toBe('custom-svg-icons');
    });

    test('handles spaces and underscores', () => {
      expect(toKebabCase('hello world')).toBe('hello-world');
      expect(toKebabCase('hello__world   test')).toBe('hello-world-test');
    });
  });
});
