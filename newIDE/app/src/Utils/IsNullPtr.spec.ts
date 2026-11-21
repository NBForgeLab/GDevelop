import { exceptionallyGuardAgainstDeadObject } from './IsNullPtr';
import { sendErrorMessage } from './Analytics/EventSender';

jest.mock('./Analytics/EventSender', () => ({ sendErrorMessage: jest.fn() }));

it('reports each guarded dead wrapper once and leaves live objects alone', async () => {
  const first = new gd.Variable();
  const second = new gd.Variable();
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  try {
    expect(exceptionallyGuardAgainstDeadObject(first)).toBe(first);
    expect(exceptionallyGuardAgainstDeadObject(null)).toBeNull();
    expect(sendErrorMessage).not.toHaveBeenCalled();
    first.delete();
    second.delete();
    expect(exceptionallyGuardAgainstDeadObject(first)).toBeNull();
    expect(exceptionallyGuardAgainstDeadObject(first)).toBeNull();
    expect(exceptionallyGuardAgainstDeadObject(second)).toBeNull();
    await new Promise((resolve) => setTimeout(resolve, 0));
    expect(sendErrorMessage).toHaveBeenCalledTimes(2);
    expect(sendErrorMessage).toHaveBeenCalledWith(
      expect.any(String),
      'error',
      { errorName: 'UseAfterFreeError' },
      'guarded-use-after-free'
    );
  } finally {
    warn.mockRestore();
    if (first.ptr) first.delete();
    if (second.ptr) second.delete();
  }
});

it('rethrows unexpected errors from assertObjectAlive', () => {
  const variable = new gd.Variable();
  const assertSpy = jest
    .spyOn(gd, 'assertObjectAlive')
    .mockImplementationOnce(() => {
      throw new Error('Other error');
    });
  try {
    expect(() => exceptionallyGuardAgainstDeadObject(variable)).toThrow(
      'Other error'
    );
  } finally {
    assertSpy.mockRestore();
    if (variable.ptr) variable.delete();
  }
});

it('rethrows non-Error primitive exceptions from assertObjectAlive', () => {
  const variable = new gd.Variable();
  const assertSpy = jest
    .spyOn(gd, 'assertObjectAlive')
    .mockImplementationOnce(() => {
      // eslint-disable-next-line no-throw-literal
      throw 'string exception';
    });
  try {
    expect(() => exceptionallyGuardAgainstDeadObject(variable)).toThrow(
      'string exception'
    );
  } finally {
    assertSpy.mockRestore();
    if (variable.ptr) variable.delete();
  }
});

it('guards against dead objects when exception is a duck-typed UseAfterFreeError object', () => {
  const variable = new gd.Variable();
  const warn = jest.spyOn(console, 'warn').mockImplementation(() => {});
  const assertSpy = jest
    .spyOn(gd, 'assertObjectAlive')
    .mockImplementationOnce(() => {
      // eslint-disable-next-line no-throw-literal
      throw { name: 'UseAfterFreeError', message: 'wrapper destroyed' };
    });
  try {
    expect(exceptionallyGuardAgainstDeadObject(variable)).toBeNull();
  } finally {
    warn.mockRestore();
    assertSpy.mockRestore();
    if (variable.ptr) variable.delete();
  }
});
