import * as React from 'react';
import { Column, Line, Spacer } from '../../../UI/Grid';
import { useResponsiveWindowSize } from '../../../UI/Responsive/ResponsiveWindowMeasurer';
import Text from '../../../UI/Text';
import ArrowLeft from '../../../UI/CustomSvgIcons/ArrowLeft';
import TextButton from '../../../UI/TextButton';
import { Trans } from '@lingui/macro';
import Paper from '../../../UI/Paper';
import { ColumnStackLayout, LineStackLayout } from '../../../UI/Layout';
import { AnnouncementsFeed } from '../../../AnnouncementsFeed';
import { AnnouncementsFeedContext } from '../../../AnnouncementsFeed/AnnouncementsFeedContext';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import Chip from '../../../UI/Chip';

export const SECTION_DESKTOP_SPACING = 20;
const SECTION_MOBILE_SPACING_TOP = 10;

const titleStyle: React.CSSProperties & {
  textWrap?: 'wrap' | 'nowrap' | 'balance' | 'pretty' | 'stable';
} = { overflowWrap: 'anywhere', textWrap: 'wrap' };

const styles = {
  mobileContainer: {
    paddingLeft: 5,
    paddingRight: 5,
  },
  desktopContainer: {
    paddingLeft: SECTION_DESKTOP_SPACING,
    paddingRight: SECTION_DESKTOP_SPACING,
  },
  mobileFooter: {
    padding: 5,
  },
  desktopFooter: {
    paddingLeft: SECTION_DESKTOP_SPACING,
  },
  rowContainer: {
    display: 'flex',
    flexDirection: 'column',
    paddingBottom: SECTION_DESKTOP_SPACING,
  },
  container: {
    flex: 1,
    overflowX: 'hidden',
  },
  scrollContainer: {
    overflowY: 'scroll', // Force a scrollbar to prevent layout shifts.
  },
  noScrollContainer: {
    overflowY: 'hidden',
  },
  childrenContainer: {
    display: 'flex',
    flexDirection: 'column',
    minHeight: 0,
    minWidth: 0,
    flex: 1,
  },
  chip: { height: 24 },
} satisfies Record<string, React.CSSProperties>;

type Props = {
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

const SectionContainer = React.forwardRef<HTMLDivElement, Props>(
  (
    {
      children,
      chipText,
      title,
      titleAdornment,
      subtitleText,
      customPaperStyle,
      renderSubtitle,
      backAction,
      flexBody,
      renderFooter,
      noScroll,
      applyTopSpacingAsMarginOnChildrenContainer,
      showUrgentAnnouncements,
    },
    ref
  ) => {
    const { isMobile } = useResponsiveWindowSize();
    const { announcements } = React.useContext(AnnouncementsFeedContext);
    const containerStyle: {
      paddingTop: number;
      paddingLeft: number;
      paddingRight: number;
    } = {
      ...(isMobile ? styles.mobileContainer : styles.desktopContainer),
      paddingTop: applyTopSpacingAsMarginOnChildrenContainer
        ? 0
        : isMobile
          ? SECTION_MOBILE_SPACING_TOP
          : SECTION_DESKTOP_SPACING,
    };
    const scrollStyle = noScroll
      ? styles.noScrollContainer
      : styles.scrollContainer;
    const paperStyle: React.CSSProperties = {
      ...styles.container,
      display: flexBody ? 'flex' : 'block',
      ...containerStyle,
      ...scrollStyle,
      ...customPaperStyle,
    };
    const childrenContainerStyle = {
      ...styles.childrenContainer,
      marginTop: applyTopSpacingAsMarginOnChildrenContainer
        ? isMobile
          ? SECTION_MOBILE_SPACING_TOP
          : SECTION_DESKTOP_SPACING
        : 0,
    };
    const authenticatedUser = React.useContext(AuthenticatedUserContext);

    const shouldHideAnnouncements =
      !!authenticatedUser.limits &&
      !!authenticatedUser.limits.capabilities.classrooms &&
      authenticatedUser.limits.capabilities.classrooms.hideAnnouncements;

    return (
      <Column expand useFullHeight noMargin>
        <Paper style={paperStyle} square background="dark" ref={ref}>
          <div style={childrenContainerStyle}>
            {showUrgentAnnouncements && !shouldHideAnnouncements && (
              <>
                <AnnouncementsFeed canClose level="urgent" hideLoader />
                {announcements && announcements.length > 0 && <Spacer />}
              </>
            )}
            {backAction && (
              <Line>
                <TextButton
                  onClick={backAction}
                  icon={<ArrowLeft fontSize="small" />}
                  label={<Trans>Back</Trans>}
                />
              </Line>
            )}
            {(title || subtitleText || renderSubtitle) && (
              <SectionRow>
                {title && (
                  <LineStackLayout
                    noMargin
                    alignItems="center"
                    justifyContent="space-between"
                  >
                    <ColumnStackLayout noMargin expand>
                      {chipText && (
                        <Line noMargin>
                          <Chip label={chipText} style={styles.chip} />
                        </Line>
                      )}
                      <Text size="title" noMargin style={titleStyle}>
                        {title}
                      </Text>
                    </ColumnStackLayout>
                    {titleAdornment && (
                      <Column expand noMargin>
                        {titleAdornment}
                      </Column>
                    )}
                  </LineStackLayout>
                )}
                {subtitleText && (
                  <Line noMargin>
                    <Text noMargin>{subtitleText}</Text>
                  </Line>
                )}
                {renderSubtitle && renderSubtitle()}
              </SectionRow>
            )}
            {children}
          </div>
        </Paper>
        {renderFooter && (
          <Paper
            style={isMobile ? styles.mobileFooter : styles.desktopFooter}
            square
            background="dark"
          >
            {renderFooter()}
          </Paper>
        )}
      </Column>
    );
  }
);

export const SectionRow = ({
  children,
  expand,
}: {
  children: React.ReactNode;
  expand?: boolean;
}): React.ReactElement<any> => (
  <div
    style={{ ...styles.rowContainer, ...(expand ? { flex: 1 } : undefined) }}
  >
    {children}
  </div>
);

export default SectionContainer;
