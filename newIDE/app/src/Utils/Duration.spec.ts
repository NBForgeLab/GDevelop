import { formatDuration } from './Duration';

describe('Duration', () => {
  describe('formatDuration', () => {
    test('formats duration under 1 hour', () => {
      expect(formatDuration(0)).toBe('0:00');
      expect(formatDuration(5)).toBe('0:05');
      expect(formatDuration(65)).toBe('1:05');
      expect(formatDuration(599)).toBe('9:59');
      expect(formatDuration(3599)).toBe('59:59');
    });

    test('formats duration over 1 hour', () => {
      expect(formatDuration(3600)).toBe('1:00:00');
      expect(formatDuration(3665)).toBe('1:01:05');
      expect(formatDuration(7200)).toBe('2:00:00');
    });

    test('handles noNullDuration option', () => {
      expect(formatDuration(0.4, { noNullDuration: true })).toBe('0:01');
      expect(formatDuration(0.4, { noNullDuration: false })).toBe('0:00');
    });
  });
});
