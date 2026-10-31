import assert from "node:assert/strict";
import test from "node:test";
import { hasActivePaidSubscription, isCancelledButRunning } from "./subscription-state";

test("active paid subscription is shown as subscribed", () => {
  assert.equal(hasActivePaidSubscription({ subscriptionStatus: "active" }, { status: "active", isAccountTrial: false }), true);
});

test("ended subscription (missed webhook) is NOT shown as subscribed", () => {
  // User record still says active, but the server says the paid-through date passed.
  assert.equal(hasActivePaidSubscription({ subscriptionStatus: "active" }, { status: "expired", isAccountTrial: false }), false);
  assert.equal(hasActivePaidSubscription({ subscriptionStatus: "active" }, { status: "trialing", isAccountTrial: true }), false);
});

test("not subscribed when the account record is not active", () => {
  assert.equal(hasActivePaidSubscription({ subscriptionStatus: "cancelled" }, { status: "expired" }), false);
  assert.equal(hasActivePaidSubscription(null, null), false);
});

test("while the subscription response is loading, trust the account record", () => {
  assert.equal(hasActivePaidSubscription({ subscriptionStatus: "active" }, undefined), true);
});

test("cancelled-but-running is only for website subscriptions with auto-renew off", () => {
  const user = { subscriptionStatus: "active", subscriptionPlatform: "web" };
  assert.equal(isCancelledButRunning(user, { status: "active", autoRenew: false, subscriptionPlatform: "web" }), true);
  assert.equal(isCancelledButRunning(user, { status: "active", autoRenew: true, subscriptionPlatform: "web" }), false);
  assert.equal(isCancelledButRunning(user, { status: "active", autoRenew: null, subscriptionPlatform: "web" }), false);
  assert.equal(isCancelledButRunning(user, { status: "active", autoRenew: false, subscriptionPlatform: "google_play" }), false);
  assert.equal(isCancelledButRunning(user, { status: "expired", autoRenew: false, subscriptionPlatform: "web" }), false);
});
