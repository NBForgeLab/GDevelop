import * as React from 'react';
import { I18n } from '@lingui/react';
import { Trans } from '@lingui/macro';
import TextField from '@material-ui/core/TextField';
import { type MessageDescriptor } from '../Utils/i18n/MessageDescriptor.flow';
import Autocomplete from '@material-ui/lab/Autocomplete';
import { makeStyles, Popper } from '@material-ui/core';
import {
  AutocompletePaperComponent,
  autocompleteStyles,
} from './SemiControlledAutoComplete';
import ListItem from '@material-ui/core/ListItem';
import ListItemText from '@material-ui/core/ListItemText';
import { textEllipsisStyle } from './TextEllipsis';
import Text from './Text';
import ChevronArrowBottom from './CustomSvgIcons/ChevronArrowBottom';
import PortalContainerContext from './PortalContainerContext';

const renderItem = (
  option: AutocompleteOption,
  state: Record<string, any>
): React.ReactNode => (
  <ListItem dense component={'div'} style={autocompleteStyles.listItem}>
    <ListItemText
      style={autocompleteStyles.listItemText}
      primary={
        <div title={option.value} style={textEllipsisStyle}>
          {option.text}
        </div>
      }
    />
  </ListItem>
);

const styles = {
  listbox: {
    maxHeight: 250,
    overflowY: 'scroll',
  },
};

export type AutocompleteOption = {
  // The text displayed
  text: string;
  // The internal value selected
  value: string;
  // If the option is disabled by default
  disabled?: boolean;
};

export type DataSource = Array<AutocompleteOption | null | undefined>;

const useChipStyles = makeStyles({
  root: {
    height: 25, // Make the chips smaller to fit the input.
  },
  deleteIcon: {
    cursor: 'default', // Hover is enough, no need for a different cursor.
  },
});

type Props = {
  value: Array<AutocompleteOption>;
  onChange: (
    event: React.ChangeEvent<any>,
    values: Array<AutocompleteOption>
  ) => void;
  dataSource: DataSource;
  inputValue: string | null | undefined;
  onInputChange: (
    event: React.ChangeEvent<any>,
    value: string,
    reason: string
  ) => void;
  floatingLabelText?: React.ReactNode;
  hintText?: MessageDescriptor;
  helperText?: React.ReactNode;
  fullWidth?: boolean;
  error?: string | null;
  loading?: boolean;
  disabled?: boolean;
  // Allow limiting the number of options by disabling the autocomplete.
  optionsLimit?: number;
  disableAutoTranslate?: boolean;
};

export type SemiControlledMultiAutoCompleteInterface = {
  focusInput: () => void;
};

const SemiControlledMultiAutoComplete = React.forwardRef<
  SemiControlledMultiAutoCompleteInterface,
  Props
>((props, ref) => {
  const chipStyles = useChipStyles();
  const inputRef = React.useRef<HTMLInputElement | null>(null);
  const portalContainer = React.useContext(PortalContainerContext);

  React.useImperativeHandle(ref, () => ({
    focusInput: () => {
      if (inputRef.current) {
        inputRef.current.focus();
      }
    },
  }));

  return (
    <I18n>
      {({ i18n }) => (
        <Autocomplete
          multiple
          PopperComponent={
            portalContainer
              ? (popperProps) => (
                  <Popper {...popperProps} container={portalContainer} />
                )
              : undefined
          }
          value={props.value}
          onChange={props.onChange}
          inputValue={props.inputValue ?? undefined}
          onInputChange={props.onInputChange}
          options={props.dataSource.filter(
            (option): option is AutocompleteOption => Boolean(option)
          )}
          popupIcon={<ChevronArrowBottom />}
          PaperComponent={AutocompletePaperComponent}
          renderOption={renderItem}
          getOptionLabel={(option: AutocompleteOption) => option.text}
          getOptionDisabled={(option: AutocompleteOption) =>
            !!option.disabled ||
            !!props.value.find(
              (element) => element && element.value === option.value
            ) ||
            (!!props.optionsLimit && props.value.length >= props.optionsLimit)
          }
          getOptionSelected={(option, value) => option.value === value.value}
          loading={props.loading}
          ListboxProps={{
            className: props.disableAutoTranslate ? 'notranslate' : '',
            style: {
              ...autocompleteStyles.listbox,
              ...styles.listbox,
            },
          }}
          renderInput={(params) => (
            <TextField
              {...params}
              color="secondary"
              InputProps={{
                ...params.InputProps,
                placeholder: props.hintText && i18n._(props.hintText),
              }}
              label={props.floatingLabelText}
              helperText={props.error || props.helperText}
              variant="filled"
              error={!!props.error}
              inputRef={inputRef}
              disabled={props.disabled || props.loading}
            />
          )}
          fullWidth={props.fullWidth}
          disabled={props.disabled || props.loading}
          noOptionsText={
            <Text noMargin>
              <Trans>No options</Trans>
            </Text>
          }
          loadingText={
            <Text noMargin>
              <Trans>Loading...</Trans>
            </Text>
          }
          ChipProps={{
            classes: chipStyles,
            className: props.disableAutoTranslate ? 'notranslate' : '',
          }}
        />
      )}
    </I18n>
  );
});

export default SemiControlledMultiAutoComplete;
