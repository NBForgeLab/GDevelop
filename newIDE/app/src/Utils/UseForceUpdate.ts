import * as React from 'react';

// https://reactjs.org/docs/hooks-faq.html#is-there-something-like-forceupdate
export default function useForceUpdate(): () => void {
  const [, updateState] = React.useState<object | undefined>();
  const forceUpdate = React.useCallback(() => updateState({}), []);

  return forceUpdate;
}

export function useForceRecompute(): [object, () => void] {
  const [recomputeTrigger, updateState] = React.useState<object>({});
  const forceRecompute = React.useCallback(() => updateState({}), []);

  return [recomputeTrigger, forceRecompute];
}
