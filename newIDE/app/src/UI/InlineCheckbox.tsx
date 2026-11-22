import * as React from 'react';
import { makeStyles } from '@material-ui/core/styles';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormGroup from '@material-ui/core/FormGroup';
import FormHelperText from '@material-ui/core/FormHelperText';
import Checkbox from '@material-ui/core/Checkbox';
import Tooltip from '@material-ui/core/Tooltip';

const useLabelStyles = makeStyles({
  root: {
    cursor: 'default',
  },
});

const useFormGroupStyles = makeStyles({
  root: {
    display: 'block',
  },
});

const useSmallPaddingCheckboxStyles = makeStyles({
  root: {
    padding: 3,
  },
});

export interface InlineCheckboxProps {
  id?: string;
  name?: string;
  label?: React.ReactNode;
  checked: boolean;
  indeterminate?: boolean;
  onCheck?: (
    e: React.ChangeEvent<HTMLInputElement> | any,
    checked: boolean
  ) => void | Promise<void>;
  checkedIcon?: React.ReactNode;
  uncheckedIcon?: React.ReactNode;
  disabled?: boolean;
  paddingSize?: 'small';
  tooltipOrHelperText?: React.ReactNode;
}

/**
 * A checkbox based on Material-UI Checkbox, but that can be displayed
 * without having it taking the full width of its container.
 */
const InlineCheckbox: React.FC<InlineCheckboxProps> = ({
  id,
  name,
  onCheck,
  disabled,
  checked,
  indeterminate,
  label,
  uncheckedIcon,
  checkedIcon,
  tooltipOrHelperText,
  paddingSize,
}: InlineCheckboxProps) => {
  const labelClasses = useLabelStyles();
  const formGroupClasses = useFormGroupStyles();
  const smallPaddingClasses = useSmallPaddingCheckboxStyles();
  const checkbox = (
    <Checkbox
      id={id}
      disabled={disabled}
      checked={checked}
      indeterminate={indeterminate}
      onChange={
        onCheck ? (event) => onCheck(event, event.target.checked) : undefined
      }
      classes={paddingSize === 'small' ? smallPaddingClasses : undefined}
      icon={uncheckedIcon}
      checkedIcon={checkedIcon}
      color="secondary"
      name={name}
    />
  );
  return label ? (
    <FormGroup classes={formGroupClasses}>
      <FormControlLabel
        control={checkbox}
        label={label}
        classes={labelClasses}
      />
      {tooltipOrHelperText && (
        <FormHelperText>{tooltipOrHelperText}</FormHelperText>
      )}
    </FormGroup>
  ) : tooltipOrHelperText && !disabled ? (
    <Tooltip title={tooltipOrHelperText as NonNullable<React.ReactNode>}>
      {checkbox}
    </Tooltip>
  ) : (
    checkbox
  );
};

export default InlineCheckbox;
