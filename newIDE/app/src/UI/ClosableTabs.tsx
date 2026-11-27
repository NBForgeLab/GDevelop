import { t } from '@lingui/macro';
import { type I18n as I18nType } from '@lingui/core';
import * as React from 'react';
import ButtonBase from '@material-ui/core/ButtonBase';
import ContextMenu, { type ContextMenuInterface } from './Menu/ContextMenu';
import { type MenuItemTemplate } from './Menu/Menu';
import { useLongTouch } from '../Utils/UseLongTouch';
import { LONG_PRESS_DELAY_ON_HELD_ITEM } from './DragAndDrop/TouchDragDelay';
import GDevelopThemeContext from './Theme/GDevelopThemeContext';
import { dataObjectToProps, type HTMLDataset } from '../Utils/HTMLDataset';
import Cross from './CustomSvgIcons/Cross';
import useForceUpdate from '../Utils/UseForceUpdate';

const WINDOW_NON_DRAGGABLE_PART_CLASS_NAME = 'title-bar-non-draggable-part';

const styles: {
  tabContentContainer: React.CSSProperties;
  tabLabel: React.CSSProperties;
  tabIcon: React.CSSProperties;
  tabLabelAndIcon: React.CSSProperties;
  closeButton: React.CSSProperties;
} = {
  tabContentContainer: {
    width: '100%',
    position: 'relative',
    textAlign: 'initial',
    minHeight: 0,
    display: 'flex',
    flex: 1,
  },
  tabLabel: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    fontSize: '15px', // Same as in Mosaic.css (for mosaic-window-title)
  },
  tabIcon: {
    marginLeft: 4,
    marginRight: 4,
    display: 'flex',
  },
  tabLabelAndIcon: {
    display: 'flex',
    alignItems: 'center',
  },
  closeButton: {
    marginRight: 5,
    marginLeft: 5,
  },
};

type TabContentContainerProps = {
  active: boolean;
  removePointerEvents?: boolean;
  children: React.ReactNode;
};

/**
 * Contains the content of a tab. Two important things:
 *
 * 1) Instead of setting the "height" of hidden tabs to "0", we set "display" to "none" to avoid
 * messing with components (in particular components where you can scroll: when collapsed because of height=0,
 * they will lose they scrolling position).
 *
 * 2) shouldComponentUpdate is used to avoid updating the content of a tab that is not selected.
 */
export class TabContentContainer extends React.Component<TabContentContainerProps> {
  shouldComponentUpdate(nextProps: TabContentContainerProps): boolean {
    return this.props.active || nextProps.active;
  }

  render(): React.ReactNode {
    const { children, active } = this.props;
    return (
      <div
        style={{
          ...styles.tabContentContainer,
          ...(active ? undefined : { display: 'none' }),
          pointerEvents: this.props.removePointerEvents ? 'none' : 'all',
        }}
      >
        {children}
      </div>
    );
  }
}

type ClosableTabsProps = {
  hideLabels?: boolean;
  renderTabs: (arg0: { containerWidth: number }) => React.ReactNode;
};

export const ClosableTabs = ({
  hideLabels,
  renderTabs,
}: ClosableTabsProps): React.ReactElement<any> => {
  const forceUpdate = useForceUpdate();
  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const tabItemContainerStyle: React.CSSProperties = {
    maxWidth: '100%', // Tabs should take all width
    flex: 1,
    display: hideLabels ? 'none' : 'flex',
    flexWrap: 'nowrap', // Single line of tab...
    overflowX: 'overlay' as React.CSSProperties['overflowX'], // ...scroll horizontally if needed
    overflowY: 'hidden', // ...never scroll vertically (useful on Safari)
    marginTop: 7, // Chosen to align with the size of controls in the titlebar.
  };

  const onScroll = React.useCallback(
    (event: React.WheelEvent<HTMLDivElement>) => {
      const divElement = containerRef.current;
      if (divElement) {
        divElement.scrollLeft += event.deltaY;
      }
    },
    []
  );

  const containerWidth = containerRef.current
    ? containerRef.current.clientWidth
    : null;

  React.useLayoutEffect(() => {
    // Force a re-render the first time after we know the container width.
    forceUpdate();
  }, [forceUpdate]);

  return (
    <div
      ref={containerRef}
      className="almost-invisible-scrollbar"
      style={tabItemContainerStyle}
      onWheel={onScroll}
    >
      {containerWidth !== null ? renderTabs({ containerWidth }) : null}
    </div>
  );
};

export type ClosableTabProps = {
  id?: string;
  data?: HTMLDataset;
  active: boolean;
  label: React.ReactNode | null | undefined;
  icon: React.ReactNode | null | undefined;
  renderCustomIcon?: ((brightness: number) => React.ReactNode) | null;
  closable: boolean;
  onClose: () => void;
  onCloseOthers: () => void;
  onCloseAll: () => void;
  onPopOut?: (() => void) | null;
  popOutEnabled?: boolean;
  onClick: () => void;
  onActivated: () => void;
  onHover: (
    arg0: boolean,
    options: {
      isLabelTruncated: boolean;
    }
  ) => void;
  maxWidth: number;
};

