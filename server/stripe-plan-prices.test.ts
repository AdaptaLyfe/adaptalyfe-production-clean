import assert from "node:assert/strict";
import { describe, it, beforeEach, afterEach } from "node:test";
import {
  getConfiguredStripePriceId,
  isStripeBillingCycle,
  isStripePlanType,
  listMissingStripePriceEnvVars,
  stripePlanKey,
  STRIPE_PLAN_AMOUNTS,
} from "./stripe-plan-prices";

const ENV_KEYS = [
  "STRIPE_PRICE_BASIC_MONTHLY",
  "STRIPE_PRICE_BASIC_ANNUAL",
  "STRIPE_PRICE_PREMIUM_MONTHLY",
  "STRIPE_PRICE_PREMIUM_ANNUAL",
  "STRIPE_PRICE_FAMILY_MONTHLY",
  "STRIPE_PRICE_FAMILY_ANNUAL",
] as const;

describe("stripe-plan-prices", () => {
  const saved: Record<string, string | undefined> = {};

  beforeEach(() => {
    for (const key of ENV_KEYS) {
      saved[key] = process.env[key];
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of ENV_KEYS) {
      if (saved[key] === undefined) delete process.env[key];
      else process.env[key] = saved[key];
    }
  });

  it("validates plan and billing cycle", () => {
    assert.equal(isStripePlanType("basic"), true);
    assert.equal(isStripePlanType("free"), false);
    assert.equal(isStripeBillingCycle("annual"), true);
    assert.equal(isStripeBillingCycle("yearly"), false);
  });

  it("builds plan_key metadata labels", () => {
    assert.equal(stripePlanKey("basic", "monthly"), "adaptalyfe_basic_monthly");
    assert.equal(stripePlanKey("family", "annual"), "adaptalyfe_family_annual");
  });

  it("exposes expected amounts in cents", () => {
    assert.equal(STRIPE_PLAN_AMOUNTS.basic.monthly, 499);
    assert.equal(STRIPE_PLAN_AMOUNTS.premium.annual, 12999);
    assert.equal(STRIPE_PLAN_AMOUNTS.family.monthly, 2499);
  });

  it("reads configured price ids from env", () => {
    assert.equal(getConfiguredStripePriceId("basic", "monthly"), null);
    process.env.STRIPE_PRICE_BASIC_MONTHLY = " price_test_basic_mo ";
    assert.equal(
      getConfiguredStripePriceId("basic", "monthly"),
      "price_test_basic_mo",
    );
  });

  it("lists missing env vars", () => {
    assert.deepEqual(listMissingStripePriceEnvVars(), [...ENV_KEYS]);
    process.env.STRIPE_PRICE_BASIC_MONTHLY = "price_x";
    assert.ok(!listMissingStripePriceEnvVars().includes("STRIPE_PRICE_BASIC_MONTHLY"));
  });
});
