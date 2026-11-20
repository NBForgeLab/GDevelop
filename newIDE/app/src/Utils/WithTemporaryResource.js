// @flow

// An interface (rather than an object type) is required so that instances of
// libGD.js classes (which declare `delete(): void` as a method) are accepted.
interface Deletable {
  delete(): void;
}

// Only pass wrappers owned exclusively by this synchronous operation.
export default function withTemporaryResource<Resource: Deletable, Result>(
  resource: Resource,
  callback: Resource => Result
): Result {
  try {
    return callback(resource);
  } finally {
    resource.delete();
  }
}
