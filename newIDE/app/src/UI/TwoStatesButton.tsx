import * as React from 'react';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import Button from '@material-ui/core/Button';
import { dataObjectToProps } from '../Utils/HTMLDataset';
import { focusButton } from './Button';
import { Spacer } from './Grid';

export interface TwoStatesButtonPart {
  icon?: React.ReactNode;
  label: React.ReactNode;
  value: string;
  id?: string;
}

export interface TwoStatesButtonProps {
  leftButton: TwoStatesButtonPart;
  rightButton: TwoStatesButtonPart;
  onChange: (value: string) => void;
  value: string;
  disabled?: boolean;
}

export interface TwoStatesButtonInterface {
  focusLeftButton: () => void;
}

const TwoStatesButton = React.forwardRef<
  TwoStatesButtonInterface,
  TwoStatesButtonProps
>(({ leftButton, rightButton, onChange, value, disabled }, ref) => {
  const leftButtonRef = React.useRef<HTMLButtonElement | null>(null);

  const focusLeftButton = React.useCallback(() => {
    if (leftButtonRef.current) focusButton(leftButtonRef.current);
  }, []);

  React.useImperativeHandle(ref, () => ({
    focusLeftButton,
  }));

  const isLeft = value === leftButton.value;
  const leftButtonDataset = isLeft ? { effective: 'true' } : undefined;
  const rightButtonDataset = !isLeft ? { effective: 'true' } : undefined;

  return (
    <ButtonGroup size="small" disableElevation disabled={disabled}>
      <Button
        id={leftButton.id}
        {...dataObjectToProps(leftButtonDataset)}
        variant={isLeft ? 'contained' : 'outlined'}
        color={isLeft ? 'secondary' : 'default'}
        onClick={() => onChange(leftButton.value)}
        ref={leftButtonRef}
      >
        {leftButton.icon}
        {leftButton.icon && leftButton.label && <Spacer />}
        {leftButton.label}
      </Button>
      <Button
        id={rightButton.id}
        {...dataObjectToProps(rightButtonDataset)}
        variant={!isLeft ? 'contained' : 'outlined'}
        color={!isLeft ? 'secondary' : 'default'}
        onClick={() => onChange(rightButton.value)}
      >
        {rightButton.icon}
        {rightButton.icon && rightButton.label && <Spacer />}
        {rightButton.label}
      </Button>
    </ButtonGroup>
  );
});

export default TwoStatesButton;
