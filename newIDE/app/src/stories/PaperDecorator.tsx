import React from 'react';
import { type Decorator } from '@storybook/react';
import Paper from '../UI/Paper';

const style = {
  padding: 10,
};

export const getPaperDecorator =
  (background: 'medium' | 'dark'): Decorator =>
  (Story, context) => (
    <Paper background={background} style={style}>
      <Story />
    </Paper>
  );

const defaultPaperDecorator: Decorator = getPaperDecorator('dark');

export default defaultPaperDecorator;
