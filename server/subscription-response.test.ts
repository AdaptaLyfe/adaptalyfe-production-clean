import assert from "node:assert/strict";
import test from "node:test";

import { FREE_TRIAL_DAYS } from "@shared/subscription";
import { buildSubscriptionResponse } from "./subscription-response";

const now = new Date("2026-10-05T12:00:00.000Z");

test("a new account receives a visible seven-day Basic trial", () => {
  const response = buildSubscriptionResponse(
    {
      id: 42,
      accountType: "user",
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      subscriptionPlatform: "web",
      createdAt: now,
    },
    now,
  );

  assert.equal(FREE_TRIAL_DAYS, 7);
  assert.equal(response.planType, "basic");
  assert.equal(response.status, "trialing");
  assert.equal(response.isAccountTrial, true);
  assert.equal(response.trialDaysLeft, 7);
  assert.equal(response.features.taskManagement, true);
  assert.equal(response.features.mealPlanning, false);
});

test("an account trial ends at seven days and cannot stay Basic-active", () => {
  const signup = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const response = buildSubscriptionResponse(
    {
      id: 42,
      accountType: "user",
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      subscriptionPlatform: "web",
      createdAt: signup,
    },
    now,
  );

  assert.equal(response.planType, "free");
  assert.equal(response.status, "expired");
  assert.equal(response.isAccountTrial, false);
  assert.equal(response.trialDaysLeft, null);
  assert.equal(response.features.taskManagement, false);
});

test("Google Play account hold remains visible and does not grant access", () => {
  const response = buildSubscriptionResponse(
    {
      id: 52,
      accountType: "user",
      subscriptionTier: "free",
      subscriptionStatus: "on_hold",
      subscriptionPlatform: "google_play",
      subscriptionProductId: "adaptalyfe_premium_monthly",
      googlePlayProductId: "adaptalyfe_premium_monthly",
      googlePlayPurchaseToken: "verified-token",
      subscriptionExpiresAt: new Date("2026-11-05T12:00:00.000Z"),
      subscriptionVerifiedAt: new Date("2026-10-05T11:30:00.000Z"),
      subscriptionAutoRenew: false,
      createdAt: new Date("2026-09-01T12:00:00.000Z"),
    },
    now,
  );

  assert.equal(response.planType, "premium");
  assert.equal(response.status, "on_hold");
  assert.equal(response.isAccountTrial, false);
  assert.equal(response.currentPeriodEnd?.toISOString(), "2026-11-05T12:00:00.000Z");
  assert.equal(response.autoRenew, false);
  assert.equal(response.features.mealPlanning, false);
});

test("Google Play renewal and recovery expose the renewed access period", () => {
  const response = buildSubscriptionResponse(
    {
      id: 53,
      accountType: "user",
      subscriptionTier: "family",
      subscriptionStatus: "active",
      subscriptionPlatform: "google_play",
      subscriptionProductId: "adaptalyfe_family_monthly",
      googlePlayProductId: "adaptalyfe_family_monthly",
      googlePlayPurchaseToken: "verified-token",
      subscriptionExpiresAt: new Date("2026-11-05T12:00:00.000Z"),
      subscriptionVerifiedAt: new Date("2026-10-05T11:30:00.000Z"),
      subscriptionAutoRenew: true,
      createdAt: new Date("2026-09-01T12:00:00.000Z"),
    },
    now,
  );

  assert.equal(response.planType, "family");
  assert.equal(response.status, "active");
  assert.equal(response.autoRenew, true);
  assert.equal(response.features.familyDashboard, true);
  assert.equal(response.currentPeriodEnd?.toISOString(), "2026-11-05T12:00:00.000Z");
});