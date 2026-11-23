import React from 'react';

/**
 * A useState hook that returns a promise when the state is set.
 * *Don't use it* excepted for MainFrame. This is used while transitioning
 * MainFrame to hooks - and it's not typed properly.
 */
export default function useStateWithCallback<T>(
  initialValue: T | (() => T)
): [T, (newValue: T | ((prevState: T) => T)) => Promise<T>] {
  const [state, setState] = React.useState<T>(initialValue);
  const callback = React.useRef<((state: T) => void) | null>(null);

  const useStateWithCB = React.useCallback(
    (newValue: T | ((prevState: T) => T)): Promise<T> => {
      return new Promise((resolve) => {
        callback.current = resolve;
        setState(newValue);
      });
    },
    [setState]
  );

  React.useEffect(() => {
    if (callback.current !== null) {
      callback.current(state);
      callback.current = null;
    }
  }, [state]);
  return [state, useStateWithCB];
}
