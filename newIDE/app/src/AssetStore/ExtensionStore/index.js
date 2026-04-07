// @flow
import { type I18n as I18nType } from '@lingui/core';
import { t, Trans } from '@lingui/macro';
import * as React from 'react';
import { Divider } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import SearchBar from '../../UI/SearchBar';
import { type ExtensionShortHeader } from '../../Utils/GDevelopServices/Extension';
import { ExtensionStoreContext } from './ExtensionStoreContext';
import { ListSearchResults } from '../../UI/Search/ListSearchResults';
import { ExtensionListItem } from './ExtensionListItem';
import ExtensionInstallDialog from './ExtensionInstallDialog';
import { type SearchMatch } from '../../UI/Search/UseSearchStructuredItem';
import {
  sendExtensionDetailsOpened,
  sendExtensionAddedToProject,
} from '../../Utils/Analytics/EventSender';
import useDismissableTutorialMessage from '../../Hints/useDismissableTutorialMessage';
import { ColumnStackLayout, LineStackLayout } from '../../UI/Layout';
import { Column, Line } from '../../UI/Grid';
import PreferencesContext from '../../MainFrame/Preferences/PreferencesContext';
import { ResponsiveLineStackLayout } from '../../UI/Layout';
import { useResponsiveWindowSize } from '../../UI/Responsive/ResponsiveWindowMeasurer';
import SearchBarSelectField from '../../UI/SearchBarSelectField';
import SelectOption from '../../UI/SelectOption';
import ElementWithMenu from '../../UI/Menu/ElementWithMenu';
import IconButton from '../../UI/IconButton';
import ThreeDotsMenu from '../../UI/CustomSvgIcons/ThreeDotsMenu';
import Text from '../../UI/Text';
import ExtensionDetailPanel, {
  useExtensionDetail,
} from './ExtensionDetailPanel';

export const ExtensionDetailSidePanel = ({
  extensionShortHeader,
  isInstalling,
  onInstall,
  project,
}: {
  extensionShortHeader: ExtensionShortHeader,
  isInstalling: boolean,
  onInstall?: () => Promise<void>,
  project: gdProject,
}): React.Node => {
  const extensionDetail = useExtensionDetail({
    extensionShortHeader,
    isInstalling,
    onInstall,
    project,
  });

  return (
    <ExtensionDetailPanel
      extensionShortHeader={extensionShortHeader}
      isInstalling={isInstalling}
      onInstall={onInstall}
      extensionDetail={extensionDetail}
      shouldDisplayButtons={true}
    />
  );
};

type Props = {|
  isInstalling: boolean,
  project: gdProject,
  onInstall: ExtensionShortHeader => Promise<boolean>,
  showOnlyWithBehaviors: boolean,
|};

const getExtensionName = (extensionShortHeader: ExtensionShortHeader) =>
  extensionShortHeader.name;

