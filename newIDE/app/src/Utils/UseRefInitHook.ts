import * as React from 'react';

const useValueWithInit = <T>(init: () => T): T => {
  const instanceRef = React.useRef<T | null>(null);

  const instance = instanceRef.current;
  if (instance !== null) return instance;
  // Lazily create the ref object.
  const newInstance = init();
  instanceRef.current = newInstance;
  return newInstance;
};

export default useValueWithInit;

export const useRefWithInit = <T>(init: () => T): React.MutableRefObject<T> => {
  const instanceRef = React.useRef<T | null>(null);

  const instance = instanceRef.current;
  if (instance !== null) return instanceRef as React.MutableRefObject<T>;

  // Lazily create the ref object.
  const newInstance = init();
  instanceRef.current = newInstance;
  return instanceRef as React.MutableRefObject<T>;
};
