import assert from "node:assert/strict";
import test from "node:test";

import {
  countCompletedMilestones,
  evaluateRewardBadges,
} from "./reward-badges";

test("keeps badges locked until their requirements are met", () => {
  const badges = evaluateRewardBadges({
    lifetimeEarned: 0,
    rewardsRedeemed: 0,
    completedMilestones: 0,
  });

  assert.equal(badges.every((badge) => !badge.isEarned), true);
  assert.deepEqual(
    badges.map((badge) => [badge.type, badge.progress, badge.target]),
    [
      ["first_reward", 0, 1],
      ["reward_collector", 0, 5],
      ["point_starter", 0, 100],
      ["point_master", 0, 500],
      ["milestone_achiever", 0, 1],
    ],
  );
});

test("evaluates points, redemptions, and milestones independently", () => {
  const badges = evaluateRewardBadges({
    lifetimeEarned: 500,
    rewardsRedeemed: 3,
    completedMilestones: 1,
  });

  assert.deepEqual(
    badges.filter((badge) => badge.isEarned).map((badge) => badge.type),
    ["first_reward", "point_starter", "point_master", "milestone_achiever"],
  );
  assert.equal(badges.find((badge) => badge.type === "reward_collector")?.progress, 3);
});

test("counts only explicitly completed milestone records", () => {
  assert.equal(
    countCompletedMilestones([
      { isCompleted: true },
      { isCompleted: false },
      { title: "Not completed" },
      "legacy milestone",
      null,
    ]),
    1,
  );
});