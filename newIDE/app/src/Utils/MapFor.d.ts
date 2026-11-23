export declare const mapFor: <T>(
  start: number,
  end: number,
  func: (i: number) => T
) => Array<T>;

export declare const mapReverseFor: <T>(
  start: number,
  end: number,
  func: (i: number) => T
) => Array<T>;

export declare const mapVector: <T, U>(
  cppVector: { size(): number; at(i: number): T },
  func: (item: T, i: number) => U
) => Array<U>;
