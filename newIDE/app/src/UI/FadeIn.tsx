import * as React from 'react';

const styles = {
  container: {
    display: 'contents',
    // The `fade-in` keyframes are global (see Theme/Global/Animation.css).
    animation: 'fade-in 150ms ease-in',
  },
};

export interface FadeInProps {
  children: React.ReactNode;
}

/**
 * Quickly fade in its children when they are mounted: for an element
 * appearing in an existing layout (like a button shown in a toolbar) to
 * appear smoothly rather than popping in.
 */
const FadeIn: React.FC<FadeInProps> = ({ children }: FadeInProps) => (
  <div style={styles.container}>{children}</div>
);

export default FadeIn;
