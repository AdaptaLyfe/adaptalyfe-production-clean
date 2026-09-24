import assert from "node:assert/strict";
import test from "node:test";

import {
  COUNTED_REWARD_REDEMPTION_STATUSES,
  hasReachedRewardRedemptionLimit,
} from "./reward-redemption-rules";

test("only pending, approved, and completed redemptions consume a limit", () => {
  assert.deepEqual(COUNTED_REWARD_REDEMPTION_STATUSES, [
    "pending",
    "approved",
    "completed",
  ]);
  assert.equal(
    (COUNTED_REWARD_REDEMPTION_STATUSES as readonly string[]).includes(
      "denied",
    ),
    false,
  );
});

test("a null maximum keeps redemption unlimited", () => {
  assert.equal(hasReachedRewardRedemptionLimit(null, 0), false);
  assert.equal(hasReachedRewardRedemptionLimit(null, 100), false);
});

test("a zero maximum blocks the first redemption", () => {
  assert.equal(hasReachedRewardRedemptionLimit(0, 0), true);
});

test("a finite maximum allows redemptions below the cap only", () => {
  assert.equal(hasReachedRewardRedemptionLimit(3, 0), false);
  assert.equal(hasReachedRewardRedemptionLimit(3, 2), false);
  assert.equal(hasReachedRewardRedemptionLimit(3, 3), true);
  assert.equal(hasReachedRewardRedemptionLimit(3, 4), true);
});