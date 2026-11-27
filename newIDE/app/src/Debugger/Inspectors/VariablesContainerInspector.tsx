import * as React from 'react';
import ReactJsonView from 'react-json-view';
import {
  type EditFunction,
  type CallFunction,
} from '../GDJSInspectorDescriptions';
import {
  transformVariablesContainer,
  type DebuggerVariable as Variable,
  type DebuggerVariablesContainer as VariablesContainer,
} from './DebuggerVariable';

/**
 * Returns the list of properties to access the variable at the specified path in the specified variables container.
 * Also returns the variable already living there.
 */
const constructPathToVariable = (
  editPath: Array<string>,
  variablesContainer: VariablesContainer
): {
  path: Array<string> | null | undefined;
  variable: Variable | null | undefined;
} => {
  const variableInContainerName = editPath.shift();
  if (!variableInContainerName) {
    return { path: null, variable: null };
  }
  const path: Array<string> = ['_variables', 'items', variableInContainerName];
  let variable: Variable | undefined =
    variablesContainer._variables.items[variableInContainerName];
  let skip = false;

  for (const variableName of editPath) {
    // Skip every second key as it is the "value"
    // key which is displayed only for better user
    // experience but doesn't really exists
    skip = !skip;
    if (skip) continue;

    if (!variable) return { path: null, variable: null };

    // Walk down in the children of the collection.
    if (variable._type === 'structure') {
      path.push('_children', variableName);
      variable = variable._children[variableName];
    } else if (variable._type === 'array') {
      path.push('_childrenArray', variableName);
      variable = variable._childrenArray[parseInt(variableName, 10)];
    }
    // Bad path: abort.
    else return { path: null, variable: null };
  }

  return { path, variable };
};

const handleEdit = (
  edit: any,
  { onCall, onEdit, variablesContainer }: Props
) => {
  if (!variablesContainer) return;

  // Reconstruct the variable to edit from the path
  const { path, variable } = constructPathToVariable(
    edit.namespace,
    variablesContainer
  );
  if (!path) {
    console.error('Invalid path passed to the debugger: ', edit);
    return false;
  }
  if (!variable) {
    console.error("Variable doesn't exist: ", edit);
    return false;
  }

  if (edit.name === 'type') {
    path.push('castTo');
    if (
      edit.new_value === 'string' ||
      edit.new_value === 'number' ||
      edit.new_value === 'boolean' ||
      edit.new_value === 'structure' ||
      edit.new_value === 'array'
    ) {
      if (edit.new_value !== variable._type) onCall(path, [edit.new_value]);
    } else {
      console.error('Invalid type name: ' + edit.new_value);
      return false;
    }
  } else if (edit.name === 'value') {
    // Validate data type
    if (variable._type === 'string' && typeof edit.new_value !== 'string')
      edit.new_value = '' + edit.new_value;
    else if (
      variable._type === 'number' &&
      typeof edit.new_value !== 'number'
    ) {
      edit.new_value = parseFloat(edit.new_value);
      if (isNaN(edit.new_value)) {
        console.error(`Cannot set variable of type number to NaN!`);
        return false;
      }
    } else if (
      variable._type === 'boolean' &&
      typeof edit.new_value !== 'boolean'
    )
      edit.new_value =
        typeof edit.new_value === 'string'
          ? edit.new_value.toLowerCase() !== 'false' && edit.new_value !== '0'
          : !!edit.new_value;
    else if (variable._type === 'structure' || variable._type === 'array') {
      console.error('Cannot set the value of a collection.');
      return false;
    }

    path.push('setValue');
    onCall(path, [edit.new_value]);
  }

  return true;
};

type Props = {
  variablesContainer: VariablesContainer | null | undefined;
  onCall: CallFunction;
  onEdit: EditFunction;
};

const VariablesContainerInspector = (props: Props): React.ReactNode => (
  <ReactJsonView
    collapsed={false}
    name={false}
    src={
      (props.variablesContainer &&
        transformVariablesContainer(props.variablesContainer)) ||
      {}
    }
    enableClipboard={false}
    displayDataTypes={false}
    displayObjectSize={false}
    onEdit={(edit: any) => handleEdit(edit, props)}
    groupArraysAfterLength={50}
    theme="monokai"
    validationMessage="Invalid value"
  />
);

export default VariablesContainerInspector;
