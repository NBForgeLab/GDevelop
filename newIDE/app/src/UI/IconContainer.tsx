import * as React from 'react';
import { CorsAwareImage } from './CorsAwareImage';

export const iconWithBackgroundStyle: React.CSSProperties = {
  background: 'linear-gradient(45deg, #FFFFFF33, #FFFFFF)',
  borderRadius: 4,
};

const styles: {
  iconBackground: React.CSSProperties;
  icon: React.CSSProperties;
} = {
  iconBackground: {
    display: 'inline',
    textAlign: 'center',
  },
  icon: iconWithBackgroundStyle,
};

type Props = {
  src: string;
  alt: string;
  size: number;
};

/**
 * Display the specified icon with a background so that it's suitable
 * for display anywhere with a consistent style.
 */
export const IconContainer = ({
  src,
  alt,
  size,
}: Props): React.ReactElement<any> => {
  const padding = size > 24 ? 4 : 2;
  return (
    <span style={styles.iconBackground}>
      <CorsAwareImage
        style={{
          ...styles.icon,
          padding,
          width: size - 2 * padding,
          height: size - 2 * padding,
        }}
        src={src}
        alt={alt}
      />
    </span>
  );
};
