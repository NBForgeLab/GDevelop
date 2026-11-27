import * as React from 'react';
import { action } from '@storybook/addon-actions';
import paperDecorator from '../../PaperDecorator';
import CreateAccountDialog from '../../../Profile/CreateAccountDialog';

export default {
  title: 'Profile/CreateAccountDialog',
  component: CreateAccountDialog,
  decorators: [paperDecorator],
};

const defaultProps = {
  onClose: () => action('onClose')(),
  onGoToLogin: action('onGoToLogin'),
  onCreateAccount: async (...args: any[]) => {
    action('onCreateAccount')(...args);
  },
  onLoginWithProvider: async (...args: any[]) => {
    action('onLoginWithProvider')(...args);
  },
  createAccountInProgress: false,
  error: null as any,
};
export const Default = (): React.ReactNode => (
  <CreateAccountDialog {...defaultProps} />
);

export const PasswordErrorFromBackend = (): React.ReactNode => (
  <CreateAccountDialog
    {...defaultProps}
    error={{ code: 'auth/weak-password' }}
  />
);

export const EmailErrorFromBackend = (): React.ReactNode => (
  <CreateAccountDialog
    {...defaultProps}
    error={{ code: 'auth/invalid-email' }}
  />
);

export const AccountExists = (): React.ReactNode => (
  <CreateAccountDialog
    {...defaultProps}
    error={{ code: 'auth/account-exists-with-different-credential' }}
  />
);

export const Submitting = (): React.ReactNode => (
  <CreateAccountDialog {...defaultProps} createAccountInProgress />
);
