import memoize from './Memoize';

describe('memoize', () => {
  it('caches results for primitive inputs', () => {
    const compute = jest.fn((value: string) => `computed:${value}`);
    const memoized = memoize(compute);

    expect(memoized('a')).toBe('computed:a');
    expect(memoized('a')).toBe('computed:a');
    expect(memoized('b')).toBe('computed:b');
    expect(memoized('b')).toBe('computed:b');
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('caches results for object inputs by reference', () => {
    const compute = jest.fn((obj: { id: number }) => ({ wrapped: obj.id }));
    const memoized = memoize(compute);

    const firstObj = { id: 1 };
    const secondObjWithSameShape = { id: 1 };

    const firstResult = memoized(firstObj);
    expect(memoized(firstObj)).toBe(firstResult);
    expect(compute).toHaveBeenCalledTimes(1);

    const secondResult = memoized(secondObjWithSameShape);
    expect(secondResult).not.toBe(firstResult);
    expect(secondResult).toEqual({ wrapped: 1 });
    expect(memoized(secondObjWithSameShape)).toBe(secondResult);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('handles null and undefined inputs safely without WeakMap errors', () => {
    const compute = jest.fn((value: string | null | undefined) =>
      value === null
        ? 'was-null'
        : value === undefined
          ? 'was-undefined'
          : value
    );
    const memoized = memoize(compute);

    expect(memoized(null)).toBe('was-null');
    expect(memoized(null)).toBe('was-null');
    expect(memoized(undefined)).toBe('was-undefined');
    expect(memoized(undefined)).toBe('was-undefined');
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('caches results for function inputs by reference', () => {
    const compute = jest.fn((fn: () => number) => fn() + 1);
    const memoized = memoize(compute);

    const fnA = () => 10;
    const fnB = () => 10;

    expect(memoized(fnA)).toBe(11);
    expect(memoized(fnA)).toBe(11);
    expect(memoized(fnB)).toBe(11);
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('keeps distinct caches per memoized instance', () => {
    const firstCompute = jest.fn((n: number) => n * 2);
    const secondCompute = jest.fn((n: number) => n * 3);

    const firstMemoized = memoize(firstCompute);
    const secondMemoized = memoize(secondCompute);

    expect(firstMemoized(4)).toBe(8);
    expect(secondMemoized(4)).toBe(12);
    expect(firstMemoized(4)).toBe(8);
    expect(secondMemoized(4)).toBe(12);
    expect(firstCompute).toHaveBeenCalledTimes(1);
    expect(secondCompute).toHaveBeenCalledTimes(1);
  });
});
