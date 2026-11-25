import * as React from 'react';
import { type I18n as I18nType } from '@lingui/core';
import {
  type Subscription,
  type SubscriptionPlanPricingSystem,
  type SubscriptionPlanWithPricingSystems,
} from '../../Utils/GDevelopServices/Usage';

export declare const getSubscriptionPlanToUpsell: (options: {
  subscription: Subscription | null | undefined;
  subscriptionPlansWithPricingSystems:
    | Array<SubscriptionPlanWithPricingSystems>
    | null
    | undefined;
}) => SubscriptionPlanWithPricingSystems | null | undefined;

export declare const renderTextWithEmphasis: (
  text: string,
  emphasisColor?: string
) => React.ReactNode;

export declare const formatMonthlyEquivalentPrice: (
  yearlyPricingSystem: SubscriptionPlanPricingSystem
) => string;

export declare const getYearlyDiscountPercentage: (
  monthlyPricingSystem: SubscriptionPlanPricingSystem,
  yearlyPricingSystem: SubscriptionPlanPricingSystem
) => number | null;

export declare const getYearlyDiscountText: (
  monthlyPricingSystem: SubscriptionPlanPricingSystem,
  yearlyPricingSystem: SubscriptionPlanPricingSystem
) => string | null;

export type PlanPricingSummary = {
  pricingSystemToBuy: SubscriptionPlanPricingSystem | null | undefined;
  monthlyPriceText: string | null | undefined;
  fullMonthlyPriceText: string | null | undefined;
  discountText: string | null | undefined;
  discountPercentage: number | null | undefined;
  isBilledAnnually: boolean;
};

export declare const getPlanPricingSummary: (
  plan: SubscriptionPlanWithPricingSystems
) => PlanPricingSummary;

export declare const getPlanUpsellBulletPoints: (options: {
  i18n: I18nType;
  plan: SubscriptionPlanWithPricingSystems;
  maxCount?: number;
}) => Array<string>;

export declare const getPlanName: (
  i18n: I18nType,
  plan: SubscriptionPlanWithPricingSystems
) => string;
