import * as React from 'react';
import type { SubscriptionPlanWithPricingSystems } from '../../Utils/GDevelopServices/Usage';

export type SubscriptionState = {
  getSubscriptionPlansWithPricingSystems: () => Array<SubscriptionPlanWithPricingSystems> | null;
  getUserSubscriptionPlanEvenIfLegacy: () => SubscriptionPlanWithPricingSystems | null;
  openSubscriptionDialog: (options: {
    analyticsMetadata: {
      reason: string;
      recommendedPlanId?: string;
      placementId: string;
      preStep?: 'subscriptionChecker';
      dialogVariant?: string;
      featuredPlanId?: string;
    };
    [key: string]: any;
  }) => void;
  getCouponCode: () => string | null;
  clearCouponCode: () => void;
  openRedeemCodeDialog: () => void;
  isSubscriptionDialogOpen: boolean;
  [key: string]: any;
};

export declare const SubscriptionContext: React.Context<SubscriptionState>;
