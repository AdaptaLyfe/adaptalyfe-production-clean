import assert from "node:assert/strict";
import test from "node:test";

import { resolveGooglePlayEntitlement } from "./google-play-entitlement";

const now = new Date("2026-10-02T00:00:00.000Z");

function snapshot(subscriptionState: string, expiryTime: string) {
  return {
    subscriptionState,
    lineItems: [
      {
        productId: "adaptalyfe_basic_monthly",
        expiryTime,
      },
    ],
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
    assert.equal(result.status, "active");
    assert.equal(result.tier, "basic");
  }
});

test("cancellation keeps access until the verified expiry", () => {
  const result = resolveGooglePlayEntitlement(
    snapshot("SUBSCRIPTION_STATE_CANCELED", "2026-11-02T00:00:00.000Z"),
    { now },
  );

  assert.equal(result.status, "active");
  assert.equal(result.tier, "basic");

  const expiredCancellation = resolveGooglePlayEntitlement(
    snapshot("SUBSCRIPTION_STATE_CANCELED", "2026-10-01T00:00:00.000Z"),
    { now },
  );
  assert.equal(expiredCancellation.status, "inactive");
});

test("expired, on-hold, paused, and pending purchases do not grant access", () => {
  for (const state of [
    "SUBSCRIPTION_STATE_EXPIRED",
    "SUBSCRIPTION_STATE_ON_HOLD",
    "SUBSCRIPTION_STATE_PAUSED",
    "SUBSCRIPTION_STATE_PENDING",
  ]) {
    const result = resolveGooglePlayEntitlement(
      snapshot(state, "2026-11-02T00:00:00.000Z"),
      { now },
    );
    assert.equal(result.status, "inactive", state);
    assert.equal(result.tier, "free", state);
  }

  const expired = resolveGooglePlayEntitlement(
    snapshot("SUBSCRIPTION_STATE_CANCELED", "2026-10-01T00:00:00.000Z"),
    { now },
  );
  assert.equal(expired.status, "inactive");
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

  assert.equal(unknownProduct.status, "inactive");
  assert.equal(missingExpiry.status, "inactive");
  assert.equal(revoked.status, "inactive");
});