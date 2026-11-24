import * as React from 'react';
import Typography from '@material-ui/core/Typography';

export type TextSize =
  | 'bold-title'
  | 'title'
  | 'section-title'
  | 'block-title'
  | 'sub-title'
  | 'body'
  | 'body2'
  | 'body-small';
export type TextColor = 'error' | 'primary' | 'secondary' | 'inherit';

export interface TextProps {
  /** The text to display. */
  children?: React.ReactNode;
  /** Size of the text. `body` if not specified. */
  size?: TextSize;
  /** Color of the text */
  color?: TextColor;
  /** The text alignment. */
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
  /** Don't shrink the text if there is not enough place in a flex container. */
  noShrink?: boolean;
  /** Remove the margin around the text. */
  noMargin?: boolean;
  /** Allow user to select content */
  allowSelection?: boolean;
  /** When false, prevents browser auto translate features to translate the content (useful for user input, like a username) */
  allowBrowserAutoTranslate?: boolean;
  /** By default the text is a paragraph (`p`). It can be shown inline  */
  displayInlineAsSpan?: boolean;
  /** To use list item */
  displayAsListItem?: boolean;
  /** To use a `div`, when the content has paragraphs (like a `MarkdownText`), which can't be inside a `p`. */
  displayAsBlockContainer?: boolean;
  /** Hide the text - but keep its layouting on screen. Perfect for avoiding layout shift while loading content. */
  hidden?: boolean;
  style?: React.CSSProperties;
  tooltip?: string;
}

const getVariantFromSize = (size: TextSize | null | undefined) => {
  switch (size) {
    case 'bold-title':
      return 'h1';
    case 'title':
      return 'h2';
    case 'section-title':
      return 'h3';
    case 'block-title':
      return 'h4';
    case 'sub-title':
      return 'h5';
    case 'body2':
      return 'body2';
    case 'body-small':
      return 'caption';
    case 'body':
    default:
      return 'body1';
  }
};

const getTextColorFromColor = (color: TextColor | null | undefined) => {
  switch (color) {
    case 'error':
      return 'error';
    case 'primary':
      return 'textPrimary';
    case 'secondary':
      return 'textSecondary';
    case 'inherit':
      return 'inherit';
    default:
      return 'textPrimary';
  }
};

// A Text to be displayed in the app. Prefer using this
// than a `<p>`/`<span>` or `<div>` as this will help maintain
// consistency of text in the whole app.
const Text = React.forwardRef<HTMLElement, TextProps>(
  (
    {
      children,
      style,
      size,
      color,
      align,
      noShrink,
      noMargin,
      allowSelection,
      allowBrowserAutoTranslate = true,
      displayInlineAsSpan,
      displayAsListItem,
      displayAsBlockContainer,
      tooltip,
      hidden,
      ...otherProps // Used by possible parent element (such as Tooltip) to pass down props.
    },
    ref
  ) => (
    <Typography
      variant={getVariantFromSize(size)}
      ref={ref as React.Ref<HTMLSpanElement>}
      translate={allowBrowserAutoTranslate ? undefined : 'no'}
      color={getTextColorFromColor(color)}
      component={
        (displayInlineAsSpan
          ? 'span'
          : displayAsListItem
            ? 'li'
            : displayAsBlockContainer
              ? 'div'
              : undefined) as React.ElementType
      }
      title={tooltip}
      style={{
        ...style,
        display: displayInlineAsSpan
          ? 'inline-block'
          : displayAsListItem
            ? 'list-item'
            : undefined,
        flexShrink: noShrink ? 0 : undefined,
        marginTop: noMargin ? 0 : 6,
        marginBottom: noMargin ? 0 : 6,
        userSelect: allowSelection ? 'text' : undefined,
        cursor: allowSelection ? 'text' : undefined,
        visibility: hidden ? 'hidden' : undefined,
      }}
      align={align || 'inherit'}
      {...otherProps}
    >
      {children}
    </Typography>
  )
);

export default Text;
