import * as React from 'react';
import { Spacer, Line, Column, LargeSpacer } from './Grid';
import { useResponsiveWindowSize } from './Responsive/ResponsiveWindowMeasurer';

export interface TextFieldWithButtonLayoutButtonStyles {
  marginTop?: number;
  marginBottom?: number;
  marginLeft?: number;
  marginRight?: number;
  margin?: number;
  flexShrink?: 0;
}

export interface TextFieldWithButtonLayoutProps {
  renderTextField: () => React.ReactNode;
  renderButton: (
    style: TextFieldWithButtonLayoutButtonStyles
  ) => React.ReactNode;
  margin?: 'none' | 'dense';
  noFloatingLabelText?: boolean;
}

const buttonCommonStyles = {
  // Ensure the button is not shrinked, even if the text field
  // (in particular with a long helper text) is large.
  flexShrink: 0 as const,
};

const textFieldWithButtonLayoutStyles = {
  filledTextFieldWithLabelRightButtonMargins: {
    ...buttonCommonStyles,
    marginTop: 15, // Properly align with the text field (only dense "filled" text fields supported)
    marginLeft: 8,
  },
  filledTextFieldWithoutLabelRightButtonMargins: {
    ...buttonCommonStyles,
    marginTop: 6, // Properly align with the text field (only dense "filled" text fields supported)
    marginLeft: 8,
  },
  standardTextFieldWithLabelRightButtonMargins: {
    ...buttonCommonStyles,
    marginTop: 17, // Properly align with the text field (only "standard" text fields with margin "none" supported)
    marginLeft: 8,
  },
  standardTextFieldWithoutLabelRightButtonMargins: {
    ...buttonCommonStyles,
    marginTop: 0, // Properly align with the text field (only "standard" text fields with margin "none" supported)
    marginLeft: 8,
  },
  textFieldOnMobileMargins: {
    ...buttonCommonStyles,
    // Thanks to the ResponsiveLineStackLayout, the text field is full width on mobile and is spaced out already.
    marginTop: 0,
    marginLeft: 0,
  },
};

/**
 * Position a button on the right of a TextField.
 */
export const TextFieldWithButtonLayout: React.FC<
  TextFieldWithButtonLayoutProps
> = ({
  margin,
  noFloatingLabelText,
  renderTextField,
  renderButton,
}: TextFieldWithButtonLayoutProps) => {
  const { isMobile, isLandscape } = useResponsiveWindowSize();
  return (
    <ResponsiveLineStackLayout
      alignItems="flex-start" // Align from the top to stay at the same position when error/multiline
      expand
      noMargin
      noResponsiveLandscape
    >
      {renderTextField()}
      {renderButton(
        isMobile && !isLandscape
          ? textFieldWithButtonLayoutStyles.textFieldOnMobileMargins
          : margin === 'none'
            ? noFloatingLabelText
              ? textFieldWithButtonLayoutStyles.standardTextFieldWithoutLabelRightButtonMargins
              : textFieldWithButtonLayoutStyles.standardTextFieldWithLabelRightButtonMargins
            : noFloatingLabelText
              ? textFieldWithButtonLayoutStyles.filledTextFieldWithoutLabelRightButtonMargins
              : textFieldWithButtonLayoutStyles.filledTextFieldWithLabelRightButtonMargins
      )}
    </ResponsiveLineStackLayout>
  );
};

export interface LineStackLayoutProps {
  id?: string;
  alignItems?: React.CSSProperties['alignItems'];
  justifyContent?: React.CSSProperties['justifyContent'];
  expand?: boolean;
  noMargin?: boolean;
  children: React.ReactNode;
  useLargeSpacer?: boolean;
  overflow?: React.CSSProperties['overflow']; // allows children Text components to use text ellipsis when they are too long
  neverShrink?: boolean;
  useFullHeight?: boolean;
}

