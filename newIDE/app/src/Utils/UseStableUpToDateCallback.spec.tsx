import * as React from 'react';
import renderer, { act } from 'react-test-renderer';
import {
  useStableUpToDateCallback,
  useStableUpToDateRef,
} from './UseStableUpToDateCallback';

describe('UseStableUpToDateCallback', () => {
  it('keeps function identity stable while calling the latest implementation', () => {
    const callbacks: any[] = [];
    let state = 'initial';

    const TestComponent = ({ currentState }: { currentState: string }) => {
      const fn = useStableUpToDateCallback(() => currentState);
      callbacks.push(fn);
      return null;
    };

    let component: any;
    act(() => {
      component = renderer.create(<TestComponent currentState={state} />);
    });

    expect(callbacks[0]()).toBe('initial');

    state = 'updated';
    act(() => {
      component.update(<TestComponent currentState={state} />);
    });

    expect(callbacks[1]).toBe(callbacks[0]);
    expect(callbacks[0]()).toBe('updated');
  });

  it('keeps ref identity stable while updating current value', () => {
    const refs: any[] = [];

    const TestComponent = ({ value }: { value: number }) => {
      const ref = useStableUpToDateRef(value);
      refs.push(ref);
      return null;
    };

    let component: any;
    act(() => {
      component = renderer.create(<TestComponent value={10} />);
    });

    expect(refs[0].current).toBe(10);

    act(() => {
      component.update(<TestComponent value={20} />);
    });

    expect(refs[1]).toBe(refs[0]);
    expect(refs[0].current).toBe(20);
  });
});
