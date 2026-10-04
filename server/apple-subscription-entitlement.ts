import {
  Status,
} from "@apple/app-store-server-library";

import { subscriptionPlanForProductId } from "./google-play-entitlement";

export type AppleEntitlementStatus =
  | "active"
  | "cancelled"
  | "in_grace_period"
  | "past_due"
  | "expired"
  | "revoked"
  | "inactive";

export interface AppleSubscriptionCandidate {
  status?: unknown;
  transaction: {
    productId?: unknown;
    transactionId?: unknown;
    originalTransactionId?: unknown;
    originalPurchaseDate?: unknown;
    purchaseDate?: unknown;
    expiresDate?: unknown;
    revocationDate?: unknown;
  };
  renewalInfo?: {
    autoRenewStatus?: unknown;
    gracePeriodExpiresDate?: unknown;
  } | null;
}

export interface AppleSubscriptionEntitlement {
  status: AppleEntitlementStatus;
  tier: "basic" | "premium" | "family" | "free";
  productId: string | null;
  transactionId: string | null;
  originalTransactionId: string | null;
  startDate: Date | null;
  expiresAt: Date | null;
  autoRenew: boolean | null;
  grantsAccess: boolean;
}

function dateFromMilliseconds(value: unknown): Date | null {
  const milliseconds =
    typeof value === "number"
      ? value
      : typeof value === "string"
        ? Number(value)
        : Number.NaN;
  if (!Number.isFinite(milliseconds) || milliseconds <= 0) return null;
  const date = new Date(milliseconds);
  return Number.isFinite(date.getTime()) ? date : null;
}

function autoRenewValue(value: unknown): boolean | null {
  if (value === 1 || value === "1") return true;
  if (value === 0 || value === "0") return false;
  return null;
}

function resolveCandidate(
  candidate: AppleSubscriptionCandidate,
  now: Date,
): AppleSubscriptionEntitlement | null {
  const transaction = candidate.transaction;
  const productId =
    typeof transaction.productId === "string" ? transaction.productId : null;
  const plan = subscriptionPlanForProductId(productId);
  if (!plan || !productId) return null;

  const renewalInfo = candidate.renewalInfo;
  const transactionExpiry = dateFromMilliseconds(transaction.expiresDate);
  const graceExpiry = dateFromMilliseconds(renewalInfo?.gracePeriodExpiresDate);
  const statusCode = Number(candidate.status);
  const autoRenew = autoRenewValue(renewalInfo?.autoRenewStatus);
  const isRevoked =
    statusCode === Status.REVOKED || transaction.revocationDate != null;

  let status: AppleEntitlementStatus;
  switch (statusCode) {
    case Status.ACTIVE:
      status = autoRenew === false ? "cancelled" : "active";
      break;
    case Status.EXPIRED:
      status = "expired";
      break;
    case Status.BILLING_RETRY:
      status = "past_due";
      break;
    case Status.BILLING_GRACE_PERIOD:
      status = "in_grace_period";
      break;
    case Status.REVOKED:
      status = "revoked";
      break;
    default:
      status = "inactive";
  }

  if (isRevoked) {
    status = "revoked";
  } else if (
    (status === "active" || status === "cancelled") &&
    (!transactionExpiry || transactionExpiry.getTime() <= now.getTime())
  ) {
    status = "expired";
  } else if (
    status === "in_grace_period" &&
    (!graceExpiry || graceExpiry.getTime() <= now.getTime())
  ) {
    status = "past_due";
  }

  const expiresAt =
    status === "in_grace_period" &&
    graceExpiry &&
    (!transactionExpiry || graceExpiry.getTime() > transactionExpiry.getTime())
      ? graceExpiry
      : transactionExpiry;
  const grantsAccess =
    !isRevoked &&
    ((status === "active" || status === "cancelled") &&
      Boolean(transactionExpiry && transactionExpiry.getTime() > now.getTime()) ||
      status === "in_grace_period" &&
        Boolean(expiresAt && expiresAt.getTime() > now.getTime()));

  return {
    status,
    tier: grantsAccess ? plan.planType : "free",
    productId,
    transactionId:
      typeof transaction.transactionId === "string"
        ? transaction.transactionId
        : null,
    originalTransactionId:
      typeof transaction.originalTransactionId === "string"
        ? transaction.originalTransactionId
        : null,
    startDate:
      dateFromMilliseconds(transaction.originalPurchaseDate) ??
      dateFromMilliseconds(transaction.purchaseDate),
    expiresAt,
    autoRenew,
    grantsAccess,
  };
}

export function resolveAppleSubscriptionEntitlement(
  candidates: AppleSubscriptionCandidate[],
  now = new Date(),
): AppleSubscriptionEntitlement {
  const resolved = candidates
    .map((candidate) => resolveCandidate(candidate, now))
    .filter((candidate): candidate is AppleSubscriptionEntitlement =>
      Boolean(candidate),
    );
  resolved.sort((left, right) => {
    if (left.grantsAccess !== right.grantsAccess) {
      return left.grantsAccess ? -1 : 1;
    }
    return (
      (right.expiresAt?.getTime() ?? 0) - (left.expiresAt?.getTime() ?? 0)
    );
  });
  return (
    resolved[0] ?? {
      status: "inactive",
      tier: "free",
      productId: null,
      transactionId: null,
      originalTransactionId: null,
      startDate: null,
      expiresAt: null,
      autoRenew: null,
      grantsAccess: false,
    }
  );
}