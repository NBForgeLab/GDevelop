import * as React from 'react';
import { action } from '@storybook/addon-actions';
import paperDecorator from '../../PaperDecorator';
import ChangeEmailDialog from '../../../Profile/ChangeEmailDialog';

export default {
  title: 'Profile/ChangeEmailDialog',
  component: ChangeEmailDialog,
  decorators: [paperDecorator],
};

const defaultProps = {
  firebaseUser: {
    uid: 'id',
    email: 'email',
  } as any,
  onClose: () => action('onClose')(),
  changeEmailInProgress: false,
  onChangeEmail: async (...args: any[]) => {
    action('onChangeEmail')(...args);
  },
  error: null as any,
};
export const Default = (): React.ReactNode => (
  <ChangeEmailDialog {...defaultProps} />
);

export const ErrorFromBackend = (): React.ReactNode => (
  <ChangeEmailDialog
    {...defaultProps}
    error={{ code: 'auth/requires-recent-login' }}
  />
);

export const Submitting = (): React.ReactNode => (
  <ChangeEmailDialog {...defaultProps} changeEmailInProgress />
);
