/**
 * Export functions to manipulate a selection of objects.
 */

import values from 'lodash/values';

type ObjectType = {
  ptr: number;
};

export type SelectionState<T> = {
  [key: number]: T | null | undefined;
};

export const getInitialSelection = <
  T extends ObjectType = ObjectType,
>(): SelectionState<T> => ({});

export const clearSelection = <
  T extends ObjectType = ObjectType,
>(): SelectionState<T> => getInitialSelection<T>();

export const getSelection = <T extends ObjectType>(
  selection: SelectionState<T>
): Array<T> => values(selection).filter((value): value is T => !!value);

export const addToSelection = <T extends ObjectType>(
  selection: SelectionState<T>,
  object: T,
  select: boolean = true
): SelectionState<T> => {
  return {
    ...selection,
    [object.ptr]: select ? object : null,
  };
};

export const isSelected = <T extends ObjectType>(
  selection: SelectionState<T>,
  object: T
): boolean => !!selection[object.ptr];

export const hasSelection = <T extends ObjectType>(
  selection: SelectionState<T>
): boolean => {
  return !!values(selection).filter((value) => !!value).length;
};
