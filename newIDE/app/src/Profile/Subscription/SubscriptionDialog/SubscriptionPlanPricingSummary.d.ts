import * as React from 'react';
import type {
  SubscriptionPlanWithPricingSystems,
  SubscriptionPlanPricingSystem,
  PricingSystemDiscount,
} from '../../../Utils/GDevelopServices/Usage';

export type Props = {
  subscriptionPlanWithPricingSystems: SubscriptionPlanWithPricingSystems;
  disabled?: boolean;
  onClickChoosePlan: (
    pricingSystem: SubscriptionPlanPricingSystem | null
  ) => Promise<void>;
  seatsCount: number;
  setSeatsCount: (seatsCount: number) => void;
  period: 'year' | 'month';
  setPeriod: (period: 'year' | 'month') => void;
  onlyShowDiscountedPrice?: boolean;
  pricingSystemDiscounts?: {
    [pricingSystemId: string]: PricingSystemDiscount;
  };
};

declare const SubscriptionPlanPricingSummary: React.ComponentType<Props>;
export default SubscriptionPlanPricingSummary;
