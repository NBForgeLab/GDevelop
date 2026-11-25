import * as React from 'react';
import { I18n } from '@lingui/react';

import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';

import AuthenticatedUserContext from '../Profile/AuthenticatedUserContext';
import { Line, Spacer } from '../UI/Grid';
import Text from '../UI/Text';
import RaisedButton from '../UI/RaisedButton';
import FlatButton from '../UI/FlatButton';

import { type StorageProvider } from '.';
import { makeStyles } from '@material-ui/core/styles';
import { t } from '@lingui/macro';

type Props = {
  storageProvider: StorageProvider;
  onChooseProvider: (storageProvider: StorageProvider) => void;
  disabled?: boolean;
};

const useListItemStyles = makeStyles((theme) => {
  return {
    root: {
      border: `1px solid ${theme.palette.divider}`,
      borderRadius: 8,
    },
  };
});

const StorageProviderListItem = ({
  storageProvider,
  onChooseProvider,
  disabled,
}: Props): React.ReactNode => {
  const authenticatedUser = React.useContext(AuthenticatedUserContext);

  const classesForListItem = useListItemStyles();

  const shouldDisplayAuthenticationButtons =
    storageProvider.needUserAuthentication && !authenticatedUser.authenticated;

  const isDisabled = storageProvider.disabled || disabled;
  const isLineClickable =
    !isDisabled &&
    (!storageProvider.needUserAuthentication ||
      !shouldDisplayAuthenticationButtons);

  return (
    <I18n>
      {({ i18n }) => {
        const listItemContent = (
          <>
            <ListItemIcon>
              {storageProvider.renderIcon
                ? storageProvider.renderIcon({})
                : undefined}
            </ListItemIcon>
            <ListItemText>
              <Line justifyContent="space-between" alignItems="center">
                <Text noMargin>{i18n._(storageProvider.name)}</Text>
                {shouldDisplayAuthenticationButtons && (
                  <Line noMargin>
                    <FlatButton
                      label={i18n._(t`Create an Account`)}
                      onClick={() =>
                        authenticatedUser.onOpenCreateAccountDialog()
                      }
                    />
                    <Spacer />
                    <RaisedButton
                      primary
                      label={i18n._(t`Login with GDevelop`)}
                      onClick={() => authenticatedUser.onOpenLoginDialog()}
                    />
                  </Line>
                )}
              </Line>
            </ListItemText>
          </>
        );

        return isLineClickable ? (
          <ListItem
            classes={classesForListItem}
            key={storageProvider.internalName}
            disabled={isDisabled}
            onClick={() => onChooseProvider(storageProvider)}
            button
          >
            {listItemContent}
          </ListItem>
        ) : (
          <ListItem
            classes={classesForListItem}
            key={storageProvider.internalName}
            disabled={isDisabled}
          >
            {listItemContent}
          </ListItem>
        );
      }}
    </I18n>
  );
};

export default StorageProviderListItem;
