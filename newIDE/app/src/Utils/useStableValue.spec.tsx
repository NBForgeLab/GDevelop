import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import useStableValue from './useStableValue';

describe('useStableValue', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('keeps true value stable for minimum duration before becoming false', () => {
    let latestStableValue: boolean | undefined;

    const TestComponent = ({ value }: { value: boolean }) => {
      latestStableValue = useStableValue({ value, minimumDuration: 200 });
      return null;
    };

    let component: any;
    act(() => {
      component = renderer.create(<TestComponent value={true} />);
    });
    expect(latestStableValue).toBe(true);

    // Switch to false
    act(() => {
      component.update(<TestComponent value={false} />);
    });
    // Immediately after, it should still be stable true
    expect(latestStableValue).toBe(true);

    // Advance 100ms: still true
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(latestStableValue).toBe(true);

    // Advance remaining 100ms (total 200ms): reverts to false
    act(() => {
      jest.advanceTimersByTime(100);
    });
    expect(latestStableValue).toBe(false);
  });
});
