import * as React from 'react';
import BackgroundText from './BackgroundText';

const styles = {
  containerStyle: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    padding: 10,
  },
};

export interface EmptyMessageProps {
  style?: React.CSSProperties;
  messageStyle?: React.CSSProperties;
  children?: React.ReactNode;
}

/**
 * Show a message when there is no content to display.
 * Also take a look at EmptyPlaceholder for a more visible placeholder.
 */
const EmptyMessage: React.FC<EmptyMessageProps> = (
  props: EmptyMessageProps
) => (
  <div style={{ ...styles.containerStyle, ...props.style }}>
    <BackgroundText style={props.messageStyle}>{props.children}</BackgroundText>
  </div>
);

export default EmptyMessage;
