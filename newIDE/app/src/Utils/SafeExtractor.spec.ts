import { SafeExtractor } from './SafeExtractor';

describe('SafeExtractor', () => {
  describe('comma separated finite numbers', () => {
    test('parseCommaSeparatedTwoFiniteNumbers', () => {
      expect(SafeExtractor.parseCommaSeparatedTwoFiniteNumbers('1,2')).toEqual([
        1, 2,
      ]);
      expect(
        SafeExtractor.parseCommaSeparatedTwoFiniteNumbers('10,2.345')
      ).toEqual([10, 2.345]);
      expect(
        SafeExtractor.parseCommaSeparatedTwoFiniteNumbers('1,2,3')
      ).toEqual([1, 2]);
      expect(SafeExtractor.parseCommaSeparatedTwoFiniteNumbers('1,,3')).toEqual(
        null
      );
      expect(SafeExtractor.parseCommaSeparatedTwoFiniteNumbers('1,,')).toEqual(
        null
      );
      expect(SafeExtractor.parseCommaSeparatedTwoFiniteNumbers('1,')).toEqual(
        null
      );
      expect(SafeExtractor.parseCommaSeparatedTwoFiniteNumbers('1')).toEqual(
        null
      );
    });
    test('parseCommaSeparatedThreeFiniteNumbers', () => {
      expect(
        SafeExtractor.parseCommaSeparatedThreeFiniteNumbers('1,2,3')
      ).toEqual([1, 2, 3]);
      expect(
        SafeExtractor.parseCommaSeparatedThreeFiniteNumbers('10,2.345,3.456')
      ).toEqual([10, 2.345, 3.456]);
      expect(
        SafeExtractor.parseCommaSeparatedThreeFiniteNumbers('1,2,3,4')
      ).toEqual([1, 2, 3]);
      expect(
        SafeExtractor.parseCommaSeparatedThreeFiniteNumbers('1,,3')
      ).toEqual(null);
      expect(
        SafeExtractor.parseCommaSeparatedThreeFiniteNumbers('1,,')
      ).toEqual(null);
      expect(SafeExtractor.parseCommaSeparatedThreeFiniteNumbers('1,')).toEqual(
        null
      );
      expect(SafeExtractor.parseCommaSeparatedThreeFiniteNumbers('1')).toEqual(
        null
      );
    });
  });

  describe('extractStringArrayProperty', () => {
    test('returns only the string items of an array property', () => {
      expect(
        SafeExtractor.extractStringArrayProperty(
          { names: ['a', 'b', 2, null, {}, 'c'] },
          'names'
        )
      ).toEqual(['a', 'b', 'c']);
    });
    test('returns an empty array when the property is an empty array', () => {
      expect(
        SafeExtractor.extractStringArrayProperty({ names: [] }, 'names')
      ).toEqual([]);
    });
    test('returns null when the property is missing or not an array', () => {
      expect(SafeExtractor.extractStringArrayProperty({}, 'names')).toEqual(
        null
      );
      expect(
        SafeExtractor.extractStringArrayProperty({ names: 'a,b' }, 'names')
      ).toEqual(null);
      expect(SafeExtractor.extractStringArrayProperty(null, 'names')).toEqual(
        null
      );
    });
  });

  describe('individual property extractors', () => {
    test('extractNumberProperty', () => {
      expect(SafeExtractor.extractNumberProperty({ a: 42 }, 'a')).toBe(42);
      expect(SafeExtractor.extractNumberProperty({ a: '42' }, 'a')).toBeNull();
      expect(SafeExtractor.extractNumberProperty(null, 'a')).toBeNull();
    });

    test('extractStringProperty', () => {
      expect(SafeExtractor.extractStringProperty({ a: 'hello' }, 'a')).toBe(
        'hello'
      );
      expect(SafeExtractor.extractStringProperty({ a: 123 }, 'a')).toBeNull();
      expect(SafeExtractor.extractStringProperty(undefined, 'a')).toBeNull();
    });

    test('extractBooleanProperty', () => {
      expect(SafeExtractor.extractBooleanProperty({ a: true }, 'a')).toBe(true);
      expect(SafeExtractor.extractBooleanProperty({ a: false }, 'a')).toBe(
        false
      );
      expect(SafeExtractor.extractBooleanProperty({ a: 1 }, 'a')).toBeNull();
    });

    test('extractObjectProperty and extractArrayProperty', () => {
      expect(
        SafeExtractor.extractObjectProperty({ a: { nested: 1 } }, 'a')
      ).toEqual({ nested: 1 });
      expect(
        SafeExtractor.extractObjectProperty({ a: [1, 2] }, 'a')
      ).toBeNull();
      expect(SafeExtractor.extractArrayProperty({ a: [1, 2] }, 'a')).toEqual([
        1, 2,
      ]);
      expect(
        SafeExtractor.extractArrayProperty({ a: { nested: 1 } }, 'a')
      ).toBeNull();
    });

    test('extractNumberOrStringOrBooleanProperty', () => {
      expect(
        SafeExtractor.extractNumberOrStringOrBooleanProperty({ a: 42 }, 'a')
      ).toBe(42);
      expect(
        SafeExtractor.extractNumberOrStringOrBooleanProperty({ a: 'hi' }, 'a')
      ).toBe('hi');
      expect(
        SafeExtractor.extractNumberOrStringOrBooleanProperty({ a: true }, 'a')
      ).toBe(true);
      expect(
        SafeExtractor.extractNumberOrStringOrBooleanProperty({ a: {} }, 'a')
      ).toBeNull();
    });
  });
});
