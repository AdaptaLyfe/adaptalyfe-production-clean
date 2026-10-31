import { canUseCachedGooglePlayEntitlement, subscriptionPlanForProductId } from "./google-play-entitlement";
import { appleSubscriptionPlanForProductId } from "./apple-subscription-entitlement";
import { FREE_TRIAL_DAYS } from "@shared/subscription";

/**
 * Days a website subscriber keeps access after a renewal payment fails, while
 * Stripe retries the card. After this the account is treated as unpaid.
 */
export const PAST_DUE_GRACE_DAYS = 14;
const DAY_MS = 24 * 60 * 60 * 1000;

export interface SubscriptionAccount {
  id?: number;
  accountType?: string | null;
  username?: string;
  subscriptionTier?: string | null;
  subscriptionStatus?: string | null;
  subscriptionPlatform?: string | null;
  subscriptionProductId?: string | null;
  subscriptionExpiresAt?: Date | string | null;
  subscriptionVerifiedAt?: Date | string | null;
  googlePlayProductId?: string | null;
  googlePlayPurchaseToken?: string | null;
  appleOriginalTransactionId?: string | null;
  stripeSubscriptionId?: string | null;
  createdAt?: Date | string | null;
}

export function paidSubscriptionTier(user: SubscriptionAccount, now = new Date()): string {
  if (user.accountType === "admin") return "admin";
  const expiry = user.subscriptionExpiresAt instanceof Date
    ? user.subscriptionExpiresAt
    : user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const unexpired = expiry !== null && Number.isFinite(expiry.getTime()) && expiry > now;
  const status = user.subscriptionStatus ?? "";
  if (user.subscriptionPlatform === "google_play" || user.subscriptionPlatform === "app_store") {
    const productId = user.subscriptionProductId ?? user.googlePlayProductId;
    const plan = user.subscriptionPlatform === "app_store"
      ? appleSubscriptionPlanForProductId(productId)
      : subscriptionPlanForProductId(productId);
    if (!plan || !unexpired || !["active", "cancelled", "in_grace_period"].includes(status)) return "free";
    if (user.subscriptionPlatform === "google_play") {
      if (!canUseCachedGooglePlayEntitlement(user, now)) return "free";
    } else if (!user.appleOriginalTransactionId || !user.subscriptionVerifiedAt) {
      return "free";
    }
    return plan.planType;
  }
  const webTier = ["basic", "premium", "family"].includes(user.subscriptionTier ?? "") ? user.subscriptionTier! : "free";
  if (status === "past_due") {
    // A renewal payment failed and Stripe is retrying the card. Keep access for a
    // grace period after the paid-through date instead of cutting it off at once.
    if (!user.stripeSubscriptionId) return "free";
    if (expiry && expiry.getTime() + PAST_DUE_GRACE_DAYS * DAY_MS <= now.getTime()) return "free";
    return webTier;
  }
  if (!user.stripeSubscriptionId || (expiry && !unexpired)) return "free";
  if (status === "trialing" && !unexpired) return "free";
  if (status !== "active" && status !== "trialing" && !(status === "cancelled" && unexpired)) return "free";
  return webTier;
}

/** True while the account's own 7-day free trial (from sign-up) is still running. */
export function accountTrialActive(user: SubscriptionAccount, now = new Date()): boolean {
  if (user.subscriptionPlatform === "google_play" || user.subscriptionPlatform === "app_store") return false;
  if (!user.createdAt) return true; // unknown sign-up date: never lock the account out
  const created = user.createdAt instanceof Date ? user.createdAt : new Date(user.createdAt);
  if (!Number.isFinite(created.getTime())) return true;
  return created.getTime() + FREE_TRIAL_DAYS * DAY_MS > now.getTime();
}

export type AccessPlan = "admin" | "family" | "premium" | "basic" | "expired";

/** The plan whose features the account can use right now. */
export function accessPlanFor(user: SubscriptionAccount, hasOrgAccess = false, now = new Date()): AccessPlan {
  if (user.accountType === "admin") return "admin";
  if (user.accountType === "caregiver") return "family";
  if (hasOrgAccess) return "family";
  const tier = paidSubscriptionTier(user, now);
  if (tier === "basic" || tier === "premium" || tier === "family") return tier;
  return accountTrialActive(user, now) ? "basic" : "expired";
}

/** Plan limits. null = unlimited. */
export function planLimits(plan: AccessPlan): { tasks: number | null; caregivers: number | null } {
  if (plan === "admin" || plan === "family") return { tasks: null, caregivers: null };
  if (plan === "premium") return { tasks: 1000, caregivers: 5 };
  return { tasks: 50, caregivers: 1 };
}

