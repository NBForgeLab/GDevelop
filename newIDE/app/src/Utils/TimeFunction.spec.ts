import { timeFunction } from './TimeFunction';

describe('TimeFunction', () => {
  it('calls the function and reports elapsed time', () => {
    let called = false;
    let reportedDuration = -1;

    timeFunction(
      () => {
        called = true;
      },
      (duration) => {
        reportedDuration = duration;
      }
    );

    expect(called).toBe(true);
    expect(reportedDuration).toBeGreaterThanOrEqual(0);
  });
});
