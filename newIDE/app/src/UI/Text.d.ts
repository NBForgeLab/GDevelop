import * as React from 'react';

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
  children?: React.ReactNode;
  size?: TextSize;
  color?: TextColor;
  align?: 'inherit' | 'left' | 'center' | 'right' | 'justify';
  noShrink?: boolean;
  noMargin?: boolean;
  allowSelection?: boolean;
  allowBrowserAutoTranslate?: boolean;
  displayInlineAsSpan?: boolean;
  displayAsListItem?: boolean;
  displayAsBlockContainer?: boolean;
  hidden?: boolean;
  style?: React.CSSProperties;
  tooltip?: string;
}

declare const Text: React.FC<TextProps>;
export default Text;