export const ExtensionStore = ({
  isInstalling,
  project,
  onInstall,
  showOnlyWithBehaviors,
}: Props): React.Node => {
  const preferences = React.useContext(PreferencesContext);
  const [
    selectedExtensionShortHeader,
    setSelectedExtensionShortHeader,
  ] = React.useState<?ExtensionShortHeader>(null);
  const [currentTab, setCurrentTab] = React.useState<'all' | 'favorites'>(
    'all'
  );
  const {
    searchResults,
    error,
    fetchExtensionsAndFilters,
    searchText,
    setSearchText,
    allCategories,
    chosenCategory,
    setChosenCategory,
  } = React.useContext(ExtensionStoreContext);
  const { isMobile } = useResponsiveWindowSize();

  React.useEffect(
    () => {
      fetchExtensionsAndFilters();
    },
    [fetchExtensionsAndFilters]
  );

  const filteredSearchResults = searchResults
    ? searchResults.filter(({ item: extensionShortHeader }) => {
        const matchesBehaviorFilter =
          !showOnlyWithBehaviors ||
          extensionShortHeader.eventsBasedBehaviorsCount > 0;
        const matchesFavoriteFilter =
          currentTab === 'all' ||
          preferences.isFavoriteExtension(extensionShortHeader.name);

        return matchesBehaviorFilter && matchesFavoriteFilter;
      })
    : null;

  const getExtensionsMatches = (
    extensionShortHeader: ExtensionShortHeader
  ): SearchMatch[] => {
    if (!searchResults) return [];
    const extensionMatches = searchResults.find(
      result => result.item.name === extensionShortHeader.name
    );
    return extensionMatches ? extensionMatches.matches : [];
  };

  const { DismissableTutorialMessage } = useDismissableTutorialMessage(
    'intro-behaviors-and-functions'
  );

  return (
    <React.Fragment>
      <LineStackLayout expand noMargin>
        <ColumnStackLayout expand noMargin useFullHeight>
          <Line noMargin>
            <Tabs
              value={currentTab}
              onChange={(event, newValue) => setCurrentTab(newValue)}
              indicatorColor="primary"
              textColor="primary"
            >
              <Tab value="all" label={<Trans>All Extensions</Trans>} />
              <Tab value="favorites" label={<Trans>Favorites</Trans>} />
            </Tabs>
          </Line>
          <ColumnStackLayout noMargin>
            <ResponsiveLineStackLayout noMargin>
              <SearchBarSelectField
                value={chosenCategory}
                onChange={(e, i, value: string) => {
                  setChosenCategory(value);
                }}
              >
                <SelectOption value="" label={t`All categories`} />
                {allCategories.map(category => (
                  <SelectOption
                    key={category}
                    value={category}
                    label={category}
                  />
                ))}
              </SearchBarSelectField>
              <Line expand noMargin>
                <Column expand noMargin>
                  <SearchBar
                    id="extension-search-bar"
                    value={searchText}
                    onChange={setSearchText}
                    onRequestSearch={() => {}}
                    placeholder={t`Search extensions`}
                    autoFocus="desktop"
                  />
                </Column>
                <ElementWithMenu
                  key="menu"
                  element={
                    <IconButton size="small">
                      <ThreeDotsMenu />
                    </IconButton>
                  }
                  buildMenuTemplate={(i18n: I18nType) => [
                    {
                      label: preferences.values.showExperimentalExtensions
                        ? i18n._(t`Hide experimental extensions`)
                        : i18n._(t`Show experimental extensions`),
                      click: () => {
                        preferences.setShowExperimentalExtensions(
                          !preferences.values.showExperimentalExtensions
                        );
                      },
                    },
                  ]}
                />
              </Line>
            </ResponsiveLineStackLayout>
            {DismissableTutorialMessage}
          </ColumnStackLayout>
          <ListSearchResults
            disableAutoTranslate
            onRetry={fetchExtensionsAndFilters}
            error={error}
            searchItems={
              filteredSearchResults &&
              filteredSearchResults.map(({ item }) => item)
            }
            getSearchItemUniqueId={getExtensionName}
            // $FlowFixMe[missing-local-annot]
            renderSearchItem={(extensionShortHeader, onHeightComputed) => (
              <ExtensionListItem
                id={`extension-list-item-${extensionShortHeader.name}`}
                key={extensionShortHeader.name}
                project={project}
                onHeightComputed={onHeightComputed}
                extensionShortHeader={extensionShortHeader}
                matches={getExtensionsMatches(extensionShortHeader)}
                onChoose={() => {
                  sendExtensionDetailsOpened(extensionShortHeader.name);
                  setSelectedExtensionShortHeader(extensionShortHeader);
                }}
              />
            )}
          />
        </ColumnStackLayout>
        {!isMobile ? (
          <LineStackLayout expand noMargin>
            <Divider orientation="vertical" />
            {selectedExtensionShortHeader ? (
              <Column expand noOverflowParent>
                <ExtensionDetailSidePanel
                  project={project}
                  extensionShortHeader={selectedExtensionShortHeader}
                  isInstalling={isInstalling}
                  onInstall={async () => {
                    sendExtensionAddedToProject(
                      selectedExtensionShortHeader.name
                    );
                    await onInstall(selectedExtensionShortHeader);
                  }}
                />
              </Column>
            ) : (
              <Column
                expand
                noMargin
                noOverflowParent
                alignItems="center"
                justifyContent="center"
              >
                <Text color="secondary">
                  <Trans>Select an extension</Trans>
                </Text>
              </Column>
            )}
          </LineStackLayout>
        ) : null}
      </LineStackLayout>
      {isMobile && !!selectedExtensionShortHeader && (
        <ExtensionInstallDialog
          project={project}
          isInstalling={isInstalling}
          extensionShortHeader={selectedExtensionShortHeader}
          onInstall={async () => {
            sendExtensionAddedToProject(selectedExtensionShortHeader.name);
            const wasInstalled = await onInstall(selectedExtensionShortHeader);
            if (wasInstalled) setSelectedExtensionShortHeader(null);
          }}
          onClose={() => setSelectedExtensionShortHeader(null)}
        />
      )}
    </React.Fragment>
  );
};
