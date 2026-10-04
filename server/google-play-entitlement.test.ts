import assert from "node:assert/strict";
import test from "node:test";

import {
  canUseCachedGooglePlayEntitlement,
  isTransientGooglePlayError,
  resolveGooglePlayEntitlement,
  subscriptionPlanForProductId,
} from "./google-play-entitlement";

const now = new Date("2026-10-02T00:00:00.000Z");

function snapshot(
  subscriptionState: string,
  expiryTime: string,
  productId = "adaptalyfe_basic_monthly",
) {
  return {
    subscriptionState,
    lineItems: [
      {
        productId,
        expiryTime,
        latestSuccessfulOrderId: "GPA.1234-5678-9012-34567",
        autoRenewingPlan: { autoRenewEnabled: true },
      },
    ],
    startTime: "2026-10-01T00:00:00.000Z",
  };
}

test("active and grace-period purchases grant access through their verified expiry", () => {
  for (const state of [
    "SUBSCRIPTION_STATE_ACTIVE",
    "SUBSCRIPTION_STATE_IN_GRACE_PERIOD",
  ]) {
    const result = resolveGooglePlayEntitlement(
      snapshot(state, "2026-11-02T00:00:00.000Z"),
      { now },
    );
    assert.equal(
      result.status,
      state === "SUBSCRIPTION_STATE_ACTIVE" ? "active" : "in_grace_period",
    );
    assert.equal(result.tier, "basic");
    assert.equal(result.grantsAccess, true);
  }
});

test("only transient Play errors allow outage fallback, never invalid tokens or permissions", () => {
  for (const status of [400, 401, 403, 404, 410]) {
    assert.equal(isTransientGooglePlayError({ response: { status } }), false);
  }
  for (const status of [408, 429, 500, 502, 503, 504]) {
    assert.equal(isTransientGooglePlayError({ response: { status } }), true);
  }
  assert.equal(isTransientGooglePlayError({ code: "ETIMEDOUT" }), true);
  assert.equal(isTransientGooglePlayError(new Error("database write failed")), false);
  assert.equal(isTransientGooglePlayError(new Error("not configured")), false);
});

test("cancellation keeps access until the verified expiry", () => {
  const result = resolveGooglePlayEntitlement(
    snapshot("SUBSCRIPTION_STATE_CANCELED", "2026-11-02T00:00:00.000Z"),
    { now },
  );

  assert.equal(result.status, "cancelled");
  assert.equal(result.tier, "basic");
  assert.equal(result.grantsAccess, true);
  assert.equal(result.autoRenew, true);
  assert.equal(result.transactionId, "GPA.1234-5678-9012-34567");
  assert.equal(result.startDate?.toISOString(), "2026-10-01T00:00:00.000Z");

  const expiredCancellation = resolveGooglePlayEntitlement(
    snapshot("SUBSCRIPTION_STATE_CANCELED", "2026-10-01T00:00:00.000Z"),
    { now },
  );
  assert.equal(expiredCancellation.status, "expired");
  assert.equal(expiredCancellation.grantsAccess, false);
});

test("expired, on-hold, paused, and pending purchases do not grant access", () => {
  const expectedStatuses: Record<string, string> = {
    SUBSCRIPTION_STATE_EXPIRED: "expired",
    SUBSCRIPTION_STATE_ON_HOLD: "on_hold",
    SUBSCRIPTION_STATE_PAUSED: "paused",
    SUBSCRIPTION_STATE_PENDING: "pending",
  };
  for (const [state, expectedStatus] of Object.entries(expectedStatuses)) {
    const result = resolveGooglePlayEntitlement(
      snapshot(state, "2026-11-02T00:00:00.000Z"),
      { now },
    );
    assert.equal(result.status, expectedStatus, state);
    assert.equal(result.tier, "free", state);
    assert.equal(result.grantsAccess, false, state);
  }

  const expired = resolveGooglePlayEntitlement(
    snapshot("SUBSCRIPTION_STATE_CANCELED", "2026-10-01T00:00:00.000Z"),
    { now },
  );
  assert.equal(expired.status, "expired");
});

