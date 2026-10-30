import assert from "node:assert/strict";
import test from "node:test";
import { createSubscriptionFeatureGuard, paidSubscriptionTier, requiredSubscriptionTierForPath } from "./subscription-access";

const now = new Date();
const fresh = (tier = "premium", status = "active") => ({
  id: 7,
  accountType: "user",
  subscriptionTier: tier,
  subscriptionStatus: status,
  subscriptionPlatform: "google_play",
  subscriptionProductId: `adaptalyfe_${tier}_monthly`,
  googlePlayProductId: `adaptalyfe_${tier}_monthly`,
  googlePlayPurchaseToken: "test-only-token",
  subscriptionExpiresAt: new Date(now.getTime() + 3_600_000),
  subscriptionVerifiedAt: now,
});

test("all three verified tiers are derived from the product, not selected tier", () => {
  for (const tier of ["basic", "premium", "family"]) {
    assert.equal(paidSubscriptionTier({ ...fresh(tier), subscriptionTier: "family" }, now), tier);
  }
});

test("cancelled and grace-period subscriptions remain usable until paid expiry", () => {
  for (const status of ["active", "cancelled", "in_grace_period"]) {
    assert.equal(paidSubscriptionTier(fresh("basic", status), now), "basic");
  }
});

test("expired, pending, held, paused, revoked, stale and unverified records fail closed", () => {
  for (const status of ["expired", "pending", "on_hold", "paused", "revoked", "inactive"]) {
    assert.equal(paidSubscriptionTier(fresh("family", status), now), "free");
  }
  assert.equal(paidSubscriptionTier({ ...fresh(), subscriptionExpiresAt: now }, now), "free");
  assert.equal(paidSubscriptionTier({ ...fresh(), subscriptionVerifiedAt: null }, now), "free");
  assert.equal(paidSubscriptionTier({ ...fresh(), googlePlayPurchaseToken: null }, now), "free");
  assert.equal(paidSubscriptionTier({ ...fresh(), subscriptionVerifiedAt: new Date(now.getTime() - 25 * 3_600_000) }, now), "free");
});

test("selected web tiers or admin-looking names are not verified entitlements", () => {
  assert.equal(paidSubscriptionTier({ subscriptionTier: "family", subscriptionStatus: "active" }), "free");
  assert.equal(paidSubscriptionTier({ username: "admin", accountType: "user" }), "free");
  assert.equal(paidSubscriptionTier({ accountType: "admin" }), "admin");
  assert.equal(paidSubscriptionTier({
    subscriptionTier: "premium", subscriptionStatus: "trialing", stripeSubscriptionId: "test-sub",
    subscriptionExpiresAt: fresh().subscriptionExpiresAt,
  }), "premium");
});

test("feature APIs separate Premium/Family modules from Family-only modules", () => {
  for (const path of ["/meal-plans/1", "/shopping-lists", "/academic-classes", "/medications", "/refill-orders"]) {
    assert.equal(requiredSubscriptionTierForPath(path), "premium");
  }
  assert.equal(requiredSubscriptionTierForPath("/family-members/invite"), "family");
  assert.equal(requiredSubscriptionTierForPath("/google-play/restore-purchases"), null);
  assert.equal(requiredSubscriptionTierForPath("/daily-tasks"), null);
  assert.equal(requiredSubscriptionTierForPath("/subscription"), null);
});

async function guardRequest(user: ReturnType<typeof fresh> | undefined, path = "/meal-plans", userId: number | null = 7) {
  const req = { path, session: { userId, user: { subscriptionTier: "family" } } };
  let status = 200;
  let passed = false;
  const res = { status(code: number) { status = code; return this; }, json(body: unknown) { return body; } };
  await createSubscriptionFeatureGuard(async () => user)(req, res, () => { passed = true; });
  return { status, passed, req };
}

test("Basic cannot bypass paid feature gates using a stale Family session", async () => {
  assert.equal((await guardRequest(fresh("basic"))).status, 403);
  assert.equal((await guardRequest(fresh("premium"))).passed, true);
  assert.equal((await guardRequest(fresh("premium"), "/family-members")).status, 403);
  assert.equal((await guardRequest(fresh("family"), "/family-members")).passed, true);
});

test("reinstall/second-device sessions use the same database account entitlement", async () => {
  for (let device = 0; device < 2; device++) {
    const result = await guardRequest(fresh("premium"));
    assert.equal(result.passed, true);
    assert.equal(result.req.session.user.subscriptionTier, "premium");
  }
  assert.equal((await guardRequest(undefined)).status, 401);
  assert.equal((await guardRequest(fresh(), "/meal-plans", null)).status, 401);
});

