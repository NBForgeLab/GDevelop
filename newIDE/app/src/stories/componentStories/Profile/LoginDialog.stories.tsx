import * as React from 'react';
import { action } from '@storybook/addon-actions';
import paperDecorator from '../../PaperDecorator';
import LoginDialog from '../../../Profile/LoginDialog';

export default {
  title: 'Profile/LoginDialog',
  component: LoginDialog,
  decorators: [paperDecorator],
};

const defaultProps = {
  onClose: action('onClose'),
  onForgotPassword: async (...args: any[]) => {
    action('onForgotPassword')(...args);
  },
  onLogin: async (...args: any[]) => {
    action('onLogin')(...args);
  },
  onLoginWithProvider: async (...args: any[]) => {
    action('onLoginWithProvider')(...args);
  },
  onGoToCreateAccount: action('onGoToCreateAccount'),
  loginInProgress: false,
  error: null as any,
};

export const Default = (): React.ReactNode => <LoginDialog {...defaultProps} />;

export const WeakPasswordErrorFromBackend = (): React.ReactNode => (
  <LoginDialog
    {...defaultProps}
    error={{
      code: 'auth/weak-password',
    }}
  />
);

export const InvalidEmailErrorFromBackend = (): React.ReactNode => (
  <LoginDialog
    {...defaultProps}
    error={{
      code: 'auth/invalid-email',
    }}
  />
);

export const AccountExistsWithDifferentCredentialErrorFromBackend =
  (): React.ReactNode => (
    <LoginDialog
      {...defaultProps}
      error={{
        code: 'auth/account-exists-with-different-credential',
      }}
    />
  );

export const Submitting = (): React.ReactNode => (
  <LoginDialog {...defaultProps} loginInProgress />
);
