import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import useValueWithInit, { useRefWithInit } from './UseRefInitHook';

describe('UseRefInitHook', () => {
  it('initializes value once and preserves across renders', () => {
    let initCallCount = 0;
    const values: any[] = [];

    const TestComponent = () => {
      const val = useValueWithInit(() => {
        initCallCount++;
        return { count: initCallCount };
      });
      values.push(val);
      return null;
    };

    let component: any;
    act(() => {
      component = renderer.create(<TestComponent />);
    });

    expect(initCallCount).toBe(1);
    expect(values[0]).toEqual({ count: 1 });

    act(() => {
      component.update(<TestComponent />);
    });

    expect(initCallCount).toBe(1);
    expect(values[1]).toBe(values[0]);
  });

  it('initializes ref once and preserves ref object across renders', () => {
    let initCallCount = 0;
    const refs: any[] = [];

    const TestComponent = () => {
      const ref = useRefWithInit(() => {
        initCallCount++;
        return 'test-instance';
      });
      refs.push(ref);
      return null;
    };

    let component: any;
    act(() => {
      component = renderer.create(<TestComponent />);
    });

    expect(initCallCount).toBe(1);
    expect(refs[0].current).toBe('test-instance');

    act(() => {
      component.update(<TestComponent />);
    });

    expect(initCallCount).toBe(1);
    expect(refs[1]).toBe(refs[0]);
  });
});
