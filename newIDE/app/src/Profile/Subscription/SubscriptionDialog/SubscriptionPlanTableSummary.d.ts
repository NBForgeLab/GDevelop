import * as React from 'react';
import type { SubscriptionPlanWithPricingSystems } from '../../../Utils/GDevelopServices/Usage';

export type Props = {
  subscriptionPlanWithPricingSystems: SubscriptionPlanWithPricingSystems;
  displayedFeatures?: Array<string>;
  hideFullTableLink?: boolean;
  actionLabel?: React.ReactNode;
  nextSubscriptionPlanWithPricingSystems?:
    | SubscriptionPlanWithPricingSystems
    | null
    | undefined;
};

declare const SubscriptionPlanTableSummary: React.ComponentType<Props>;
export default SubscriptionPlanTableSummary;
