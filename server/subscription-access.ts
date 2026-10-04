import { canUseCachedGooglePlayEntitlement, subscriptionPlanForProductId } from "./google-play-entitlement";

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
}

export function paidSubscriptionTier(user: SubscriptionAccount, now = new Date()): string {
  if (user.accountType === "admin") return "admin";
  const expiry = user.subscriptionExpiresAt instanceof Date
    ? user.subscriptionExpiresAt
    : user.subscriptionExpiresAt ? new Date(user.subscriptionExpiresAt) : null;
  const unexpired = expiry !== null && Number.isFinite(expiry.getTime()) && expiry > now;
  const status = user.subscriptionStatus ?? "";
  if (user.subscriptionPlatform === "google_play" || user.subscriptionPlatform === "app_store") {
    const plan = subscriptionPlanForProductId(user.subscriptionProductId ?? user.googlePlayProductId);
    if (!plan || !unexpired || !["active", "cancelled", "in_grace_period"].includes(status)) return "free";
    if (user.subscriptionPlatform === "google_play") {
      if (!canUseCachedGooglePlayEntitlement(user, now)) return "free";
    } else if (!user.appleOriginalTransactionId || !user.subscriptionVerifiedAt) {
      return "free";
    }
    return plan.planType;
  }
  if (!user.stripeSubscriptionId || (expiry && !unexpired)) return "free";
  if (status === "trialing" && !unexpired) return "free";
  if (status !== "active" && status !== "trialing" && !(status === "cancelled" && unexpired)) return "free";
  return ["basic", "premium", "family"].includes(user.subscriptionTier ?? "") ? user.subscriptionTier! : "free";
}

export function requiredSubscriptionTierForPath(path: string): "premium" | "family" | null {
  if (/^\/family-members(?:\/|$)/.test(path)) return "family";
  if (/^\/(?:meal-plans|shopping-lists|grocery-stores|medications|refill-orders|academic-classes|assignments|study-sessions|study-groups|campus-locations|campus-transport|class-schedules)(?:\/|$)/.test(path)) return "premium";
  return null;
}

/** Read the account record, never trust a session's selected or stale plan. */
export function createSubscriptionFeatureGuard(
  getUser: (id: number) => Promise<SubscriptionAccount | undefined>,
) {
  return async (req: any, res: any, next: any) => {
    const required = requiredSubscriptionTierForPath(req.path);
    if (!required) return next();
    if (!req.session?.userId) return res.status(401).json({ message: "Authentication required" });
    try {
      const user = await getUser(req.session.userId);
      if (!user) return res.status(401).json({ message: "Please sign in again." });
      const tier = paidSubscriptionTier(user);
      if (tier === "admin" || tier === "family" || (required === "premium" && tier === "premium")) {
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