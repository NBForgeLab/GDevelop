import * as React from 'react';
import {
  type SubscriptionDialogDisplayReason,
  type SubscriptionPlacementId,
} from '../../Utils/Analytics/EventSender';

type Props = {
  children: React.ReactNode;
  subscriptionDialogOpeningReason: SubscriptionDialogDisplayReason;
  label?: React.ReactNode;
  hideButton?: boolean;
  payWithCreditsOptions?: {
    label: React.ReactNode;
    onPayWithCredits: () => void;
  };
  onUpgrade?: () => void;
  forceColumnLayout?: boolean;
  filter?: 'individual' | 'team' | 'education';
  recommendedPlanId?:
    | 'gdevelop_silver'
    | 'gdevelop_gold'
    | 'gdevelop_startup'
    | 'gdevelop_education';
  canHide?: boolean;
  placementId: SubscriptionPlacementId;
};

declare const GetSubscriptionCard: React.ComponentType<Props>;

export default GetSubscriptionCard;
