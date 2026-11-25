import * as React from 'react';

type HomeTab = 'create' | 'learn' | 'play' | 'shop' | 'team-view';

export declare const homepageMobileMenuHeight: number;
export declare const homepageDesktopMenuBarWidth: number;
export declare const homepageMediumMenuBarWidth: number;
export declare const styles: Record<string, React.CSSProperties>;

declare const HomePageMenuBar: (props: {
  setActiveTab: (tab: HomeTab) => void;
  activeTab: HomeTab;
  onOpenPreferences: () => void;
  onOpenAbout: () => void;
  onOpenHomePageMenuDrawer: () => void;
}) => React.ReactNode;

export default HomePageMenuBar;
