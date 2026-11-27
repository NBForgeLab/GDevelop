import * as React from 'react';
import { action } from '@storybook/addon-actions';
import paperDecorator from '../../PaperDecorator';
import LoginWithPurchaseClaimDialog from '../../../Profile/LoginWithPurchaseClaimDialog';
import { fakeBundleListingData } from '../../../fixtures/GDevelopServicesTestData';
import { type ClaimedProductOptions } from '../../../Profile/PurchaseClaimDialog';

export default {
  title: 'Profile/LoginWithPurchaseClaimDialog',
  component: LoginWithPurchaseClaimDialog,
  decorators: [paperDecorator],
};

const claimedProductOptions: ClaimedProductOptions = {
  productListingData: fakeBundleListingData,
  purchaseId: 'purchase-123',
  claimableToken: 'token-123',
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
  claimedProductOptions,
};

export const Default = (): React.ReactNode => (
  <LoginWithPurchaseClaimDialog {...defaultProps} />
);

export const WeakPasswordErrorFromBackend = (): React.ReactNode => (
  <LoginWithPurchaseClaimDialog
    {...defaultProps}
    error={{
      code: 'auth/weak-password',
    }}
  />
);

export const InvalidEmailErrorFromBackend = (): React.ReactNode => (
  <LoginWithPurchaseClaimDialog
    {...defaultProps}
    error={{
      code: 'auth/invalid-email',
    }}
  />
);

export const AccountExistsWithDifferentCredentialErrorFromBackend =
  (): React.ReactNode => (
    <LoginWithPurchaseClaimDialog
      {...defaultProps}
      error={{
        code: 'auth/account-exists-with-different-credential',
      }}
    />
  );

export const Submitting = (): React.ReactNode => (
  <LoginWithPurchaseClaimDialog {...defaultProps} loginInProgress />
);
