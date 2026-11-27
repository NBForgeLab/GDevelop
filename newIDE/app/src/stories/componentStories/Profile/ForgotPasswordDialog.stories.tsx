import * as React from 'react';
import { action } from '@storybook/addon-actions';
import paperDecorator from '../../PaperDecorator';
import ForgotPasswordDialog from '../../../Profile/ForgotPasswordDialog';

export default {
  title: 'Profile/ForgotPasswordDialog',
  component: ForgotPasswordDialog,
  decorators: [paperDecorator],
};

export const Default = (): React.ReactNode => (
  <ForgotPasswordDialog
    onClose={() => action('onClose')()}
    onForgotPassword={async () => {
      action('onForgotPassword')();
    }}
  />
);
