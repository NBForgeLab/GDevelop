import React from 'react';
import { type Decorator } from '@storybook/react';
import AlertProvider from '../UI/Alert/AlertProvider';

const alertDecorator: Decorator = (Story, context) => (
  <AlertProvider>
    <Story />
  </AlertProvider>
);

export default alertDecorator;
