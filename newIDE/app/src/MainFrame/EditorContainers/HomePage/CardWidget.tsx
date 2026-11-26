import * as React from 'react';
import ButtonBase from '@material-ui/core/ButtonBase';
import { makeStyles, createStyles, type Theme } from '@material-ui/core/styles';
import { shouldValidate } from '../../../UI/KeyboardShortcuts/InteractionKeys';
import { useResponsiveWindowSize } from '../../../UI/Responsive/ResponsiveWindowMeasurer';

const styles = {
  buttonBase: {
    height: '100%',
    width: '100%',
    borderRadius: 8,
    cursor: 'default',
    overflow: 'hidden',
  },
  contentWrapper: {
    height: '100%',
    width: '100%',
    display: 'flex',
  },
} satisfies Record<string, React.CSSProperties>;

// Styles to give the impression of pressing an element.
const useStylesForWidget = ({
  useDefaultDisabledStyle,
  noBorder,
  disableHoverAndFocusEffects,
}: {
  useDefaultDisabledStyle?: boolean;
  noBorder?: boolean;
  disableHoverAndFocusEffects?: boolean;
}) =>
  makeStyles((theme: Theme) =>
    createStyles({
      root: {
        boxSizing: 'border-box',
        border: !noBorder
          ? `1px solid ${theme.palette.text.secondary}`
          : 'none',
        transition: 'background-color 100ms ease',
        '&:disabled': useDefaultDisabledStyle
          ? {
              opacity: theme.palette.action.disabledOpacity,
            }
          : undefined,
        ...(!disableHoverAndFocusEffects
          ? {
              '&:hover': {
                backgroundColor: theme.palette.action.hover,
              },
              '&:focus': {
                backgroundColor: theme.palette.action.hover,
              },
            }
          : undefined),
      },
    })
  )();

export const LARGE_WIDGET_SIZE = 320;
export const SMALL_WIDGET_SIZE = 200;

type Props = {
  children: React.ReactNode;
  onClick?: () => void;
  size: 'small' | 'large' | 'banner';
  disabled?: boolean;
  useDefaultDisabledStyle?: boolean;
  noBorder?: boolean;
};

export const CardWidget = ({
  children,
  onClick,
  size,
  disabled,
  useDefaultDisabledStyle,
  noBorder,
}: Props): React.ReactNode | React.ReactElement<any> => {
  const classes = useStylesForWidget({
    useDefaultDisabledStyle,
    noBorder,
    disableHoverAndFocusEffects: !onClick,
  });
  const { isMobile } = useResponsiveWindowSize();

  const widgetMaxWidth =
    size === 'banner'
      ? undefined
      : isMobile
        ? undefined
        : size === 'small'
          ? SMALL_WIDGET_SIZE
          : LARGE_WIDGET_SIZE;

  if (!onClick) {
    return (
      <div
        style={{
          ...styles.buttonBase,
          maxWidth: widgetMaxWidth,
        }}
        className={classes.root}
      >
        <div style={styles.contentWrapper}>{children}</div>
      </div>
    );
  }

  return (
    <ButtonBase
      onClick={onClick}
      focusRipple
      style={{
        ...styles.buttonBase,
        maxWidth: widgetMaxWidth,
      }}
      classes={classes}
      tabIndex={0}
      onKeyPress={(event: React.KeyboardEvent<HTMLButtonElement>): void => {
        if (shouldValidate(event)) {
          onClick();
        }
      }}
      disabled={disabled}
    >
      <div style={styles.contentWrapper}>{children}</div>
    </ButtonBase>
  );
};
