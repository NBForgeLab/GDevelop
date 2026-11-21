import React from 'react';
import IconButton from '../IconButton';
import { getHelpLink } from '../../Utils/HelpLink';
import Window from '../../Utils/Window';
import Help from '../CustomSvgIcons/Help';

export interface HelpIconProps {
  helpPagePath: string | null | undefined;
  disabled?: boolean;
  style?: React.CSSProperties;
  size?: 'small';
}

/**
 * The icon that can be used in any dialog to open a help page
 */
const HelpIcon: React.FC<HelpIconProps> = (
  props: HelpIconProps
): React.ReactElement | null => {
  const { helpPagePath } = props;
  if (!helpPagePath) return null;

  return (
    <IconButton
      onClick={(event: React.MouseEvent) => {
        event.stopPropagation();
        Window.openExternalURL(getHelpLink(helpPagePath));
      }}
      disabled={props.disabled}
      style={props.style}
      size={props.size}
    >
      <Help />
    </IconButton>
  );
};

export default HelpIcon;
