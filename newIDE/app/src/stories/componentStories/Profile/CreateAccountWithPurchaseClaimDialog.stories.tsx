import * as React from 'react';
import { action } from '@storybook/addon-actions';
import paperDecorator from '../../PaperDecorator';
import CreateAccountWithPurchaseClaimDialog from '../../../Profile/CreateAccountWithPurchaseClaimDialog';
import { fakeBundleListingData } from '../../../fixtures/GDevelopServicesTestData';
import { type ClaimedProductOptions } from '../../../Profile/PurchaseClaimDialog';

export default {
  title: 'Profile/CreateAccountWithPurchaseClaimDialog',
  component: CreateAccountWithPurchaseClaimDialog,
  decorators: [paperDecorator],
};

const claimedProductOptions: ClaimedProductOptions = {
  productListingData: fakeBundleListingData,
  purchaseId: 'purchase-123',
  claimableToken: 'token-123',
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
  claimedProductOptions,
};

export const Default = (): React.ReactNode => (
  <CreateAccountWithPurchaseClaimDialog {...defaultProps} />
);

export const PasswordErrorFromBackend = (): React.ReactNode => (
  <CreateAccountWithPurchaseClaimDialog
    {...defaultProps}
    error={{ code: 'auth/weak-password' }}
  />
);

export const EmailErrorFromBackend = (): React.ReactNode => (
  <CreateAccountWithPurchaseClaimDialog
    {...defaultProps}
    error={{ code: 'auth/invalid-email' }}
  />
);

export const AccountExists = (): React.ReactNode => (
  <CreateAccountWithPurchaseClaimDialog
    {...defaultProps}
    error={{ code: 'auth/account-exists-with-different-credential' }}
  />
);

export const Submitting = (): React.ReactNode => (
  <CreateAccountWithPurchaseClaimDialog
    {...defaultProps}
    createAccountInProgress
  />
);
