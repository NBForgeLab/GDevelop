import * as React from 'react';
import type {
  SubscriptionPlanWithPricingSystems,
  SubscriptionPlanPricingSystem,
} from '../../Utils/GDevelopServices/Usage';

export declare const formatPriceWithCurrency: (
  amountInCents: number,
  currency: string
) => string;

export declare const getPlanPrice: (
  pricingSystem: SubscriptionPlanPricingSystem
) => React.ReactNode;

export declare const getPlanInferredNameFromId: (planId: string) => string;

export declare const planIdSortingFunction: (
  planIdA: string,
  planIdB: string
) => number;

export declare const getPlanIcon: (options: {
  planId: string;
  logoSize: number;
}) => React.ReactNode;

export type Props = {
  subscriptionPlanWithPricingSystems: SubscriptionPlanWithPricingSystems;
  subscriptionPricingSystem: SubscriptionPlanPricingSystem | null | undefined;
  cancelAtPeriodEnd?: boolean;
  redemptionCodeExpirationDate?: number | null | undefined;
  isHighlighted: boolean;
  actions?: React.ReactNode;
  isPending?: boolean;
  hidePrice?: boolean;
  background: 'medium' | 'dark';
};

declare const PlanSmallCard: React.ComponentType<Props>;
export default PlanSmallCard;
