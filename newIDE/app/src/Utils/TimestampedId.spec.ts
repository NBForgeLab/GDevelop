import { makeTimestampedId } from './TimestampedId';

describe('TimestampedId', () => {
  it('generates a string with timestamp and random suffix', () => {
    const id = makeTimestampedId();
    expect(typeof id).toBe('string');
    expect(id).toMatch(/^\d+-\d+$/);
  });

  it('generates unique ids on consecutive calls', () => {
    const id1 = makeTimestampedId();
    const id2 = makeTimestampedId();
    expect(id1).not.toBe(id2);
  });
});
