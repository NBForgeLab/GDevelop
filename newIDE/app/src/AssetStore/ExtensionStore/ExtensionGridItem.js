// @flow
import * as React from 'react';
import { type ExtensionShortHeader } from '../../Utils/GDevelopServices/Extension';
import ButtonBase from '@material-ui/core/ButtonBase';
import Text from '../../UI/Text';
import { Trans } from '@lingui/macro';
import HighlightedText from '../../UI/Search/HighlightedText';
import { type SearchMatch } from '../../UI/Search/UseSearchStructuredItem';
import Chip from '../../UI/Chip';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '../../UI/IconButton';
import GDevelopThemeContext from '../../UI/Theme/GDevelopThemeContext';
import Favorite from '@material-ui/icons/Favorite';
import FavoriteBorder from '@material-ui/icons/FavoriteBorder';
import PreferencesContext from '../../MainFrame/Preferences/PreferencesContext';
import ListIcon from '../../UI/ListIcon';

const styles = {
  container: {
    height: '100%',
    padding: 1,
  },
  button: {
    width: '100%',
    height: '100%',
    minHeight: 240,
  },
  cardContainer: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    width: '100%',
    minHeight: 240,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
    transition: 'background-color 0.2s ease-in-out',
  },
  iconContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingBottom: 12,
    minHeight: 80,
  },
  contentContainer: {
    flex: 1,
    padding: 12,
    paddingTop: 4,
    display: 'flex',
    flexDirection: 'column',
    gap: 6,
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    minHeight: 24,
  },
  favoriteButton: {
    position: 'absolute',
    top: 6,
    right: 6,
    zIndex: 2,
  },
  installedRibbon: {
    position: 'absolute',
    top: 15,
    left: -40,
    transform: 'rotate(-45deg)',
    backgroundColor: '#6c5ce7',
    color: '#ffffff',
    width: 135,
    height: 25,
    zIndex: 2,
    pointerEvents: 'none',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
  },
  installedRibbonText: {
    width: '100%',
    padding: '0 8px',
    boxSizing: 'border-box',
    fontSize: 10,
    fontWeight: 700,
    letterSpacing: 0.35,
    lineHeight: 1,
    textTransform: 'uppercase',
    whiteSpace: 'nowrap',
    textAlign: 'center',
  },
};

type Props = {|
  id?: string,
  project: gdProject,
  extensionShortHeader: ExtensionShortHeader,
  matches: ?Array<SearchMatch>,
  onChoose: () => void,
  onHeightComputed: number => void,
|};

export const ExtensionGridItem = ({
  id,
  project,
  extensionShortHeader,
  matches,
  onChoose,
  onHeightComputed,
}: Props): React.Node => {
  const gdevelopTheme = React.useContext(GDevelopThemeContext);
  const preferences = React.useContext(PreferencesContext);

  const alreadyInstalled = project.hasEventsFunctionsExtensionNamed(
    extensionShortHeader.name
  );

  const fromStore = alreadyInstalled
    ? project
        .getEventsFunctionsExtension(extensionShortHeader.name)
        .getOriginName() === 'gdevelop-extension-store'
    : false;

  const containerRef = React.useRef<?HTMLDivElement>(null);
  React.useLayoutEffect(() => {
    if (containerRef.current)
      onHeightComputed(
        Math.ceil(containerRef.current.getBoundingClientRect().height)
      );
  });

  const renderExtensionField = (field: 'shortDescription' | 'fullName') => {
    const originalField = extensionShortHeader[field];

    if (!matches) return originalField;
    const nameMatches = matches.filter(match => match.key === field);
    if (nameMatches.length === 0) return originalField;

    return (
      <HighlightedText
        text={originalField}
        matchesCoordinates={nameMatches[0].indices}
      />
    );
  };

  const [hover, setHover] = React.useState(false);
  const isFavorite = preferences.isFavoriteExtension(extensionShortHeader.name);

  const handleFavoriteClick = (event: SyntheticMouseEvent<>) => {
    event.stopPropagation();
    if (isFavorite) {
      preferences.removeFavoriteExtension(extensionShortHeader.name);
    } else {
      preferences.addFavoriteExtension(extensionShortHeader.name);
    }
  };

  return (
    <div ref={containerRef} style={styles.container}>
      <ButtonBase id={id} style={styles.button} onClick={onChoose} focusRipple>
        <div
          style={{
            ...styles.cardContainer,
            backgroundColor: hover
              ? gdevelopTheme.list.hover.backgroundColor
              : gdevelopTheme.list.itemsBackgroundColor,
          }}
          onPointerEnter={() => setHover(true)}
          onPointerLeave={() => setHover(false)}
        >
          {alreadyInstalled && (
            <div style={styles.installedRibbon}>
              <span style={styles.installedRibbonText}>
                {fromStore ? (
                  <Trans>Installed</Trans>
                ) : (
                  <Trans>In project</Trans>
                )}
              </span>
            </div>
          )}
          {(hover || isFavorite) && (
            <div style={styles.favoriteButton}>
              <Tooltip
                title={
                  isFavorite ? (
                    <Trans>Remove from favorites</Trans>
                  ) : (
                    <Trans>Add to favorites</Trans>
                  )
                }
              >
                <IconButton size="small" onClick={handleFavoriteClick}>
                  {isFavorite ? (
                    <Favorite style={{ color: '#e53935' }} />
                  ) : (
                    <FavoriteBorder />
                  )}
                </IconButton>
              </Tooltip>
            </div>
          )}
          <div style={styles.iconContainer}>
            <ListIcon
              src={extensionShortHeader.previewIconUrl}
              iconSize={64}
              useExactIconSize
            />
          </div>

          <div style={styles.contentContainer}>
            <Text
              noMargin
              allowBrowserAutoTranslate={false}
              size="body2"
              style={{
                fontWeight: 500,
                textAlign: 'center',
                lineHeight: '1.3',
              }}
            >
              {renderExtensionField('fullName')}
            </Text>

            <div style={styles.metaRow}>
              {extensionShortHeader.tier === 'experimental' && (
                <Chip
                  size="small"
                  label={<Trans>Experimental</Trans>}
                  color="primary"
                />
              )}
            </div>

            <Text
              noMargin
              size="body2"
              allowBrowserAutoTranslate={false}
              color="secondary"
              style={{
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                display: '-webkit-box',
                WebkitLineClamp: 3,
                WebkitBoxOrient: 'vertical',
                textAlign: 'center',
                fontSize: '0.8rem',
                lineHeight: '1.4',
              }}
            >
              {renderExtensionField('shortDescription')}
            </Text>
          </div>
        </div>
      </ButtonBase>
    </div>
  );
};
