import * as React from 'react';

type Props = {
  url: string;
  style?: React.CSSProperties | Record<string, any>;
  alt: string;
  onError?: () => void;
  onLoad?: (e: any) => void;
  hideLoader?: boolean;
};

declare const AuthorizedAssetImage: React.ComponentType<Props>;

export default AuthorizedAssetImage;
