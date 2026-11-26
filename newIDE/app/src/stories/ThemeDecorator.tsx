import React from 'react';
import { type Decorator } from '@storybook/react';
import { FullThemeProvider } from '../UI/Theme/FullThemeProvider';

const themeDecorator: Decorator = (Story, context) => {
  return (
    <FullThemeProvider forcedThemeName={context.globals.themeName}>
      <Story />
    </FullThemeProvider>
  );
};

export default themeDecorator;
