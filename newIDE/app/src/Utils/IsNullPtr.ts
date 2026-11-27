const reportedDeadWrappers = new WeakSet<object>();

const getGdInstance = (): libGDevelop | undefined =>
  (typeof gd !== 'undefined' ? gd : undefined) ||
  (typeof globalThis !== 'undefined' ? (globalThis as any).gd : undefined) ||
  (typeof global !== 'undefined' ? global.gd : undefined);

/**
 * Check if the Emscripten object is actually a null pointer.
 *
 * You should normally not use this - instead prefer the null/empty object pattern,
 * with a function `IsBadXxx` to check if the object you're manipulating represents
 * an null/empty object.
 */
export const isNullPtr = (
  gd: libGDevelop,
  object: gdEmscriptenObject
): boolean => gd.getPointer(object as any) === 0;

/**
 * Guard against dead (destroyed) C++/WebIDL wrapper objects.
 *
 * In theory, a dead object should never be accessed, but this can help
 * prevent stale references to objects (deleted by JS: ptr will be 0,
 * or deleted in C++, only for tracked classes).
 * This is used just to add extra protection and should usually not be useful.
 *
 * - If the object is null/undefined, returns null.
 * - If the object is dead (detected via gd.assertObjectAlive), returns null
 *   and logs a warning with the exception.
 * - Otherwise returns the object as-is.
 */
export const exceptionallyGuardAgainstDeadObject = <T>(
  obj: T | null | undefined
): T | null => {
  if (!obj) return null;

  try {
    const gdInstance = getGdInstance();
    if (gdInstance && typeof gdInstance.assertObjectAlive === 'function') {
      gdInstance.assertObjectAlive(obj as any);
    }
  } catch (exception) {
    if ((exception as any)?.name === 'UseAfterFreeError') {
      if (typeof obj === 'object' && !reportedDeadWrappers.has(obj)) {
        reportedDeadWrappers.add(obj);
        // Do not retain native wrappers or send their contents with the event.
        import('./Analytics/EventSender')
          .then(({ sendErrorMessage }) =>
            sendErrorMessage(
              'Editor skipped a destroyed object',
              'error',
              { errorName: 'UseAfterFreeError' },
              'guarded-use-after-free'
            )
          )
          .catch((error) =>
            console.warn('Could not report a destroyed object', error)
          );
      }
      console.warn(
        'Detected a dead object being accessed - returning null instead.',
        exception
      );
      return null;
    }

    throw exception;
  }

  return obj;
};
