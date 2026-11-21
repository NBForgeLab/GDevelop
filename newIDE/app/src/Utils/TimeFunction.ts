export const timeFunction = (
  fn: () => void,
  onResult: (duration: number) => void
): void => {
  const t0 = performance.now();
  fn();
  const t1 = performance.now();
  onResult(t1 - t0);
};
