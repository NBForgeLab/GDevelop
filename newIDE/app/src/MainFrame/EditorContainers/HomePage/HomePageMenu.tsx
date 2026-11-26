import * as React from 'react';
import { Trans } from '@lingui/macro';
import { Column, Line } from '../../../UI/Grid';
import Drawer from '@material-ui/core/Drawer';
import { type SvgIconProps } from '@material-ui/core/SvgIcon';
import IconButton from '../../../UI/IconButton';
import VerticalTabButton from '../../../UI/VerticalTabButton';
import DoubleChevronArrowLeft from '../../../UI/CustomSvgIcons/DoubleChevronArrowLeft';
import HammerIcon from '../../../UI/CustomSvgIcons/Hammer';
import SchoolIcon from '../../../UI/CustomSvgIcons/School';
import ControllerIcon from '../../../UI/CustomSvgIcons/Controller';
import BookLeafIcon from '../../../UI/CustomSvgIcons/BookLeaf';
import StoreIcon from '../../../UI/CustomSvgIcons/Store';
import Preferences from '../../../UI/CustomSvgIcons/Preferences';
import GDevelopGLogo from '../../../UI/CustomSvgIcons/GDevelopGLogo';
import GDevelopThemeContext from '../../../UI/Theme/GDevelopThemeContext';
import HomePageMenuBar from './HomePageMenuBar';
import {
  shouldHideClassroomTab,
  type Limits,
} from '../../../Utils/GDevelopServices/Usage';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import { isNativeMobileApp } from '../../../Utils/Platform';

