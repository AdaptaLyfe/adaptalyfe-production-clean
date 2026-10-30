import assert from "node:assert/strict";
import test from "node:test";

import { FREE_TRIAL_DAYS } from "@shared/subscription";
import { stripeTrialEndForCheckout } from "./stripe-trial-policy";

const DAY = 24 * 60 * 60 * 1000;
const now = new Date("2026-10-30T06:30:00.000Z");
const seconds = (ms: number) => Math.floor(ms / 1000);
const signedUpAgo = (ms: number) => new Date(now.getTime() - ms);

test("paying right after sign-up: free until the account trial ends (7 days)", () => {
  const end = stripeTrialEndForCheckout({ createdAt: signedUpAgo(0) }, null, now);
  assert.equal(end, seconds(now.getTime() + FREE_TRIAL_DAYS * DAY));
});

test("paying on day 5: only the 2 remaining trial days are free, not 7 more", () => {
  const end = stripeTrialEndForCheckout({ createdAt: signedUpAgo(5 * DAY) }, null, now);
  assert.equal(end, seconds(now.getTime() + 2 * DAY));
});

test("paying after the account trial ended: charged immediately", () => {
  assert.equal(stripeTrialEndForCheckout({ createdAt: signedUpAgo(8 * DAY) }, null, now), null);
  assert.equal(stripeTrialEndForCheckout({ createdAt: signedUpAgo(7 * DAY) }, null, now), null);
});

test("less than an hour of trial left: charged immediately", () => {
  const end = stripeTrialEndForCheckout({ createdAt: signedUpAgo(7 * DAY - 30 * 60 * 1000) }, null, now);
  assert.equal(end, null);
});

test("an account that already had a confirmed web subscription gets no second trial", () => {
  const account = { createdAt: signedUpAgo(1 * DAY), subscriptionProductId: "stripe_premium_monthly" };
  assert.equal(stripeTrialEndForCheckout(account, { status: "canceled", trial_end: null }, now), null);
  assert.equal(stripeTrialEndForCheckout(account, null, now), null);
});

test("switching plan during a confirmed Stripe trial keeps the same end date", () => {
  const runningTrialEnd = seconds(now.getTime() + 3 * DAY);
  const end = stripeTrialEndForCheckout(
    { createdAt: signedUpAgo(4 * DAY), subscriptionProductId: "stripe_basic_monthly" },
    { status: "trialing", trial_end: runningTrialEnd },
    now,
  );
  assert.equal(end, runningTrialEnd);
});

test("an abandoned (never confirmed) checkout does not use up the trial", () => {
  const end = stripeTrialEndForCheckout(
    { createdAt: signedUpAgo(1 * DAY), subscriptionProductId: null },
    { status: "trialing", trial_end: seconds(now.getTime() + 20 * DAY) },
    now,
  );
  // Falls back to the account trial, never the longer abandoned one.
  assert.equal(end, seconds(now.getTime() + 6 * DAY));
});

test("store purchases (Google/Apple product IDs) are not treated as a used web trial", () => {
  const end = stripeTrialEndForCheckout(
    { createdAt: signedUpAgo(2 * DAY), subscriptionProductId: "adaptalyfe_premium_monthly" },
    null,
    now,
  );
  assert.equal(end, seconds(now.getTime() + 5 * DAY));
});

test("missing or invalid sign-up date: no trial", () => {
  assert.equal(stripeTrialEndForCheckout({ createdAt: null }, null, now), null);
  assert.equal(stripeTrialEndForCheckout({ createdAt: "not a date" }, null, now), null);
});
