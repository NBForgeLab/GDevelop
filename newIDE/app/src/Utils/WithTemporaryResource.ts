// An interface (rather than an object type) is required so that instances of
// libGD.js classes (which declare `delete(): void` as a method) are accepted.
interface Deletable {
  delete(): void;
}

// Only pass wrappers owned exclusively by this synchronous operation.
export default function withTemporaryResource<
  Resource extends Deletable,
  Result,
>(resource: Resource, callback: (resource: Resource) => Result): Result {
  try {
    return callback(resource);
  } finally {
    resource.delete();
  }
}
