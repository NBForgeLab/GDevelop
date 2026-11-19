import { exceptionallyGuardAgainstDeadObject } from './IsNullPtr';
import { sendErrorMessage } from './Analytics/EventSender';

jest.mock('./Analytics/EventSender', () => ({ sendErrorMessage: jest.fn() }));

it('reports each guarded dead wrapper once and leaves live objects alone', async () => {
  const first = new global.gd.Variable();
  const second = new global.gd.Variable();
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
    await new Promise(resolve => setTimeout(resolve, 0));
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