/**
 * API paths an account can still use after its trial or subscription has ended:
 * signing in and out, its own profile, paying, restoring a purchase, an
 * organization code, and deleting the account.
 */
export function isAllowedWithoutSubscription(path: string): boolean {
  return /^\/(?:user|auth|login|logout|register|subscription|create-subscription|create-payment-intent|confirm-subscription|cancel-subscription|resume-subscription|recover-subscription|upgrade-subscription|stripe|apple|google-play|org-codes|forgot-password|reset-password|password-reset|health|firebase-config|demo-login|invitation|accept-invitation|user-preferences|admin|super-admin|debug)(?:\/|$)/.test(path);
}

export function requiredSubscriptionTierForPath(path: string): "premium" | "family" | null {
  if (/^\/family-members(?:\/|$)/.test(path)) return "family";
  // In-app messaging (user side). Caregiver endpoints live under /caregiver/... and are not matched.
  if (/^\/messages(?:\/|$)/.test(path)) return "family";
  // Skill challenges / milestones and expanded rewards are Premium. /rewards/caregiver (caregiver side) is excluded.
  if (/^\/transition-skills(?:\/|$)/.test(path)) return "premium";
  // AdaptAI chat and the actions it runs are Premium. The daily guide stays on every plan.
  if (/^\/chat(?:\/|$)/.test(path) || /^\/ai\/actions(?:\/|$)/.test(path)) return "premium";
  if (/^\/(?:wearable-devices|health-metrics|activity-sessions)(?:\/|$)/.test(path)) return "premium";
  if (/^\/rewards(?:\/(?!caregiver(?:\/|$))|$)/.test(path)) return "premium";
  if (/^\/(?:allergies|medical-conditions|adverse-medications|personal-documents|meal-plans|shopping-lists|grocery-stores|medications|refill-orders|academic-classes|assignments|study-sessions|study-groups|campus-locations|campus-transport|class-schedules)(?:\/|$)/.test(path)) return "premium";
  return null;
}

// Short-lived cache of "this account may use the app" results, so the expiry
// check doesn't read the database on every request. Only positive results are
// cached; a refused account is always re-read (so paying unlocks it at once).
const allowedUntil = new Map<number, number>();
const ALLOWED_CACHE_MS = 30_000;

/** Forget the cached result for an account (call whenever its plan changes). */
export function forgetSubscriptionAccess(userId: number) {
  allowedUntil.delete(userId);
}

/** Read the account record, never trust a session's selected or stale plan. */
export function createSubscriptionFeatureGuard(
  getUser: (id: number) => Promise<SubscriptionAccount | undefined>,
  hasOrgAccess?: (id: number) => Promise<boolean>,
) {
  return async (req: any, res: any, next: any) => {
    const required = requiredSubscriptionTierForPath(req.path);
    const userId: number | undefined = req.session?.userId;
    if (!required) {
      // Not a paid-feature path: only check that the trial/subscription hasn't ended.
      if (!userId || isAllowedWithoutSubscription(req.path)) return next();
      const cached = allowedUntil.get(userId);
      if (cached && cached > Date.now()) return next();
    }
    if (!userId) return res.status(401).json({ message: "Authentication required" });
    try {
      const user = await getUser(userId);
      if (!user) return res.status(401).json({ message: "Please sign in again." });
      // Caregiver accounts act for the people they support; their access is governed by
      // caregiver permissions, not by a subscription of their own.
      if (user.accountType === "caregiver") return next();
      const tier = paidSubscriptionTier(user);
      const orgAccess = async () => (hasOrgAccess ? await hasOrgAccess(userId).catch(() => false) : false);
      if (!required) {
        if (tier !== "free" || accountTrialActive(user) || (await orgAccess())) {
          allowedUntil.set(userId, Date.now() + ALLOWED_CACHE_MS);
          return next();
        }
        allowedUntil.delete(userId);
        return res.status(402).json({
          message: "Your free trial or subscription has ended. Choose a plan to keep using Adaptalyfe.",
          subscriptionRequired: true,
          expired: true,
        });
      }
      if (tier === "admin" || tier === "family" || (required === "premium" && tier === "premium") || (await orgAccess())) {
        req.session.user = {
          ...req.session.user,
          subscriptionTier: user.subscriptionTier,
          subscriptionStatus: user.subscriptionStatus,
          subscriptionExpiresAt: user.subscriptionExpiresAt,
        };
        return next();
      }
      return res.status(403).json({
        message: `An active ${required === "family" ? "Family" : "Premium or Family"} subscription is required.`,
        requiredPlan: required,
        subscriptionRequired: true,
      });
    } catch {
      return res.status(503).json({ message: "Subscription access could not be checked. Please try again." });
    }
  };
}
