import { FREE_TRIAL_DAYS } from "@shared/subscription";

import {
  subscriptionPlanForProductId,
} from "./google-play-entitlement";
import { paidSubscriptionTier, type SubscriptionAccount } from "./subscription-access";

type DateInput = Date | string | null | undefined;

export interface SubscriptionResponseUser extends SubscriptionAccount {
  id: number;
  createdAt?: DateInput;
  subscriptionStartDate?: DateInput;
  subscriptionExpiresAt?: DateInput;
  subscriptionAutoRenew?: boolean | null;
}

function validDate(value: DateInput): Date | null {
  if (value instanceof Date) {
    return Number.isFinite(value.getTime()) ? value : null;
  }
  if (typeof value !== "string") return null;
  const parsed = new Date(value);
  return Number.isFinite(parsed.getTime()) ? parsed : null;
}

/**
 * Shapes the account's canonical subscription response without masking
 * provider lifecycle states such as pending, on-hold, or expired.
 */
export function buildSubscriptionResponse(
  user: SubscriptionResponseUser,
  now = new Date(),
) {
  const createdAt = validDate(user.createdAt);
  const trialEndDate = createdAt ? new Date(createdAt) : null;
  trialEndDate?.setDate(trialEndDate.getDate() + FREE_TRIAL_DAYS);
  const trialDaysLeft =
    trialEndDate && trialEndDate.getTime() > now.getTime()
      ? Math.ceil(
          (trialEndDate.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
        )
      : 0;

  const isStoreSubscription =
    user.subscriptionPlatform === "google_play" ||
    user.subscriptionPlatform === "app_store";
  const verifiedPaidTier = paidSubscriptionTier(user, now);
  const isActiveSubscription =
    verifiedPaidTier !== "free" && user.subscriptionStatus !== "trialing";
  const hasVerifiedPaidTrial =
    !isStoreSubscription &&
    verifiedPaidTier !== "free" &&
    user.subscriptionStatus === "trialing";
  const hasTrialAccess =
    !isStoreSubscription && (hasVerifiedPaidTrial || trialDaysLeft > 0);
  const isAccountTrial = hasTrialAccess && verifiedPaidTier === "free";

  const storeProduct = isStoreSubscription
    ? subscriptionPlanForProductId(
        user.googlePlayProductId ?? user.subscriptionProductId,
      )
    : null;
  const displayPlan =
    verifiedPaidTier !== "free"
      ? verifiedPaidTier
      : isAccountTrial
        ? "basic"
        : storeProduct?.planType ?? "free";
  const featurePlan =
    verifiedPaidTier !== "free" ? verifiedPaidTier : isAccountTrial ? "basic" : "free";
  const isPremiumPlan =
    featurePlan === "premium" || featurePlan === "family";
  const isFamilyPlan = featurePlan === "family";

  const status = isStoreSubscription
    ? user.subscriptionStatus ?? "inactive"
    : isActiveSubscription
      ? user.subscriptionStatus ?? "active"
      : hasTrialAccess
        ? "trialing"
        : "expired";

  const paidExpiry = validDate(user.subscriptionExpiresAt);
  const paidStart = validDate(user.subscriptionStartDate);

  return {
    id: user.id,
    planType: displayPlan,
    status,
    billingCycle: "monthly",
    subscriptionPlatform: user.subscriptionPlatform || null,
    isAccountTrial,
    currentPeriodStart: paidStart ?? createdAt,
    currentPeriodEnd: isStoreSubscription
      ? paidExpiry
      : verifiedPaidTier !== "free"
        ? paidExpiry
        : isAccountTrial
          ? trialEndDate
          : null,
    trialDaysLeft:
      isAccountTrial && trialDaysLeft > 0 ? trialDaysLeft : null,
    autoRenew: user.subscriptionAutoRenew ?? null,
    usageStats: {
      tasks: {
        count: 0,
        limit: isFamilyPlan
          ? null
          : featurePlan === "premium"
            ? 1000
            : 50,
      },
      caregivers: {
        count: 0,
        limit: isFamilyPlan || featurePlan === "premium" ? 5 : 1,
      },
      dataExports: { count: 0, limit: featurePlan === "free" ? 0 : null },
    },
    features: {
      taskManagement: featurePlan !== "free" || hasTrialAccess,
      moodTracking: featurePlan !== "free" || hasTrialAccess,
      financialTracking: featurePlan !== "free" || hasTrialAccess,
      basicReminders: featurePlan !== "free" || hasTrialAccess,
      wearableDevices: isPremiumPlan,
      mealPlanning: isPremiumPlan,
      medicationManagement: isPremiumPlan,
      advancedAnalytics: isPremiumPlan,
      voiceCommands: isPremiumPlan,
      academicPlanner: isPremiumPlan,
      prioritySupport: isPremiumPlan,
      locationSafety: isFamilyPlan,
      familyDashboard: isFamilyPlan,
      multiUserAccounts: isFamilyPlan,
      emergencyProtocols: isFamilyPlan,
      customReporting: isFamilyPlan,
      unlimitedCaregivers: isFamilyPlan,
    },
  };
}