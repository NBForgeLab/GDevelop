// @flow

// Only pass wrappers owned exclusively by this synchronous operation.
export default function withTemporaryResource<
  Resource: { delete: () => void, ... },
  Result
>(resource: Resource, callback: Resource => Result): Result {
  try {
    return callback(resource);
  } finally {
    resource.delete();
  }
}
