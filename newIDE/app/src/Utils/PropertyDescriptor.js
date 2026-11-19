// @flow

export const setExtraInfoString = (
  property: gdNamedPropertyDescriptor,
  value: string
) => {
  // GetExtraInfo returns a reference owned by the property.
  const values = property.getExtraInfo();
  if (values.size() === 0) {
    values.push_back(value);
  } else {
    values.set(0, value);
    values.resize(1);
  }
};
