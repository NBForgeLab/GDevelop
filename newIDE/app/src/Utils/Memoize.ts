export default function memoize<Input, Output>(
  func: (input: Input) => Output
): (input: Input) => Output {
  const primitives = new Map<Input, Output>();
  const objects = new WeakMap<object, Output>();

  return (input: Input): Output => {
    if (typeof input === 'object' && input !== null) {
      const cachedValue = objects.get(input);
      if (cachedValue) return cachedValue;

      const value = func(input);
      objects.set(input, value);
      return value;
    }

    const cachedValue = primitives.get(input);
    if (cachedValue) return cachedValue;

    const value = func(input);
    primitives.set(input, value);
    return value;
  };
}