test("unknown products, missing expiry, and explicit revocation fail closed", () => {
  const unknownProduct = resolveGooglePlayEntitlement(
    {
      subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
      lineItems: [
        {
          productId: "unconfigured_product",
          expiryTime: "2026-11-02T00:00:00.000Z",
        },
      ],
    },
    { now },
  );
  const missingExpiry = resolveGooglePlayEntitlement(
    {
      subscriptionState: "SUBSCRIPTION_STATE_ACTIVE",
      lineItems: [{ productId: "adaptalyfe_basic_monthly" }],
    },
    { now },
  );
  const revoked = resolveGooglePlayEntitlement(
    snapshot("SUBSCRIPTION_STATE_CANCELED", "2026-11-02T00:00:00.000Z"),
    { now, forceRevoke: true },
  );

  assert.equal(unknownProduct.grantsAccess, false);
  assert.equal(missingExpiry.grantsAccess, false);
  assert.equal(revoked.status, "revoked");
  assert.equal(revoked.grantsAccess, false);
});

test("all mobile store product IDs resolve to one canonical plan map", () => {
  assert.equal(subscriptionPlanForProductId("adaptalyfe_basic_monthly")?.planType, "basic");
  assert.equal(subscriptionPlanForProductId("adaptalyfe_premium_monthly")?.planType, "premium");
  assert.equal(subscriptionPlanForProductId("adaptalyfe_family_monthly")?.planType, "family");
  assert.equal(subscriptionPlanForProductId("not-a-product"), null);
});

test("verified active Play products grant only their mapped plan tier", () => {
  const plans = [
    ["adaptalyfe_basic_monthly", "basic"],
    ["adaptalyfe_premium_monthly", "premium"],
    ["adaptalyfe_family_monthly", "family"],
  ] as const;

  for (const [productId, expectedTier] of plans) {
    const result = resolveGooglePlayEntitlement(
      snapshot(
        "SUBSCRIPTION_STATE_ACTIVE",
        "2026-11-02T00:00:00.000Z",
        productId,
      ),
      { expectedProductId: productId, now },
    );

    assert.equal(result.productId, productId);
    assert.equal(result.tier, expectedTier);
    assert.equal(result.grantsAccess, true);
  }
});

test("cached store access is a short outage fallback for a verified purchase", () => {
  const verifiedAt = new Date("2026-10-01T23:30:00.000Z");
  const now = new Date("2026-10-02T00:00:00.000Z");
  const cached = {
    subscriptionStatus: "active",
    subscriptionExpiresAt: new Date("2026-11-02T00:00:00.000Z"),
    subscriptionVerifiedAt: verifiedAt,
    subscriptionProductId: "adaptalyfe_premium_monthly",
    googlePlayProductId: "adaptalyfe_premium_monthly",
    googlePlayPurchaseToken: "verified-token",
  };

  assert.equal(canUseCachedGooglePlayEntitlement(cached, now), true);
  assert.equal(
    canUseCachedGooglePlayEntitlement(
      {
        ...cached,
        subscriptionVerifiedAt: new Date("2026-09-30T00:00:00.000Z"),
      },
      now,
    ),
    false,
  );
  assert.equal(
    canUseCachedGooglePlayEntitlement(
      {
        ...cached,
        subscriptionStatus: "revoked",
      },
      now,
    ),
    false,
  );
  assert.equal(
    canUseCachedGooglePlayEntitlement(
      {
        ...cached,
        subscriptionExpiresAt: new Date("2026-10-01T00:00:00.000Z"),
      },
      now,
    ),
    false,
  );
  assert.equal(
    canUseCachedGooglePlayEntitlement(
      {
        ...cached,
        subscriptionProductId: "adaptalyfe_basic_monthly",
      },
      now,
    ),
    false,
  );
});