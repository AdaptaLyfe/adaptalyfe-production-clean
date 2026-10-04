export interface GooglePlaySubscriptionSnapshot {
  subscriptionState?: unknown;
  lineItems?: unknown;
  startTime?: unknown;
  latestOrderId?: unknown;
}

export interface GooglePlayEntitlement {
  status:
    | "active"
    | "cancelled"
    | "in_grace_period"
    | "pending"
    | "on_hold"
    | "paused"
    | "expired"
    | "revoked"
    | "inactive";
  tier: "basic" | "premium" | "family" | "free";
  productId: string | null;
  expiresAt: Date | null;
  startDate: Date | null;
  transactionId: string | null;
  autoRenew: boolean | null;
  grantsAccess: boolean;
}

interface GooglePlayLineItem {
  productId?: unknown;
  expiryTime?: unknown;
  latestSuccessfulOrderId?: unknown;
  autoRenewingPlan?: {
    autoRenewEnabled?: unknown;
  } | null;
}

export interface StoreSubscriptionPlan {
  planType: "basic" | "premium" | "family";
  billingCycle: "monthly";
  amount: number;
}

const STORE_SUBSCRIPTION_PLANS: Record<string, StoreSubscriptionPlan> = {
  adaptalyfe_basic_monthly: {
    planType: "basic",
    billingCycle: "monthly",
    amount: 499,
  },
  adaptalyfe_premium_monthly: {
    planType: "premium",
    billingCycle: "monthly",
    amount: 1299,
  },
  adaptalyfe_family_monthly: {
    planType: "family",
    billingCycle: "monthly",
    amount: 2499,
  },
};

export function subscriptionPlanForProductId(
  productId: string | null | undefined,
): StoreSubscriptionPlan | null {
  return productId ? STORE_SUBSCRIPTION_PLANS[productId] ?? null : null;
}

export function googlePlayTierForProductId(
  productId: string | null | undefined,
): GooglePlayEntitlement["tier"] | null {
  return subscriptionPlanForProductId(productId)?.planType ?? null;
}

const GOOGLE_PLAY_CACHED_ENTITLEMENT_MAX_AGE_MS = 24 * 60 * 60 * 1000;

export function googlePlayErrorStatus(error: unknown): number | null {
  const value = error as { response?: { status?: unknown }; code?: unknown } | null;
  const status = Number(value?.response?.status ?? value?.code);
  return Number.isFinite(status) && status >= 100 && status <= 599 ? status : null;
}

export function isTransientGooglePlayError(error: unknown): boolean {
  const status = googlePlayErrorStatus(error);
  if (status !== null) return status === 408 || status === 429 || status >= 500;
  const code = (error as { code?: string } | null)?.code;
  return ["ETIMEDOUT", "ECONNRESET", "ECONNREFUSED", "ENOTFOUND", "EAI_AGAIN"].includes(code ?? "");
}

export function canUseCachedGooglePlayEntitlement(
  cached: {
    subscriptionStatus?: string | null;
    subscriptionExpiresAt?: Date | string | null;
    subscriptionVerifiedAt?: Date | string | null;
    subscriptionProductId?: string | null;
    googlePlayPurchaseToken?: string | null;
    googlePlayProductId?: string | null;
  },
  now = new Date(),
): boolean {
  const productId = cached.googlePlayProductId ?? cached.subscriptionProductId;
  if (
    !cached.googlePlayPurchaseToken?.trim() ||
    !productId ||
    !subscriptionPlanForProductId(productId) ||
    (cached.googlePlayProductId &&
      cached.subscriptionProductId &&
      cached.googlePlayProductId !== cached.subscriptionProductId) ||
    !["active", "cancelled", "in_grace_period"].includes(
      cached.subscriptionStatus ?? "",
    )
  ) {
    return false;
  }

  const expiresAt =
    cached.subscriptionExpiresAt instanceof Date
      ? cached.subscriptionExpiresAt
      : cached.subscriptionExpiresAt
        ? new Date(cached.subscriptionExpiresAt)
        : null;
  const verifiedAt =
    cached.subscriptionVerifiedAt instanceof Date
      ? cached.subscriptionVerifiedAt
      : cached.subscriptionVerifiedAt
        ? new Date(cached.subscriptionVerifiedAt)
        : null;
  if (
    !expiresAt ||
    !Number.isFinite(expiresAt.getTime()) ||
    expiresAt.getTime() <= now.getTime() ||
    !verifiedAt ||
    !Number.isFinite(verifiedAt.getTime())
  ) {
    return false;
  }

  const verificationAge = now.getTime() - verifiedAt.getTime();
  return (
    verificationAge >= -5 * 60 * 1000 &&
    verificationAge <= GOOGLE_PLAY_CACHED_ENTITLEMENT_MAX_AGE_MS
  );
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
  const hasNotExpired = expiresAt !== null && expiresAt.getTime() > now.getTime();
  let status: GooglePlayEntitlement["status"];
  switch (state) {
    case "SUBSCRIPTION_STATE_ACTIVE":
      status = "active";
      break;
    case "SUBSCRIPTION_STATE_CANCELED":
      status = "cancelled";
      break;
    case "SUBSCRIPTION_STATE_IN_GRACE_PERIOD":
      status = "in_grace_period";
      break;
    case "SUBSCRIPTION_STATE_PENDING":
      status = "pending";
      break;
    case "SUBSCRIPTION_STATE_ON_HOLD":
      status = "on_hold";
      break;
    case "SUBSCRIPTION_STATE_PAUSED":
      status = "paused";
      break;
    case "SUBSCRIPTION_STATE_EXPIRED":
    case "SUBSCRIPTION_STATE_PENDING_PURCHASE_CANCELED":
      status = "expired";
      break;
    default:
      status = "inactive";
  }

  if (options.forceRevoke) {
    status = "revoked";
  } else if (
    (status === "active" ||
      status === "cancelled" ||
      status === "in_grace_period") &&
    !hasNotExpired
  ) {
    status = "expired";
  }

  const grantsAccess =
    !options.forceRevoke &&
    Boolean(
      tier &&
        hasNotExpired &&
        ["active", "cancelled", "in_grace_period"].includes(status),
    );
  const rawStartDate = snapshot.startTime;
  const parsedStartDate =
    typeof rawStartDate === "string" ? new Date(rawStartDate) : null;
  const startDate =
    parsedStartDate && Number.isFinite(parsedStartDate.getTime())
      ? parsedStartDate
      : null;
  const rawTransactionId =
    lineItem?.latestSuccessfulOrderId ?? snapshot.latestOrderId;
  const transactionId =
    typeof rawTransactionId === "string" ? rawTransactionId : null;
  const rawAutoRenew = lineItem?.autoRenewingPlan?.autoRenewEnabled;
  const autoRenew = typeof rawAutoRenew === "boolean" ? rawAutoRenew : null;

  return {
    status,
    tier: grantsAccess ? tier! : "free",
    productId,
    expiresAt,
    startDate,
    transactionId,
    autoRenew,
    grantsAccess,
  };
}