export function ClosableTab({
  id,
  data,
  active,
  onClose,
  onCloseOthers,
  onCloseAll,
  onPopOut,
  popOutEnabled = true,
  label,
  icon,
  renderCustomIcon,
  closable,
  onClick,
  onActivated,
  onHover,
  maxWidth,
}: ClosableTabProps): React.ReactNode {
  React.useEffect(() => {
    if (active) {
      onActivated();
    }
  }, [active, onActivated]);
  const contextMenu = React.useRef<ContextMenuInterface | null>(null);
  const spanLabelRef = React.useRef<HTMLSpanElement | null>(null);
  const [isLabelTruncated, setIsLabelTruncated] = React.useState(false);

  React.useEffect(() => {
    if (maxWidth && spanLabelRef.current) {
      setIsLabelTruncated(
        spanLabelRef.current.scrollWidth > spanLabelRef.current.clientWidth
      );
    }
    // Update when maxWidth changes.
  }, [maxWidth]);

  const openContextMenu = (event: React.MouseEvent<HTMLElement>) => {
    event.preventDefault();
    event.stopPropagation();
    if (contextMenu.current) {
      contextMenu.current.open(event.clientX, event.clientY);
    }
  };

  const closeOnMiddleClick = React.useCallback(
    (event: React.MouseEvent<HTMLElement>) => {
      if (event.nativeEvent && event.nativeEvent.button === 1) {
        onClose();
      }
    },
    [onClose]
  );

  // Allow a long press to show the context menu
  const { contextMenuProps: longTouchForContextMenuProps } = useLongTouch(
    React.useCallback(
      (event) => {
        if (contextMenu.current) {
          contextMenu.current.open(event.clientX, event.clientY);
        }
      },
      [contextMenu]
    ),
    // Tabs are held before being dragged.
    { delay: LONG_PRESS_DELAY_ON_HELD_ITEM }
  );

  const gdevelopTheme = React.useContext(GDevelopThemeContext);
  const textColor = active
    ? gdevelopTheme.closableTabs.selectedTextColor
    : gdevelopTheme.closableTabs.textColor;

  const brightness =
    gdevelopTheme.palette.type === 'dark'
      ? active
        ? 0.978
        : 0.776
      : active
        ? 0.022
        : 0.224;

  const labelMaxWidth = Math.max(
    0.1, // No negative max-width, which would actually not enforce any max width.
    (maxWidth || 320) -
      20 /* Close button */ -
      32 /* Icon */ -
      9 /* Extra margins */
  );

  return (
    <React.Fragment>
      <span
        id={id}
        style={{
          flexShrink: 0, // Tabs are never resized to fit in flex container
          position: 'relative',
          display: 'inline-block',
          marginRight: 2,
          // Leave some space when scrolled into view to let the user understand
          // that there are more tabs.
          scrollMarginRight: 20,
          scrollMarginLeft: 20,
          // Style:
          borderTopRightRadius: 8,
          borderTopLeftRadius: 8,
          borderTop: '1px solid black',
          borderRight: '1px solid black',
          borderLeft: '1px solid black',
          borderBottom: 'none',
          borderColor: active
            ? gdevelopTheme.closableTabs.selectedBorderColor
            : gdevelopTheme.closableTabs.backgroundColor,
          backgroundColor: !active
            ? gdevelopTheme.closableTabs.backgroundColor
            : gdevelopTheme.closableTabs.selectedBackgroundColor,
        }}
        // A tab lives in the top bar, which has the ability to drag the app window.
        // Ensure the tab does not have this ability, as it can be dragged itself.
        className={WINDOW_NON_DRAGGABLE_PART_CLASS_NAME}
        onMouseEnter={() => onHover(true, { isLabelTruncated })}
        onMouseLeave={() => onHover(false, { isLabelTruncated })}
      >
        <ButtonBase
          onClick={onClick}
          onAuxClick={closable ? closeOnMiddleClick : undefined}
          onContextMenu={openContextMenu}
          data-active={active ? 'true' : undefined}
          id={id ? `${id}-button` : undefined}
          {...dataObjectToProps(data)}
          {...longTouchForContextMenuProps}
          focusRipple
          // If the touch ripple is not disabled, the dragged preview will
          // use the size of the ripple and it will be too big.
          disableTouchRipple
        >
          <span
            style={{
              ...styles.tabLabelAndIcon,
              height: gdevelopTheme.closableTabs.height,
              color: textColor,
              fontFamily: gdevelopTheme.closableTabs.fontFamily,
            }}
          >
            {icon || renderCustomIcon ? (
              <span style={styles.tabIcon}>
                {renderCustomIcon ? renderCustomIcon(brightness) : icon}
              </span>
            ) : null}
            {label && (
              <span
                ref={spanLabelRef}
                style={{
                  ...styles.tabLabel,
                  maxWidth: labelMaxWidth,
                }}
              >
                {label}
              </span>
            )}
          </span>
        </ButtonBase>
        {closable && (
          <ButtonBase
            onClick={onClose}
            onAuxClick={closeOnMiddleClick}
            onContextMenu={openContextMenu}
            {...longTouchForContextMenuProps}
            focusRipple
          >
            <Cross
              style={{
                ...styles.closeButton,
                width: gdevelopTheme.closableTabs.height / 2,
                height: gdevelopTheme.closableTabs.height,
              }}
              htmlColor={textColor}
            />
          </ButtonBase>
        )}
      </span>
      <ContextMenu
        ref={contextMenu}
        buildMenuTemplate={(i18n: I18nType): Array<MenuItemTemplate> => [
          {
            label: i18n._(t`Close`),
            click: onClose,
            enabled: closable,
          },
          {
            label: i18n._(t`Close others`),
            click: onCloseOthers,
          },
          {
            label: i18n._(t`Close all`),
            click: onCloseAll,
          },
          ...(onPopOut
            ? ([
                { type: 'separator' },
                {
                  label: i18n._(t`Pop out in a separate window (beta)`),
                  click: onPopOut,
                  enabled: closable && popOutEnabled,
                },
              ] as Array<MenuItemTemplate>)
            : []),
        ]}
      />
    </React.Fragment>
  );
}
