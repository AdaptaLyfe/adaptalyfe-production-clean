export interface GooglePlaySubscriptionSnapshot {
  subscriptionState?: unknown;
  lineItems?: unknown;
}

export interface GooglePlayEntitlement {
  status: "active" | "inactive";
  tier: "basic" | "premium" | "family" | "free";
  productId: string | null;
  expiresAt: Date | null;
}

interface GooglePlayLineItem {
  productId?: unknown;
  expiryTime?: unknown;
}

const GOOGLE_PLAY_PRODUCT_TIERS: Record<
  string,
  GooglePlayEntitlement["tier"]
> = {
  adaptalyfe_basic_monthly: "basic",
  adaptalyfe_premium_monthly: "premium",
  adaptalyfe_family_monthly: "family",
};

export function googlePlayTierForProductId(
  productId: string | null | undefined,
): GooglePlayEntitlement["tier"] | null {
  if (!productId) return null;
  return GOOGLE_PLAY_PRODUCT_TIERS[productId] ?? null;
}

export function resolveGooglePlayEntitlement(
  snapshot: GooglePlaySubscriptionSnapshot,
  options: {
    expectedProductId?: string;
    now?: Date;
    forceRevoke?: boolean;
  } = {},
): GooglePlayEntitlement {
  const lineItems = Array.isArray(snapshot.lineItems)
    ? (snapshot.lineItems as GooglePlayLineItem[])
    : [];
  const matchingItem = options.expectedProductId
    ? lineItems.find((item) => item.productId === options.expectedProductId)
    : undefined;
  const lineItem = matchingItem ?? lineItems[0];
  const productId =
    typeof lineItem?.productId === "string"
      ? lineItem.productId
      : options.expectedProductId ?? null;
  const tier = googlePlayTierForProductId(productId);
  const rawExpiry = lineItem?.expiryTime;
  const parsedExpiry =
    typeof rawExpiry === "string" ? new Date(rawExpiry) : null;
  const expiresAt =
    parsedExpiry && Number.isFinite(parsedExpiry.getTime())
      ? parsedExpiry
      : null;
  const now = options.now ?? new Date();
  const state =
    typeof snapshot.subscriptionState === "string"
      ? snapshot.subscriptionState
      : "";
  const accessState =
    state === "SUBSCRIPTION_STATE_ACTIVE" ||
    state === "SUBSCRIPTION_STATE_IN_GRACE_PERIOD" ||
    state === "SUBSCRIPTION_STATE_CANCELED";
  const hasNotExpired = expiresAt !== null && expiresAt.getTime() > now.getTime();
  const entitled =
    !options.forceRevoke && Boolean(tier && accessState && hasNotExpired);

  return {
    status: entitled ? "active" : "inactive",
    tier: entitled ? tier! : "free",
    productId,
    expiresAt,
  };
}