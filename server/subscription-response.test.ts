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

test("Apple annual subscription exposes the annual billing cycle", () => {
  const response = buildSubscriptionResponse(
    {
      id: 54,
      accountType: "user",
      subscriptionTier: "premium",
      subscriptionStatus: "active",
      subscriptionPlatform: "app_store",
      subscriptionProductId: "adaptalyfe_premium_annual",
      appleOriginalTransactionId: "2000000123450000",
      subscriptionExpiresAt: new Date("2027-10-05T12:00:00.000Z"),
      subscriptionVerifiedAt: new Date("2026-10-05T11:30:00.000Z"),
      subscriptionAutoRenew: true,
      createdAt: new Date("2026-09-01T12:00:00.000Z"),
    },
    now,
  );

  assert.equal(response.planType, "premium");
  assert.equal(response.status, "active");
  assert.equal(response.billingCycle, "annual");
  assert.equal(response.currentPeriodEnd?.toISOString(), "2027-10-05T12:00:00.000Z");
});
test("a website (Stripe) yearly subscription reports an annual billing cycle", () => {
  const expires = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const response = buildSubscriptionResponse(
    {
      id: 43,
      accountType: "user",
      subscriptionTier: "premium",
      subscriptionStatus: "active",
      subscriptionPlatform: "web",
      stripeSubscriptionId: "sub_test_annual",
      subscriptionProductId: "stripe_premium_annual",
      subscriptionExpiresAt: expires,
      createdAt: now,
    },
    now,
  );

  assert.equal(response.planType, "premium");
  assert.equal(response.billingCycle, "annual");
});

test("a website subscription without a stored cycle still defaults to monthly", () => {
  const expires = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  const response = buildSubscriptionResponse(
    {
      id: 44,
      accountType: "user",
      subscriptionTier: "basic",
      subscriptionStatus: "active",
      subscriptionPlatform: "web",
      stripeSubscriptionId: "sub_test_monthly",
      subscriptionExpiresAt: expires,
      createdAt: now,
    },
    now,
  );

  assert.equal(response.billingCycle, "monthly");
});

test("trial countdown: 7 → 1 day left, then expired exactly at 7 days", () => {
  const DAY = 24 * 60 * 60 * 1000;
  const at = (agoMs: number) =>
    buildSubscriptionResponse(
      {
        id: 7,
        accountType: "user",
        subscriptionTier: "free",
        subscriptionStatus: "inactive",
        subscriptionPlatform: "web",
        createdAt: new Date(now.getTime() - agoMs),
      },
      now,
    );

  assert.equal(at(60 * 60 * 1000).trialDaysLeft, 7);
  assert.equal(at(1 * DAY).trialDaysLeft, 6);
  assert.equal(at(6 * DAY).trialDaysLeft, 1);
  assert.equal(at(7 * DAY - 60 * 1000).trialDaysLeft, 1);
  assert.equal(at(7 * DAY - 60 * 1000).status, "trialing");

  for (const ago of [7 * DAY, 7 * DAY + 60 * 1000, 30 * DAY]) {
    const expired = at(ago);
    assert.equal(expired.status, "expired");
    assert.equal(expired.planType, "free");
    assert.equal(expired.isAccountTrial, false);
    assert.equal(expired.trialDaysLeft, null);
  }
});

test("trial never shows more than 7 days, even with a sign-up time in the future", () => {
  const response = buildSubscriptionResponse(
    {
      id: 8,
      accountType: "user",
      subscriptionTier: "free",
      subscriptionStatus: "inactive",
      subscriptionPlatform: "web",
      createdAt: new Date(now.getTime() + 5.5 * 60 * 60 * 1000),
    },
    now,
  );
  assert.equal(response.trialDaysLeft, 7);
});

test("Personal Records: off for the account trial and Basic, on for Premium and Family", () => {
  const base = { accountType: "user", subscriptionPlatform: "web", stripeSubscriptionId: "sub_x", subscriptionStatus: "active" };
  const trial = buildSubscriptionResponse({ id: 1, accountType: "user", subscriptionTier: "free", subscriptionStatus: "inactive", subscriptionPlatform: "web", createdAt: now }, now);
  const basic = buildSubscriptionResponse({ id: 2, ...base, subscriptionTier: "basic", createdAt: now }, now);
  const premium = buildSubscriptionResponse({ id: 3, ...base, subscriptionTier: "premium", createdAt: now }, now);
  const family = buildSubscriptionResponse({ id: 4, ...base, subscriptionTier: "family", createdAt: now }, now);
  assert.equal(trial.features.personalRecords, false);
  assert.equal(basic.features.personalRecords, false);
  assert.equal(premium.features.personalRecords, true);
  assert.equal(family.features.personalRecords, true);
});

test("Skills, Rewards: Premium and Family; caregiver messaging: Family only", () => {
  const base = { accountType: "user", subscriptionPlatform: "web", stripeSubscriptionId: "sub_x", subscriptionStatus: "active", createdAt: now };
  const trial = buildSubscriptionResponse({ id: 1, accountType: "user", subscriptionTier: "free", subscriptionStatus: "inactive", subscriptionPlatform: "web", createdAt: now }, now);
  const basic = buildSubscriptionResponse({ id: 2, ...base, subscriptionTier: "basic" }, now);
  const premium = buildSubscriptionResponse({ id: 3, ...base, subscriptionTier: "premium" }, now);
  const family = buildSubscriptionResponse({ id: 4, ...base, subscriptionTier: "family" }, now);
  for (const r of [trial, basic]) {
    assert.equal(r.features.skillsMilestones, false);
    assert.equal(r.features.rewards, false);
    assert.equal(r.features.caregiverMessaging, false);
  }
  assert.equal(premium.features.skillsMilestones, true);
  assert.equal(premium.features.rewards, true);
  assert.equal(premium.features.caregiverMessaging, false);
  assert.equal(family.features.skillsMilestones, true);
  assert.equal(family.features.rewards, true);
  assert.equal(family.features.caregiverMessaging, true);
});
