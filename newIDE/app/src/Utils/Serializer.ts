import withTemporaryResource from './WithTemporaryResource';
const gd: libGDevelop = global.gd;

/**
 * Options that affect how a project (or any serializable) is converted to JSON.
 */
export type SerializationOptions = {
  /**
   * When true, the C++ serializer writes default values for properties that
   * would normally be omitted (e.g. `disabled: false`, `folded: false`,
   * empty `events`/`variables` arrays, etc.) and writes JSON object keys in
   * alphabetical order. This makes git diffs minimal and shift-free when
   * toggling flags or adding/removing sub-events.
   */
  canonicalEventSerialization?: boolean;
};

/**
 * Helper to run a serialization callback with the canonical mode flag
 * temporarily enabled in the gd.Serializer. Always resets the flag,
 * even if `callback` throws.
 *
 * The flag is global to the gd.Serializer (and to the C++ side), so we must
 * be careful to reset it: leaving it on would silently change the format of
 * every subsequent serialization (including ones that don't expect it).
 */
function withSerializationOptions<T>(
  options: SerializationOptions | null | undefined,
  callback: () => T
): T {
  const useCanonical = !!(options && options.canonicalEventSerialization);
  if (!useCanonical) {
    return callback();
  }

  const previous = gd.Serializer.isCanonicalMode();
  gd.Serializer.setCanonicalMode(true);
  try {
    return callback();
  } finally {
    gd.Serializer.setCanonicalMode(previous);
  }
}

function parseSerializedElement(element: gdSerializerElement): any {
  // JSON.parse + toJSON is 30% faster than gd.Serializer.toJSObject.
  const json = gd.Serializer.toJSON(element);
  try {
    return JSON.parse(json);
  } catch (error) {
    console.error(
      'Invalid JSON when serializing to JS object. toJSON should always return a valid JSON string.',
      { json, error }
    );
    throw error;
  }
}

/**
 * Tool function to save a serializable object to a JS object.
 * Most gd.* objects are "serializable", meaning they have a serializeTo
 * and unserializeFrom method.
 *
 * @param {*} serializable
 * @param {*} methodName The name of the serialization method. "serializeTo" by default
 * @param {*} options Optional serialization options (e.g. canonical mode)
 */
export function serializeToJSObject(
  serializable: gdSerializable,
  methodName: string = 'serializeTo',
  options: SerializationOptions | null | undefined = undefined
): any {
  return withSerializationOptions(options, () =>
    withTemporaryResource(new gd.SerializerElement(), (element) => {
      serializable[methodName](element);
      return parseSerializedElement(element);
    })
  );
}

export function serializeObjectWithCleanDefaultBehaviorFlags(
  object: gdObject
): any {
  return withTemporaryResource(new gd.SerializerElement(), (element) => {
    gd.BehaviorDefaultFlagClearer.serializeObjectWithCleanDefaultBehaviorFlags(
      object,
      element
    );
    return parseSerializedElement(element);
  });
}

export function serializeToObjectAsset(
  project: gdProject,
  object: gdObject,
  objectFullName: string,
  usedResourceNames: Array<string>,
  extensionDependencyCache: gdExtensionDependencyCache
): any {
  return withTemporaryResource(new gd.SerializerElement(), (element) => {
    withTemporaryResource(new gd.VectorString(), (resourceNames) => {
      gd.ObjectAssetSerializer.serializeTo(
        project,
        object,
        objectFullName,
        element,
        resourceNames,
        extensionDependencyCache
      );
      usedResourceNames.push(...resourceNames.toJSArray());
    });
    return JSON.parse(gd.Serializer.toJSON(element));
  });
}

/**
 * Tool function to save a serializable object to a JSON.
 * Most gd.* objects are "serializable", meaning they have a serializeTo
 * and unserializeFrom method.
 *
 * @param {*} serializable
 * @param {*} methodName The name of the serialization method. "unserializeFrom" by default
 * @param {*} options Optional serialization options (e.g. canonical mode)
 */
export function serializeToJSON(
  serializable: gdSerializable,
  methodName: string = 'serializeTo',
  options: SerializationOptions | null | undefined = undefined
): string {
  return withSerializationOptions(options, () =>
    withTemporaryResource(new gd.SerializerElement(), (element) => {
      serializable[methodName](element);
      return gd.Serializer.toJSON(element);
    })
  );
}

/**
 * POSIX / editor convention: text files end with a newline. Use when persisting `.json`.
 */
export function addFinalNewline(json: string): string {
  return json.endsWith('\n') ? json : json + '\n';
}

/**
 * Tool function to restore a serializable object from a JS object.
 * Most gd.* objects are "serializable", meaning they have a serializeTo
 * and unserializeFrom method.
 * @param {*} serializable A gd.* object to restore
 * @param {*} object The JS object to be used to restore the serializable.
 * @param {*} methodName The name of the unserialization method. "unserializeFrom" by default
 * @param {*} optionalProject The project to pass as argument for unserialization
 */
export function unserializeFromJSObject(
  serializable: gdSerializable,
  object: Record<string, any>,
  methodName: string = 'unserializeFrom',
  optionalProject: gdProject | null | undefined = undefined
) {
  withTemporaryResource(gd.Serializer.fromJSObject(object), (element) => {
    if (optionalProject) {
      serializable[methodName](optionalProject, element);
    } else {
      serializable[methodName](element);
    }
  });
}

export function unserializeResourceFromJSObject(
  resource: gdResource,
  object: Record<string, any>
) {
  withTemporaryResource(gd.Serializer.fromJSObject(object), (element) => {
    gd.ResourcesContainer.unserializeResourceFrom(resource, element);
  });
}
