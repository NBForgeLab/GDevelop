import * as React from 'react';

export const useDoNowOrAfterRender = <T>(ref: {
  current: T;
}): ((arg0: (t: T) => void) => void) => {
  const [shouldTriggerAfterRender, setShouldTriggerAfterRender] =
    React.useState<null | ((t: T) => void)>(null);

  const doNowOrAfterRender = React.useCallback(
    (callback: (t: T) => void) => {
      if (ref.current) {
        callback(ref.current);
      } else {
        setShouldTriggerAfterRender((): ((t: T) => void) => callback);
      }
    },
    [ref]
  );

  React.useEffect(() => {
    if (shouldTriggerAfterRender) {
      if (ref.current) shouldTriggerAfterRender(ref.current);
      setShouldTriggerAfterRender(null);
    }
  }, [shouldTriggerAfterRender, ref]);

  return doNowOrAfterRender;
};
