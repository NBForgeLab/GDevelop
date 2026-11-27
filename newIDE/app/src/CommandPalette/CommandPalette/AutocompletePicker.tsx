import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import { type MessageDescriptor } from '../../Utils/i18n/MessageDescriptor';
import ListIcon from '../../UI/ListIcon';
import { useShortcutMap } from '../../KeyboardShortcuts';
import { makeStyles } from '@material-ui/core/styles';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Chip from '../../UI/Chip';
import TextField from '@material-ui/core/TextField';
import ChevronRightIcon from '../../UI/CustomSvgIcons/ChevronArrowRight';
import Autocomplete from '@material-ui/lab/Autocomplete';
import filterOptions from './FilterOptions';
import { type NamedCommand, type CommandOption } from '../CommandManager';
import commandsList, { commandAreas } from '../CommandsList';
import { getShortcutDisplayName } from '../../KeyboardShortcuts';
import { useResponsiveWindowSize } from '../../UI/Responsive/ResponsiveWindowMeasurer';
import { useShouldAutofocusInput } from '../../UI/Responsive/ScreenTypeMeasurer';
import PortalContainerContext from '../../UI/PortalContainerContext';
import { Popper } from '@material-ui/core';

const useStyles = makeStyles((theme) => ({
  listItemContainer: {
    width: '100%',
  },
  rootSmallPadding: {
    paddingLeft: 0,
  },
}));

const styles = {
  chip: {
    borderRadius: 3,
  },
};

type Item = NamedCommand | CommandOption;

type Props<T> = {
  onClose: () => void;
  onSelect: (item: T) => void;
  onInputChange?: (value: string) => void;
  items: Array<T>;
  placeholder: MessageDescriptor;
  i18n: I18nType;
};

const AutocompletePicker = (
  props: Props<NamedCommand> | Props<CommandOption>
): React.ReactNode => {
  const { isMobile, isMediumScreen } = useResponsiveWindowSize();
  const shouldAutofocusInput = useShouldAutofocusInput();
  const [open, setOpen] = React.useState(true);
  const shortcutMap = useShortcutMap();
  const classes = useStyles();
  const portalContainer = React.useContext(PortalContainerContext);

  const handleClose = (_: any, reason: string) => {
    if (reason === 'select-option' || reason === 'toggleInput') return;
    props.onClose();
  };

  const handleSelect = (_: any, item: any) => {
    props.onSelect(item);
  };

  const getItemHint = React.useCallback(
    (item: Item): React.ReactNode => {
      if (isMobile || isMediumScreen) return null;
      if ('text' in item) return null;
      const shortcutString = shortcutMap[item.name];
      if (!shortcutString) return null;
      const shortcutDisplayName = getShortcutDisplayName(shortcutString);
      return (
        <ListItemSecondaryAction>
          <Chip label={shortcutDisplayName} style={styles.chip} />
        </ListItemSecondaryAction>
      );
    },
    [shortcutMap, isMobile, isMediumScreen]
  );

  const getItemText = React.useCallback(
    (item: Item): string => {
      if ('text' in item) return item.text;
      const commandMetadata = commandsList[item.name];
      if (!commandMetadata) return item.name;
      const areaText = commandAreas[commandMetadata.area];
      return (
        props.i18n._(areaText) +
        ' 〉' +
        props.i18n._(commandMetadata.displayText)
      );
    },
    [props.i18n]
  );

  const getItemIcon = React.useCallback((item: Item): React.ReactNode => {
    if ('text' in item && item.iconSrc) {
      return <ListIcon iconSize={20} src={item.iconSrc} />;
    } else if ('icon' in item && item.icon) return item.icon;
    else return <ChevronRightIcon />;
  }, []);

  const renderOption = React.useCallback(
    (item: Item) => {
      return (
        <ListItem
          dense
          component="div"
          ContainerComponent="div"
          classes={{
            container: classes.listItemContainer,
            root: isMobile ? classes.rootSmallPadding : undefined,
          }}
        >
          <ListItemIcon>{getItemIcon(item)}</ListItemIcon>
          <ListItemText primary={getItemText(item)} />
          {getItemHint(item)}
        </ListItem>
      );
    },
    [
      classes.listItemContainer,
      classes.rootSmallPadding,
      isMobile,
      getItemText,
      getItemHint,
      getItemIcon,
    ]
  );

  return (
    <Autocomplete
      open={open}
      PopperComponent={
        portalContainer
          ? (popperProps) => (
              <Popper {...popperProps} container={portalContainer} />
            )
          : undefined
      }
      onClose={handleClose}
      onOpen={() => setOpen(true)}
      options={props.items}
      getOptionLabel={getItemText}
      onChange={handleSelect}
      onInputChange={(e, value, reason) => {
        if (reason === 'input' && props.onInputChange) {
          props.onInputChange(value);
        }
      }}
      openOnFocus
      autoHighlight
      filterOptions={filterOptions}
      renderInput={(params) => (
        <TextField
          {...params}
          placeholder={props.i18n._(props.placeholder)}
          variant="outlined"
          autoFocus={shouldAutofocusInput}
        />
      )}
      renderOption={renderOption}
    />
  );
};

export default AutocompletePicker;
