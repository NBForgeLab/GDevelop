import * as React from 'react';
import { t } from '@lingui/macro';
import { I18n } from '@lingui/react';
import Tooltip from '@material-ui/core/Tooltip';
import { type SvgIconProps } from '@material-ui/core/SvgIcon';

import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor';
import CompactSelectField from '../UI/CompactSelectField';
import SelectOption from '../UI/SelectOption';
import VariableStringIcon from './Icons/VariableStringIcon';
import VariableNumberIcon from './Icons/VariableNumberIcon';
import VariableBooleanIcon from './Icons/VariableBooleanIcon';
import VariableArrayIcon from './Icons/VariableArrayIcon';
import VariableStructureIcon from './Icons/VariableStructureIcon';
import VariableMixedTypesIcon from '../UI/CustomSvgIcons/Cross';
import WarningIcon from '../UI/CustomSvgIcons/Warning';
import GDevelopThemeContext from '../UI/Theme/GDevelopThemeContext';
import { tooltipEnterDelay } from '../UI/Tooltip';
import classes from './VariablesList.module.css';

const gd: libGDevelop = global.gd;

// Resolve `gd.Variable` lazily at call time because `global.gd` is populated asynchronously.
const getGdVariable = () =>
  gd.Variable as typeof gd.Variable & typeof gd.Variable_Type;

type Props = {
  variableType: Variable_Type;
  onChange: (newVariableType: string, nodeId: string) => void;
  nodeId: string;
  /**
   * If true, only the icon of the type is displayed (and clicking on it opens
   * the type selection): useful when the horizontal space is scarce.
   */
  hideTypeName?: boolean;
  readOnlyWithIcon?: boolean;
  id?: string;
  errorMessage: MessageDescriptor | null;
  disabled?: boolean;
};

let options: Array<React.ReactElement> | undefined;
let variableTypeToIcon:
  | Record<number, React.ComponentType<SvgIconProps>>
  | undefined;
let variableTypeToString: Record<string, string> | undefined;
let variableTypeToLabel: Record<number, MessageDescriptor> | undefined;

const getOptions = (variableType: Variable_Type) => {
  const gdVariable = getGdVariable();
  if (!options) {
    options = [
      <SelectOption key="string" label={t`Text`} value={gdVariable.String} />,
      <SelectOption key="number" label={t`Number`} value={gdVariable.Number} />,
      <SelectOption
        key="boolean"
        label={t`Boolean`}
        value={gdVariable.Boolean}
      />,
      <SelectOption key="array" label={t`Array`} value={gdVariable.Array} />,
      <SelectOption
        key="structure"
        label={t`Structure`}
        value={gdVariable.Structure}
      />,
    ];
  }
  // A variable with mixed types must be displayed as such, but this can't be
  // chosen: it's only the result of multiple variables being edited at once.
  return variableType === gdVariable.MixedTypes
    ? [
        <SelectOption
          key="mixed-types"
          label={t`Mixed types`}
          value={gdVariable.MixedTypes}
          disabled
        />,
        ...options,
      ]
    : options;
};

export const getVariableTypeToIcon = (): Record<
  number,
  React.ComponentType<SvgIconProps>
> => {
  if (!variableTypeToIcon) {
    const gdVariable = getGdVariable();
    variableTypeToIcon = {
      [gdVariable.MixedTypes]: VariableMixedTypesIcon,
      [gdVariable.String]: VariableStringIcon,
      [gdVariable.Number]: VariableNumberIcon,
      [gdVariable.Boolean]: VariableBooleanIcon,
      [gdVariable.Array]: VariableArrayIcon,
      [gdVariable.Structure]: VariableStructureIcon,
    };
  }
  return variableTypeToIcon;
};

const getVariableTypeToString = (): Record<string, string> => {
  if (!variableTypeToString) {
    const gdVariable = getGdVariable();
    variableTypeToString = {
      [gdVariable.String]: 'string',
      [gdVariable.Number]: 'number',
      [gdVariable.Boolean]: 'boolean',
      [gdVariable.Array]: 'array',
      [gdVariable.Structure]: 'structure',
    };
  }
  return variableTypeToString;
};

const getVariableTypeToLabel = (): Record<number, MessageDescriptor> => {
  if (!variableTypeToLabel) {
    const gdVariable = getGdVariable();
    variableTypeToLabel = {
      [gdVariable.MixedTypes]: t`Mixed types`,
      [gdVariable.String]: t`Text`,
      [gdVariable.Number]: t`Number`,
      [gdVariable.Boolean]: t`Boolean`,
      [gdVariable.Array]: t`Array`,
      [gdVariable.Structure]: t`Structure`,
    };
  }
  return variableTypeToLabel;
};

const VariableTypeSelector: React.ComponentType<Props> = React.memo<Props>(
  ({
    variableType,
    onChange,
    nodeId,
    hideTypeName,
    readOnlyWithIcon,
    id,
    errorMessage,
    disabled,
  }: Props) => {
    const gdevelopTheme = React.useContext(GDevelopThemeContext);
    const Icon = getVariableTypeToIcon()[variableType];

    const renderIcon = (className?: string) =>
      errorMessage ? (
        <WarningIcon
          className={className}
          fontSize="small"
          htmlColor={gdevelopTheme.message.warning}
        />
      ) : (
        <Icon
          className={className}
          fontSize="small"
          htmlColor={
            variableType === getGdVariable().MixedTypes
              ? gdevelopTheme.message.error
              : undefined
          }
        />
      );
    const tooltipTitle = errorMessage || getVariableTypeToLabel()[variableType];

    if (readOnlyWithIcon || (disabled && hideTypeName)) {
      return (
        <I18n>
          {({ i18n }) => (
            <Tooltip
              title={i18n._(tooltipTitle)}
              placement="bottom"
              enterDelay={tooltipEnterDelay}
            >
              <div className={classes.typeSelectorReadOnly}>
                {renderIcon()}
                {!hideTypeName && (
                  <span className={classes.typeSelectorReadOnlyLabel}>
                    {i18n._(getVariableTypeToLabel()[variableType])}
                  </span>
                )}
              </div>
            </Tooltip>
          )}
        </I18n>
      );
    }

    const onChangeType = (newVariableType: string) =>
      onChange(getVariableTypeToString()[newVariableType], nodeId);

    if (hideTypeName) {
      return (
        <I18n>
          {({ i18n }) => (
            <Tooltip
              title={i18n._(tooltipTitle)}
              placement="bottom"
              enterDelay={tooltipEnterDelay}
            >
              <div className={classes.typeSelectorIconOnly}>
                {renderIcon()}
                <select
                  id={id}
                  value={variableType.toString()}
                  onChange={(event) => onChangeType(event.currentTarget.value)}
                  aria-label={i18n._(t`Variable type`)}
                >
                  {getOptions(variableType)}
                </select>
              </div>
            </Tooltip>
          )}
        </I18n>
      );
    }

    return (
      <CompactSelectField
        value={variableType.toString()}
        onChange={onChangeType}
        id={id}
        disabled={disabled}
        errored={!!errorMessage}
        renderOptionIcon={renderIcon}
      >
        {getOptions(variableType)}
      </CompactSelectField>
    );
  }
);

export default VariableTypeSelector;