export const styles = {
  // Ensure it's always interactive, even when another iframe disable pointer events.
  container: { pointerEvents: 'all', display: 'flex' },
  drawerContent: {
    height: '100%',
    width: 250,
    paddingBottom: 10,
    overflowX: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  drawerTopButtonsContainer: {
    flex: 1,
    marginTop: 'var(--safe-area-inset-top)',
  },
  drawerBottomButtonsContainer: {
    marginBottom: 'var(--safe-area-inset-bottom)',
  },
} satisfies Record<string, React.CSSProperties>;

export const toSvgIconColor = (color: string): SvgIconProps['color'] => {
  if (
    color === 'inherit' ||
    color === 'primary' ||
    color === 'secondary' ||
    color === 'action' ||
    color === 'error' ||
    color === 'disabled'
  ) {
    return color;
  }
  return 'inherit';
};

export type HomeTab = 'create' | 'learn' | 'play' | 'shop' | 'team-view';

export type GetIconFunction = (arg0: {
  color: string;
  fontSize: 'inherit' | 'small';
}) => React.ReactNode;

export type HomePageMenuTab = {
  label: React.ReactNode;
  tab: HomeTab;
  getIcon: GetIconFunction;
  id: string;
};

const homePageMenuTabs: {
  [tab in HomeTab]: HomePageMenuTab;
} = {
  create: {
    label: <Trans>Create</Trans>,
    tab: 'create',
    id: 'home-create-tab',
    getIcon: ({ color, fontSize }) => (
      <HammerIcon fontSize={fontSize} color={toSvgIconColor(color)} />
    ),
  },
  shop: {
    label: <Trans>Shop</Trans>,
    tab: 'shop',
    id: 'home-shop-tab',
    getIcon: ({ color, fontSize }) => (
      <StoreIcon fontSize={fontSize} color={toSvgIconColor(color)} />
    ),
  },
  learn: {
    label: <Trans>Learn</Trans>,
    tab: 'learn',
    id: 'home-learn-tab',
    getIcon: ({ color, fontSize }) => (
      <SchoolIcon fontSize={fontSize} color={toSvgIconColor(color)} />
    ),
  },
  play: {
    label: <Trans>Play</Trans>,
    tab: 'play',
    id: 'home-play-tab',
    getIcon: ({ color, fontSize }) => (
      <ControllerIcon fontSize={fontSize} color={toSvgIconColor(color)} />
    ),
  },
  'team-view': {
    label: <Trans>Teach</Trans>,
    tab: 'team-view',
    id: 'team-view-tab',
    getIcon: ({ color, fontSize }) => (
      <BookLeafIcon fontSize={fontSize} color={toSvgIconColor(color)} />
    ),
  },
};

export const getTabsToDisplay = ({
  limits,
}: {
  limits: Limits | null | undefined;
}): HomePageMenuTab[] => {
  const displayPlayTab =
    !limits ||
    !(
      limits.capabilities.classrooms &&
      limits.capabilities.classrooms.hidePlayTab
    );
  const displayShopTab =
    !limits ||
    !(
      limits.capabilities.classrooms &&
      limits.capabilities.classrooms.hidePremiumProducts
    );
  const displayTeachTab =
    !shouldHideClassroomTab(limits) && !isNativeMobileApp();
  const tabs: HomeTab[] = ['learn', 'create'];
  if (displayPlayTab) tabs.push('play');
  if (displayShopTab) tabs.push('shop');
  if (displayTeachTab) tabs.push('team-view');
  return tabs.map((tab) => homePageMenuTabs[tab]);
};

type Props = {
  setActiveTab: (homeTab: HomeTab) => void;
  activeTab: HomeTab;
  onOpenPreferences: () => void;
  onOpenAbout: () => void;
};

export const HomePageMenu = ({
  setActiveTab,
  activeTab,
  onOpenPreferences,
  onOpenAbout,
}: Props): React.ReactElement<any> => {
  const gdevelopTheme = React.useContext(GDevelopThemeContext);
  const { limits } = React.useContext(AuthenticatedUserContext);
  const [isHomePageMenuDrawerOpen, setIsHomePageMenuDrawerOpen] =
    React.useState(false);

  const tabsToDisplay = getTabsToDisplay({ limits });

  const buttons: {
    label: React.ReactNode;
    getIcon: GetIconFunction;
    id: string;
    onClick: () => void;
  }[] = [
    {
      label: <Trans>Preferences</Trans>,
      id: 'settings',
      onClick: onOpenPreferences,
      getIcon: ({ color, fontSize }) => (
        <Preferences fontSize={fontSize} color={toSvgIconColor(color)} />
      ),
    },
    {
      label: <Trans>About GDevelop</Trans>,
      id: 'about-gdevelop',
      onClick: onOpenAbout,
      getIcon: ({ color, fontSize }) => (
        <GDevelopGLogo fontSize={fontSize} color={toSvgIconColor(color)} />
      ),
    },
  ];

  return (
    <div style={styles.container}>
      <HomePageMenuBar
        activeTab={activeTab}
        onOpenAbout={onOpenAbout}
        onOpenHomePageMenuDrawer={() => setIsHomePageMenuDrawerOpen(true)}
        onOpenPreferences={onOpenPreferences}
        setActiveTab={setActiveTab}
      />
      <Drawer
        open={isHomePageMenuDrawerOpen}
        PaperProps={{
          style: {
            ...styles.drawerContent,
            backgroundColor: gdevelopTheme.home.header.backgroundColor,
          },
          className: 'safe-area-aware-left-container',
        }}
        onClose={() => {
          setIsHomePageMenuDrawerOpen(false);
        }}
        ModalProps={{
          keepMounted: true,
        }}
      >
        <Line expand>
          <Column expand>
            <div style={styles.drawerTopButtonsContainer}>
              <Column noMargin expand>
                <Line noMargin justifyContent="flex-end">
                  <IconButton
                    onClick={() => {
                      setIsHomePageMenuDrawerOpen(false);
                    }}
                    size="small"
                  >
                    <DoubleChevronArrowLeft />
                  </IconButton>
                </Line>
                {tabsToDisplay.map(({ label, tab, getIcon, id }) => (
                  <VerticalTabButton
                    key={id}
                    label={label}
                    onClick={() => {
                      setActiveTab(tab);
                      setIsHomePageMenuDrawerOpen(false);
                    }}
                    getIcon={getIcon}
                    isActive={activeTab === tab}
                  />
                ))}
              </Column>
            </div>
            <div style={styles.drawerBottomButtonsContainer}>
              <Column noMargin>
                {buttons.map(({ label, getIcon, onClick, id }) => (
                  <VerticalTabButton
                    key={id}
                    label={label}
                    onClick={onClick}
                    getIcon={getIcon}
                    isActive={false}
                  />
                ))}
              </Column>
            </div>
          </Column>
        </Line>
      </Drawer>
    </div>
  );
};
