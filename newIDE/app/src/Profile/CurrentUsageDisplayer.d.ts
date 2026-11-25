import * as React from 'react';
import {
  type Quota,
  type Subscription,
  type UsagePrice,
} from '../Utils/GDevelopServices/Usage';

type Props = {
  subscription: Subscription | null | undefined;
  quota: Quota | null | undefined;
  usagePrice: UsagePrice | null | undefined;
  onChangeSubscription: () => void;
  onStartBuildWithCredits: () => void;
  hidePurchaseWithCredits?: boolean;
};

declare const CurrentUsageDisplayer: React.ComponentType<Props>;

export default CurrentUsageDisplayer;
