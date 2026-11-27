import * as React from 'react';
import { action } from '@storybook/addon-actions';

import paperDecorator from '../../PaperDecorator';
import EmailVerificationDialog from '../../../Profile/EmailVerificationDialog';
import {
  fakeSilverAuthenticatedUser,
  fakeAuthenticatedUserWithEmailVerified,
} from '../../../fixtures/GDevelopServicesTestData';

export default {
  title: 'Profile/EmailVerificationDialog',
  component: EmailVerificationDialog,
  decorators: [paperDecorator],
};

export const EmailAlreadySentNoButton = (): React.ReactNode => (
  <EmailVerificationDialog
    onClose={action('onClose')}
    authenticatedUser={fakeSilverAuthenticatedUser}
    onSendEmail={async () => {
      action('onSendEmail')();
    }}
    sendEmailAutomatically={false}
    showSendEmailButton={false}
  />
);

export const EmailAlreadySentWithButton = (): React.ReactNode => (
  <EmailVerificationDialog
    onClose={action('onClose')}
    authenticatedUser={fakeSilverAuthenticatedUser}
    onSendEmail={async () => {
      action('onSendEmail')();
    }}
    sendEmailAutomatically={false}
    showSendEmailButton
  />
);

export const SendEmailOnOpeningNoButton = (): React.ReactNode => (
  <EmailVerificationDialog
    onClose={action('onClose')}
    authenticatedUser={fakeSilverAuthenticatedUser}
    onSendEmail={async () => {
      action('onSendEmail')();
    }}
    sendEmailAutomatically
    showSendEmailButton={false}
  />
);

export const VerifiedUser = (): React.ReactNode => (
  <EmailVerificationDialog
    onClose={action('onClose')}
    authenticatedUser={fakeAuthenticatedUserWithEmailVerified}
    onSendEmail={async () => {
      action('onSendEmail')();
    }}
    sendEmailAutomatically
    showSendEmailButton
  />
);
