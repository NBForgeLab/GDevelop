import * as React from 'react';
import { action } from '@storybook/addon-actions';

import ProfileDialog from '../../../Profile/ProfileDialog';
import AuthenticatedUserContext from '../../../Profile/AuthenticatedUserContext';
import {
  fakeSilverAuthenticatedUser,
  fakeAuthenticatedStudentFromEducationPlan,
} from '../../../fixtures/GDevelopServicesTestData';
import {
  subscriptionPayments,
  invoiceablePurchases,
  fakeInvoicePdf,
  mockInvoicesApis,
} from './InvoicesApiMocks';

export default {
  title: 'Profile/ProfileDialog',
  component: ProfileDialog,
};

export const Default = (): React.ReactNode => {
  mockInvoicesApis({
    subscriptionPaymentsReply: [200, subscriptionPayments],
    invoiceablePurchasesReply: [200, invoiceablePurchases],
    invoiceReply: [200, fakeInvoicePdf],
  });
  return (
    <AuthenticatedUserContext.Provider value={fakeSilverAuthenticatedUser}>
      <ProfileDialog onClose={() => action('onClose')()} />
    </AuthenticatedUserContext.Provider>
  );
};

export const StudentAccount = (): React.ReactNode => (
  <AuthenticatedUserContext.Provider
    value={fakeAuthenticatedStudentFromEducationPlan}
  >
    <ProfileDialog onClose={() => action('onClose')()} />
  </AuthenticatedUserContext.Provider>
);