export const LineStackLayout: React.FC<LineStackLayoutProps> = ({
  id,
  alignItems,
  justifyContent,
  expand,
  noMargin,
  children,
  useLargeSpacer,
  overflow,
  neverShrink,
  useFullHeight,
}: LineStackLayoutProps) => {
  let isFirstChild = true;
  return (
    <Line
      id={id}
      alignItems={alignItems}
      justifyContent={justifyContent}
      expand={expand}
      noMargin={noMargin}
      overflow={overflow}
      neverShrink={neverShrink}
      useFullHeight={useFullHeight}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;

        const addSpacers = !isFirstChild;
        isFirstChild = false;

        return (
          <React.Fragment>
            {addSpacers && (useLargeSpacer ? <LargeSpacer /> : <Spacer />)}
            {child}
          </React.Fragment>
        );
      })}
    </Line>
  );
};

export interface ResponsiveLineStackLayoutProps {
  id?: string;
  alignItems?: React.CSSProperties['alignItems'];
  justifyContent?: React.CSSProperties['justifyContent'];
  expand?: boolean;
  /** Prefer `noColumnMargin` if needed. */
  noMargin?: boolean;
  /** Remove the margin on the left and right of the column, when the layout is shown as a single column. */
  noColumnMargin?: boolean;
  /** Do not measure window width in case parent component is in smaller component */
  forceMobileLayout?: boolean;
  noOverflowParent?: boolean;
  noResponsiveLandscape?: boolean;
  useLargeSpacer?: boolean;
  children: React.ReactNode;
}

export const ResponsiveLineStackLayout: React.FC<
  ResponsiveLineStackLayoutProps
> = ({
  id,
  alignItems,
  justifyContent,
  expand,
  noMargin,
  noColumnMargin,
  forceMobileLayout,
  noOverflowParent,
  noResponsiveLandscape,
  useLargeSpacer,
  children,
}: ResponsiveLineStackLayoutProps) => {
  const { isMobile, isLandscape } = useResponsiveWindowSize();
  const assumeMobileScreen = forceMobileLayout || isMobile;
  const shouldPreventSwitchingToColumn = noResponsiveLandscape && isLandscape;
  const shouldSwitchToColumn =
    assumeMobileScreen && !shouldPreventSwitchingToColumn;

  return shouldSwitchToColumn ? (
    <ColumnStackLayout
      id={id}
      noMargin={noMargin || noColumnMargin}
      expand
      useLargeSpacer={useLargeSpacer}
      noOverflowParent={noOverflowParent}
    >
      {children}
    </ColumnStackLayout>
  ) : (
    <LineStackLayout
      id={id}
      alignItems={alignItems}
      justifyContent={justifyContent}
      expand={expand}
      noMargin={noMargin}
      useLargeSpacer={useLargeSpacer}
    >
      {children}
    </LineStackLayout>
  );
};

export interface ColumnStackLayoutProps {
  id?: string;
  alignItems?: React.CSSProperties['alignItems'];
  justifyContent?: React.CSSProperties['justifyContent'];
  expand?: boolean;
  noMargin?: boolean;
  children: React.ReactNode;
  noOverflowParent?: boolean;
  useFullHeight?: boolean;
  useLargeSpacer?: boolean;
}

export const ColumnStackLayout: React.FC<ColumnStackLayoutProps> = ({
  id,
  alignItems,
  justifyContent,
  expand,
  noMargin,
  children,
  noOverflowParent,
  useFullHeight,
  useLargeSpacer,
}: ColumnStackLayoutProps) => {
  let isFirstChild = true;
  return (
    <Column
      id={id}
      alignItems={alignItems}
      justifyContent={justifyContent}
      expand={expand}
      noMargin={noMargin}
      noOverflowParent={noOverflowParent}
      useFullHeight={useFullHeight}
    >
      {React.Children.map(children, (child) => {
        if (!child) return null;

        const addSpacers = !isFirstChild;
        isFirstChild = false;

        return (
          <React.Fragment>
            {addSpacers && (useLargeSpacer ? <LargeSpacer /> : <Spacer />)}
            {child}
          </React.Fragment>
        );
      })}
    </Column>
  );
};
