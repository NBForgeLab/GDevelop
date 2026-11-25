import * as React from 'react';
import { type SubscriptionPlacementId } from '../../Utils/Analytics/EventSender';

export type SubscriptionCheckerInterface = {
  checkUserHasSubscription: () => boolean;
  hasUserSubscription: () => boolean;
};

type Props = {
  title: React.ReactNode;
  id:
    | 'Disable GDevelop splash at startup'
    | 'Debugger'
    | 'Hot reloading'
    | 'Preview over wifi';
  placementId: SubscriptionPlacementId;
  onChangeSubscription?: () => Promise<void> | void;
  mode: 'try' | 'mandatory';
  isNotShownDuringInAppTutorial?: boolean;
};

declare const SubscriptionChecker: React.ForwardRefExoticComponent<
  Props & React.RefAttributes<SubscriptionCheckerInterface>
>;

export default SubscriptionChecker;
