// Note: this file uses CommonJS syntax and JSDoc annotations so it can be used from both the IDE and Node.js (types are in MapFor.d.ts).

/**
 * @template T
 * @param {number} start
 * @param {number} end
 * @param {(i: number) => T} func
 * @returns {Array<T>}
 */
const mapFor = (start, end, func) => {
  const result = [];
  for (let i = start; i < end; i++) {
    result.push(func(i));
  }
  return result;
};

/**
 * @template T
 * @param {number} start
 * @param {number} end
 * @param {(i: number) => T} func
 * @returns {Array<T>}
 */
const mapReverseFor = (start, end, func) => {
  const result = [];
  for (let i = end - 1; i >= start; i--) {
    result.push(func(i));
  }
  return result;
};

/**
 * @template T
 * @typedef {{size: () => number, at: (i: number) => T}} CppVector
 */

/**
 * @template T, U
 * @param {CppVector<T>} cppVector
 * @param {(item: T, i: number) => U} func
 * @returns {Array<U>}
 */
const mapVector = (cppVector, func) => {
  return mapFor(0, cppVector.size(), (i) => func(cppVector.at(i), i));
};

module.exports = {
  mapFor,
  mapReverseFor,
  mapVector,
};
