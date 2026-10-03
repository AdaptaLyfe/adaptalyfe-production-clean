import assert from "node:assert/strict";
import test from "node:test";

import { Status } from "@apple/app-store-server-library";

import { resolveAppleSubscriptionEntitlement } from "./apple-subscription-entitlement";

const now = new Date("2026-10-02T00:00:00.000Z");

function candidate(
  status: Status,
  overrides: {
    productId?: string;
    expiresDate?: number;
    autoRenewStatus?: number;
    gracePeriodExpiresDate?: number;
    revocationDate?: number;
  } = {},
) {
  return {
    status,
    transaction: {
      productId: overrides.productId ?? "adaptalyfe_premium_monthly",
      transactionId: "2000000123456789",
      originalTransactionId: "2000000123450000",
      originalPurchaseDate: Date.parse("2026-09-02T00:00:00.000Z"),
      expiresDate:
        overrides.expiresDate ??
        Date.parse("2026-11-02T00:00:00.000Z"),
      revocationDate: overrides.revocationDate,
    },
    renewalInfo: {
      autoRenewStatus: overrides.autoRenewStatus ?? 1,
      gracePeriodExpiresDate: overrides.gracePeriodExpiresDate,
    },
  };
}

test("verified active Apple status grants the mapped plan until expiry", () => {
  const entitlement = resolveAppleSubscriptionEntitlement(
    [candidate(Status.ACTIVE)],
    now,
  );
  assert.equal(entitlement.status, "active");
  assert.equal(entitlement.tier, "premium");
  assert.equal(entitlement.grantsAccess, true);
  assert.equal(entitlement.transactionId, "2000000123456789");
  assert.equal(
    entitlement.originalTransactionId,
    "2000000123450000",
  );
  assert.equal(entitlement.autoRenew, true);
});

test("turning off renewal retains access until the paid period ends", () => {
  const entitlement = resolveAppleSubscriptionEntitlement(
    [candidate(Status.ACTIVE, { autoRenewStatus: 0 })],
    now,
  );
  assert.equal(entitlement.status, "cancelled");
  assert.equal(entitlement.tier, "premium");
  assert.equal(entitlement.grantsAccess, true);
});

test("billing grace period grants access only through its verified end", () => {
  const graceEnd = Date.parse("2026-10-05T00:00:00.000Z");
  const inGrace = resolveAppleSubscriptionEntitlement(
    [
      candidate(Status.BILLING_GRACE_PERIOD, {
        expiresDate: Date.parse("2026-10-01T00:00:00.000Z"),
        gracePeriodExpiresDate: graceEnd,
      }),
    ],
    now,
  );
  assert.equal(inGrace.status, "in_grace_period");
  assert.equal(inGrace.grantsAccess, true);
  assert.equal(inGrace.expiresAt?.getTime(), graceEnd);

  const endedGrace = resolveAppleSubscriptionEntitlement(
    [
      candidate(Status.BILLING_GRACE_PERIOD, {
        expiresDate: Date.parse("2026-10-01T00:00:00.000Z"),
        gracePeriodExpiresDate: Date.parse("2026-10-01T12:00:00.000Z"),
      }),
    ],
    now,
  );
  assert.equal(endedGrace.status, "past_due");
  assert.equal(endedGrace.grantsAccess, false);
});

test("expired, retrying, revoked, and unknown products fail closed", () => {
  for (const status of [
    Status.EXPIRED,
    Status.BILLING_RETRY,
    Status.REVOKED,
  ]) {
    const entitlement = resolveAppleSubscriptionEntitlement(
      [candidate(status)],
      now,
    );
    assert.equal(entitlement.grantsAccess, false, String(status));
    assert.equal(entitlement.tier, "free", String(status));
  }

  const refunded = resolveAppleSubscriptionEntitlement(
    [candidate(Status.ACTIVE, { revocationDate: now.getTime() })],
    now,
  );
  assert.equal(refunded.status, "revoked");
  assert.equal(refunded.grantsAccess, false);

  const unknownProduct = resolveAppleSubscriptionEntitlement(
    [candidate(Status.ACTIVE, { productId: "unconfigured_product" })],
    now,
  );
  assert.equal(unknownProduct.status, "inactive");
  assert.equal(unknownProduct.grantsAccess, false);
});

test("an entitled current plan wins over an older expired plan", () => {
  const entitlement = resolveAppleSubscriptionEntitlement(
    [
      candidate(Status.EXPIRED, {
        productId: "adaptalyfe_family_monthly",
        expiresDate: Date.parse("2026-10-01T00:00:00.000Z"),
      }),
      candidate(Status.ACTIVE, {
        productId: "adaptalyfe_basic_monthly",
      }),
    ],
    now,
  );
  assert.equal(entitlement.status, "active");
  assert.equal(entitlement.productId, "adaptalyfe_basic_monthly");
  assert.equal(entitlement.tier, "basic");
});