import * as React from 'react';

/**
 * Wrap a callback into a function that will always be stable across render,
 * and will always call the latest version of the callback. This avoid the issue
 * of calling a stale callback function after some asynchronous work (i.e: after a `await`,
 * a component could risk calling a stale callback, but not with this hook).
 */
export function useStableUpToDateCallback<T extends (...args: any[]) => any>(
  callback: T
): T {
  const callbackRef = React.useRef<T>(callback);

  // Whenever the callback changes, store the latest version in a ref.
  React.useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // This function will never change, but will always call the latest
  // callback that was created in a render, so it's fine to call it even
  // from an asynchronous function.
  const stableCallback = React.useCallback((...args: any[]) => {
    return callbackRef.current(...args);
  }, []) as T;

  return stableCallback;
}

/**
 * Wrap an object, possibly from useState, in a ref that contains always
 * the latest version of the object (i.e: the object at the latest render).
 */
export function useStableUpToDateRef<ObjectType>(
  object: ObjectType
): React.MutableRefObject<ObjectType> {
  const objectRef = React.useRef<ObjectType>(object);
  React.useEffect(() => {
    objectRef.current = object;
  }, [object]);

  return objectRef;
}
