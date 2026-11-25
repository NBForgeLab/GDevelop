import * as React from 'react';

export declare const SECTION_DESKTOP_SPACING: number;

export type Props = {
  children: React.ReactNode;
  chipText?: React.ReactNode;
  title?: React.ReactNode;
  titleAdornment?: React.ReactNode;
  subtitleText?: React.ReactNode;
  customPaperStyle?: Record<string, any>;
  renderSubtitle?: () => React.ReactNode;
  backAction?: () => void | Promise<void>;
  flexBody?: boolean;
  renderFooter?: () => React.ReactNode;
  noScroll?: boolean;
  applyTopSpacingAsMarginOnChildrenContainer?: boolean;
  showUrgentAnnouncements?: boolean;
};

export declare const SectionRow: React.ComponentType<{
  children: React.ReactNode;
  expand?: boolean;
}>;

declare const SectionContainer: React.ForwardRefExoticComponent<
  Props & React.RefAttributes<HTMLDivElement>
>;
export default SectionContainer;
