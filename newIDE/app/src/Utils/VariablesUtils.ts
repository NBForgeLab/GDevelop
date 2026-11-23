import { mapFor } from './MapFor';
import newNameGenerator from './NewNameGenerator';
import { normalizeString } from './Search';
import { unserializeFromJSObject } from './Serializer';

const gd: libGDevelop = (global as any).gd;

// Resolve `gd.Variable` lazily at call time because `global.gd` is populated asynchronously.
const getGdVariable = () =>
  gd.Variable as typeof gd.Variable & typeof gd.Variable_Type;

export const hasChildThatContainsStringInNameOrValue = (
  variable: gdVariable,
  searchText: string
): boolean => {
  const gdVariable = getGdVariable();
  switch (variable.getType()) {
    case gdVariable.String:
      return normalizeString(variable.getString()).includes(searchText);
    case gdVariable.Number:
      return variable.getValue().toString().includes(searchText);
    case gdVariable.Array:
      return mapFor(0, variable.getChildrenCount(), (index) => {
        const childVariable = variable.getAtIndex(index);
        return hasChildThatContainsStringInNameOrValue(
          childVariable,
          searchText
        );
      }).some(Boolean);
    case gdVariable.Structure:
      return variable
        .getAllChildrenNames()
        .toJSArray()
        .map((childName) => {
          const childVariable = variable.getChild(childName);
          return (
            normalizeString(childName).includes(searchText) ||
            hasChildThatContainsStringInNameOrValue(childVariable, searchText)
          );
        })
        .some(Boolean);
    default:
      return false;
  }
};

/**
 * Merge the variables of the objects of a group into a new, caller-owned
 * variables container: the intersection of the variables of all the objects
 * of the group, with "mixed values"/"mixed types" markers when they differ
 * between objects.
 */
export const makeObjectGroupMergedVariablesContainer = (
  objectsContainersList: gdObjectsContainersList,
  objectGroup: gdObjectGroup
): gdVariablesContainer => {
  // `gd.ObjectRefactorer.mergeVariableContainers` returns a `VariablesContainer`
  // "by value", which means the same C++ instance is shared by every call (it's
  // stored in a static variable by the bindings). Keeping it in an editor is
  // unsafe: any other call (from another editor, an AI editor function, etc.)
  // would overwrite it. This helper copies the merged result into a new
  // container owned by the caller - which must call `delete` on it when done,
  // to free the C++ memory.
  const sharedMergedVariablesContainer =
    gd.ObjectRefactorer.mergeVariableContainers(
      objectsContainersList,
      objectGroup
    );
  const mergedVariablesContainer = new gd.VariablesContainer(
    sharedMergedVariablesContainer.getSourceType()
  );
  // Serialization preserves everything needed for editing and refactoring:
  // variable types and values (including the editor-only "mixed values"
  // markers) and persistent UUIDs (of the container and its variables).
  const serializedElement = new gd.SerializerElement();
  sharedMergedVariablesContainer.serializeTo(serializedElement);
  mergedVariablesContainer.unserializeFrom(serializedElement);
  serializedElement.delete();

  return mergedVariablesContainer;
};

export const insertInVariablesContainer = (
  variablesContainer: gdVariablesContainer,
  name: string,
  serializedVariable: any | null,
  index: number,
  inheritedVariablesContainer: gdVariablesContainer | null | undefined,
  variableType?: 'number' | 'string' | 'boolean' | null
): {
  name: string;
  variable: gdVariable;
} => {
  const newName = newNameGenerator(
    name,
    (name) => {
      return (
        variablesContainer.has(name) ||
        (!!inheritedVariablesContainer && inheritedVariablesContainer.has(name))
      );
    },
    serializedVariable ? 'CopyOf' : undefined
  );
  const newVariable = new gd.Variable();
  if (serializedVariable) {
    unserializeFromJSObject(newVariable, serializedVariable);
    newVariable.resetPersistentUuid();
  }
  const variable = variablesContainer.insert(newName, newVariable, index);
  if (variableType === 'number') {
    variable.setValue(0);
  } else if (variableType === 'string') {
    variable.setString('');
  } else if (variableType === 'boolean') {
    variable.setBool(false);
  }
  newVariable.delete();
  return { name: newName, variable };
};

export const insertInVariableChildrenArray = (
  targetParentVariable: gdVariable,
  serializedVariable: any,
  index: number
) => {
  const newVariable = new gd.Variable();
  unserializeFromJSObject(newVariable, serializedVariable);
  newVariable.resetPersistentUuid();
  targetParentVariable.insertAtIndex(newVariable, index);
  newVariable.delete();
};

export const insertInVariableChildren = (
  targetParentVariable: gdVariable,
  name: string,
  serializedVariable: any
): string => {
  const newName = newNameGenerator(
    name,
    (_name) => targetParentVariable.hasChild(_name),
    'CopyOf'
  );
  const newVariable = new gd.Variable();
  unserializeFromJSObject(newVariable, serializedVariable);
  newVariable.resetPersistentUuid();
  targetParentVariable.insertChild(newName, newVariable);
  newVariable.delete();
  return newName;
};

export const hasVariablesContainerSubChildren = (
  variablesContainer: gdVariablesContainer
): boolean =>
  mapFor(0, variablesContainer.count(), (index) => {
    const variable = variablesContainer.getAt(index);

    return isCollectionVariable(variable) && variable.getChildrenCount() > 0;
  }).some(Boolean);

export const isCollectionVariable = (variable: gdVariable): boolean => {
  const gdVariable = getGdVariable();
  const type = variable.getType();
  return type !== gdVariable.MixedTypes && !gdVariable.isPrimitive(type);
};
