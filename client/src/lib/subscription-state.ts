/**
 * Whether the account has a paid subscription that is active *right now*.
 *
 * The user record keeps subscriptionStatus "active" until Stripe's
 * "subscription ended" webhook arrives. If that webhook is missed, the server's
 * subscription response (which also checks the paid-through date) is the
 * source of truth, so the subscription page never shows "subscribed" to an
 * account whose access has already ended.
 */
export function hasActivePaidSubscription(
  user: { subscriptionStatus?: string | null } | null | undefined,
  subscription: { status?: string | null; isAccountTrial?: boolean | null } | null | undefined,
): boolean {
  // "past_due": a renewal payment failed and Stripe is retrying the card. The
  // subscription is still running (with a payment warning) until the server says otherwise.
  const running = (status?: string | null) => status === "active" || status === "past_due";
  if (!running(user?.subscriptionStatus)) return false;
  if (!subscription) return true; // still loading: trust the account record
  return running(subscription.status) && subscription.isAccountTrial !== true;
}

/** Website subscription that was cancelled but is still running until its end date. */
export function isCancelledButRunning(
  user: { subscriptionStatus?: string | null; subscriptionPlatform?: string | null } | null | undefined,
  subscription: {
    status?: string | null;
    isAccountTrial?: boolean | null;
    autoRenew?: boolean | null;
    subscriptionPlatform?: string | null;
  } | null | undefined,
): boolean {
  const platform = subscription?.subscriptionPlatform ?? user?.subscriptionPlatform ?? "web";
  return hasActivePaidSubscription(user, subscription) && platform === "web" && subscription?.autoRenew === false;
}