test("database failures do not fall back to a session's old paid tier", async () => {
  let status = 0;
  const res = { status(code: number) { status = code; return this; }, json() {} };
  await createSubscriptionFeatureGuard(async () => { throw new Error("database unavailable"); })(
    { path: "/meal-plans", session: { userId: 7, user: fresh("family") } }, res,
    () => assert.fail("must not grant access"),
  );
  assert.equal(status, 503);
});
test("Personal Records APIs (health records and documents) require Premium or Family", () => {
  for (const path of [
    "/allergies", "/allergies/3", "/medical-conditions", "/adverse-medications/9",
    "/personal-documents", "/personal-documents/upload", "/personal-documents/category/id",
  ]) {
    assert.equal(requiredSubscriptionTierForPath(path), "premium", path);
  }
  // Trusted/emergency contacts stay available on every plan (Basic feature).
  assert.equal(requiredSubscriptionTierForPath("/emergency-contacts"), null);
  assert.equal(requiredSubscriptionTierForPath("/sleep-entries"), null);
  assert.equal(requiredSubscriptionTierForPath("/mood-entries"), null);
});

test("Basic accounts are refused Personal Records APIs; Premium and Family are allowed", async () => {
  const guard = createSubscriptionFeatureGuard(async (id) => ({
    id,
    subscriptionTier: id === 1 ? "basic" : id === 2 ? "premium" : "family",
    subscriptionStatus: "active",
    stripeSubscriptionId: `sub_${id}`,
    subscriptionPlatform: "web",
  }));
  const run = async (userId: number) => {
    let status = 200;
    let nextCalled = false;
    const res: any = { status(code: number) { status = code; return this; }, json() { return this; } };
    await guard({ path: "/personal-documents", session: { userId, user: {} } }, res, () => { nextCalled = true; });
    return nextCalled ? 200 : status;
  };
  assert.equal(await run(1), 403);
  assert.equal(await run(2), 200);
  assert.equal(await run(3), 200);
});

test("plan rules for messaging, skills and rewards APIs", () => {
  assert.equal(requiredSubscriptionTierForPath("/messages"), "family");
  assert.equal(requiredSubscriptionTierForPath("/messages/12"), "family");
  assert.equal(requiredSubscriptionTierForPath("/transition-skills"), "premium");
  assert.equal(requiredSubscriptionTierForPath("/transition-skills/4"), "premium");
  assert.equal(requiredSubscriptionTierForPath("/rewards"), "premium");
  assert.equal(requiredSubscriptionTierForPath("/rewards/redeem"), "premium");
  assert.equal(requiredSubscriptionTierForPath("/rewards/badges"), "premium");
  // Caregiver-side endpoints and points stay open.
  assert.equal(requiredSubscriptionTierForPath("/rewards/caregiver"), null);
  assert.equal(requiredSubscriptionTierForPath("/caregiver/messages"), null);
  assert.equal(requiredSubscriptionTierForPath("/caregivers"), null);
  assert.equal(requiredSubscriptionTierForPath("/points/balance"), null);
  assert.equal(requiredSubscriptionTierForPath("/sleep-entries"), null);
});

test("messaging needs Family; Premium is refused; caregiver accounts are not blocked", async () => {
  const accounts: Record<number, any> = {
    1: { subscriptionTier: "premium", accountType: "user" },
    2: { subscriptionTier: "family", accountType: "user" },
    3: { subscriptionTier: "free", accountType: "caregiver" },
  };
  const guard = createSubscriptionFeatureGuard(async (id) => ({
    id, ...accounts[id], subscriptionStatus: "active", stripeSubscriptionId: `sub_${id}`, subscriptionPlatform: "web",
  }));
  const run = async (userId: number, path: string) => {
    let status = 200;
    let nextCalled = false;
    const res: any = { status(code: number) { status = code; return this; }, json() { return this; } };
    await guard({ path, session: { userId, user: {} } }, res, () => { nextCalled = true; });
    return nextCalled ? 200 : status;
  };
  assert.equal(await run(1, "/messages"), 403);
  assert.equal(await run(2, "/messages"), 200);
  assert.equal(await run(3, "/messages"), 200);
  assert.equal(await run(1, "/rewards"), 200);
  assert.equal(await run(3, "/rewards"), 200);
});
